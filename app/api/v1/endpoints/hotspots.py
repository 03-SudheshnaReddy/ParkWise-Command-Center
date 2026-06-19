"""
app/api/v1/endpoints/hotspots.py
────────────────────────────────
Micro-Hotspot Detection — query and explore detected hotspots.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import PaginationParams, db_session, valid_hotspot_id
from app.models.hotspot import Hotspot
from app.schemas.analytics import HotspotListResponse, HotspotRead, HotspotSummary

router = APIRouter()


@router.get(
    "/",
    response_model=HotspotListResponse,
    summary="List all detected hotspots",
)
def list_hotspots(
    db: Session = Depends(db_session),
    pagination: PaginationParams = Depends(),
    zone_id: Optional[str] = Query(None, description="Filter by zone"),
    min_violations: int = Query(0, ge=0, description="Minimum violation count"),
) -> HotspotListResponse:
    query = db.query(Hotspot)
    if zone_id:
        query = query.filter(Hotspot.zone_id == zone_id)
    if min_violations > 0:
        query = query.filter(Hotspot.total_violations >= min_violations)

    total = query.count()
    items = (
        query
        .order_by(Hotspot.total_violations.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
        .all()
    )
    return HotspotListResponse(
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        items=[HotspotRead.model_validate(h) for h in items],
    )


@router.get(
    "/map/pins",
    response_model=list[HotspotSummary],
    summary="Lightweight map pin data for all hotspots",
)
def get_map_pins(db: Session = Depends(db_session)) -> list[HotspotSummary]:
    hotspots = db.query(Hotspot).order_by(Hotspot.total_violations.desc()).all()
    return [HotspotSummary.model_validate(h) for h in hotspots]


@router.get(
    "/{hotspot_id}",
    response_model=HotspotRead,
    summary="Get a single hotspot by ID",
)
def get_hotspot(
    hotspot_id: int = Depends(valid_hotspot_id),
    db: Session = Depends(db_session),
) -> HotspotRead:
    hotspot = db.query(Hotspot).filter(Hotspot.id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotspot not found")
    return HotspotRead.model_validate(hotspot)
