from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence

from sqlalchemy.orm import Session

from app.ml.forecast import (
    ForecastPredictor,
    ForecastTrainer,
    ForecastTrainingOutput,
)
from app.repositories.forecast_repository import ForecastRepository


_MODEL_REGISTRY: Dict[int, Any] = {}


class ForecastService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = ForecastRepository(db)

    def train_model(
        self,
        horizon_days: int = 1,
        hotspot_id: Optional[int] = None,
        model_version: str = "forecast-v1",
        min_history_per_hotspot: int = 4,
    ) -> Dict[str, Any]:
        eis_scores = self.repository.get_historical_eis_scores(hotspot_id=hotspot_id)

        trainer = ForecastTrainer(model_version=model_version)
        output = trainer.train(
            eis_scores=eis_scores,
            horizon_days=horizon_days,
            min_history_per_hotspot=min_history_per_hotspot,
        )

        _MODEL_REGISTRY[horizon_days] = output.model

        return {
            "status": "trained",
            "horizon_days": horizon_days,
            "model_version": output.model.model_version,
            "model_type": output.training_result.model_type,
            "rows_used": output.rows_used,
            "train_size": output.training_result.train_size,
            "validation_size": output.training_result.validation_size,
            "mae": output.training_result.mae,
            "r2": output.training_result.r2,
            "feature_names": output.training_result.feature_names,
        }

    def generate_forecasts(
        self,
        horizon_days: int = 1,
        hotspot_id: Optional[int] = None,
        replace_existing: bool = True,
        pipeline_run_id: Optional[str] = None,
        commit: bool = True,
    ) -> Dict[str, Any]:
        model = _MODEL_REGISTRY.get(horizon_days)

        if model is None:
            raise RuntimeError(
                f"Forecast model for horizon_days={horizon_days} is not trained. "
                "Call POST /forecast/train first."
            )

        eis_scores = self.repository.get_historical_eis_scores(hotspot_id=hotspot_id)

        predictor = ForecastPredictor(model=model)
        outputs = predictor.predict(
            eis_scores=eis_scores,
            horizon_days=horizon_days,
        )

        if replace_existing:
            self.repository.delete_existing_forecasts(
                horizon_days=horizon_days,
                model_version=model.model_version,
            )

        rows: List[Dict[str, Any]] = []
        for item in outputs:
            rows.append(
                {
                    "hotspot_id": item.hotspot_id,
                    "forecast_date": item.forecast_for_date,
                    "horizon_days": item.horizon_days,
                    "predicted_eis": item.predicted_eis,
                    "predicted_risk_category": item.predicted_risk_category,
                    "confidence_lower": item.confidence_lower,
                    "confidence_upper": item.confidence_upper,
                    "shap_values": item.shap_values,
                    "top_features": item.top_features,
                    "model_version": item.model_version,
                    "pipeline_run_id": pipeline_run_id,
                }
            )

        created = self.repository.bulk_create_forecasts(rows, commit=False)

        if commit:
            self.db.commit()

        return {
            "status": "generated",
            "horizon_days": horizon_days,
            "model_version": model.model_version,
            "forecasts_created": len(created),
            "replace_existing": replace_existing,
            "pipeline_run_id": pipeline_run_id,
        }

    def list_forecasts(
        self,
        hotspot_id: Optional[int] = None,
        horizon_days: Optional[int] = None,
        risk_category: Optional[str] = None,
        model_version: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        rows = self.repository.list_forecasts(
            hotspot_id=hotspot_id,
            horizon_days=horizon_days,
            risk_category=risk_category,
            model_version=model_version,
            limit=limit,
            offset=offset,
        )
        return [self._serialize_forecast(row) for row in rows]

    def get_top_forecasts(
        self,
        limit: int = 20,
        horizon_days: Optional[int] = None,
        critical_only: bool = False,
    ) -> List[Dict[str, Any]]:
        risk_categories = ["Critical"] if critical_only else ["High", "Critical"]

        rows = self.repository.get_top_forecasts(
            limit=limit,
            horizon_days=horizon_days,
            risk_categories=risk_categories,
        )

        return [self._serialize_forecast(row) for row in rows]

    def get_hotspot_forecasts(
        self,
        hotspot_id: int,
        horizon_days: Optional[int] = None,
        limit: int = 30,
    ) -> List[Dict[str, Any]]:
        rows = self.repository.get_hotspot_forecasts(
            hotspot_id=hotspot_id,
            horizon_days=horizon_days,
            limit=limit,
        )
        return [self._serialize_forecast(row) for row in rows]

    def get_summary(self) -> Dict[str, Any]:
        summary = self.repository.get_summary()
        trained_horizons = sorted(_MODEL_REGISTRY.keys())

        summary["trained_horizons"] = trained_horizons
        summary["models_in_memory"] = len(trained_horizons)

        return summary

    def _serialize_forecast(self, row: Any) -> Dict[str, Any]:
        confidence = self._confidence_from_bounds(
            row.confidence_lower,
            row.confidence_upper,
            row.predicted_eis,
        )

        return {
            "forecast_id": row.id,
            "hotspot_id": row.hotspot_id,
            "forecast_date": row.forecast_date,
            "horizon_days": row.horizon_days,
            "predicted_eis": row.predicted_eis,
            "predicted_risk_category": row.predicted_risk_category,
            "confidence": confidence,
            "confidence_lower": row.confidence_lower,
            "confidence_upper": row.confidence_upper,
            "top_features": row.top_features,
            "shap_values": row.shap_values,
            "model_version": row.model_version,
            "pipeline_run_id": row.pipeline_run_id,
            "created_at": row.created_at,
        }

    def _confidence_from_bounds(
        self,
        lower: Optional[float],
        upper: Optional[float],
        predicted: Optional[float],
    ) -> float:
        if lower is None or upper is None:
            return 0.5

        width = max(0.0, float(upper) - float(lower))
        confidence = 1.0 - min(1.0, width / 100.0)
        return max(0.0, min(1.0, confidence))