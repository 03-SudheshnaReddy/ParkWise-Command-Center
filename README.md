# ParkWise Command Center — Backend

> AI-Powered Enforcement Intelligence for Parking-Induced Congestion

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 15+ with PostGIS extension
- (Optional) Docker for local DB

### 2. Clone & install dependencies

```bash
git clone <repo-url>
cd parkwise-backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and SECRET_KEY at minimum
```

### 4. Create database and enable PostGIS

```sql
CREATE DATABASE parkwise_db;
\c parkwise_db
CREATE EXTENSION postgis;
```

### 5. Run Alembic migrations

```bash
alembic upgrade head
```

### 6. Start the API server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

---

## Project Structure

```
parkwise-backend/
├── app/
│   ├── main.py                  # FastAPI app factory + lifespan
│   ├── api/
│   │   ├── deps.py              # Dependency injection
│   │   └── v1/
│   │       ├── router.py        # Central API router
│   │       └── endpoints/
│   │           ├── dashboard.py    # Executive Command Centre
│   │           ├── violations.py   # Raw violation queries
│   │           ├── hotspots.py     # Micro-Hotspot Detection
│   │           ├── eis.py          # EIS scores + Priority Queue
│   │           ├── temporal.py     # Temporal Intelligence
│   │           ├── forecast.py     # Risk Forecast
│   │           ├── allocation.py   # Officer Allocation
│   │           ├── patrol.py       # Patrol Route Optimization
│   │           └── simulator.py    # What-If Simulator
│   ├── core/
│   │   ├── config.py            # Pydantic settings
│   │   ├── constants.py         # EIS weights, thresholds, enums
│   │   ├── exceptions.py        # Domain exception hierarchy
│   │   └── logging.py           # Structured logging (structlog)
│   ├── db/
│   │   ├── base.py              # SQLAlchemy DeclarativeBase
│   │   └── session.py           # Engine + session factory
│   ├── models/
│   │   ├── violation.py         # violations table
│   │   ├── enriched_violation.py # enriched_violations table
│   │   ├── hotspot.py           # hotspots table (PostGIS)
│   │   └── analytics.py         # peak_windows, eis_scores, forecasts,
│   │                            #   allocations, patrol_routes
│   ├── schemas/
│   │   ├── violation.py         # Pydantic I/O schemas
│   │   ├── analytics.py         # All analytics schemas + DashboardSummary
│   │   └── simulator.py         # What-If Simulator schemas
│   ├── services/                # Business logic (next phase)
│   └── ml/                      # ML pipeline modules (next phase)
│       ├── hotspot/
│       ├── eis/
│       ├── temporal/
│       ├── forecast/
│       ├── allocation/
│       ├── routing/
│       ├── queue/
│       └── simulator/
├── alembic/
│   ├── env.py
│   └── versions/
├── scripts/
├── tests/
├── alembic.ini
├── requirements.txt
└── .env.example
```

## EIS Formula Reference (FROZEN)

```
Exposure     = 0.35 × Frequency + 0.20 × Recurrence + 0.25 × Density + 0.20 × TemporalRisk
Multiplier   = 0.6 + (0.8 × Severity_norm)
EIS          = Exposure × Multiplier  →  scaled 0–100
```

Risk thresholds: Low (0–25) | Medium (25–50) | High (50–75) | Critical (75–100)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/dashboard/summary` | Executive Command Centre |
| GET | `/api/v1/violations/` | List violations |
| GET | `/api/v1/hotspots/` | List hotspots |
| GET | `/api/v1/hotspots/map/pins` | Map pin data |
| GET | `/api/v1/eis/scores` | All EIS scores |
| GET | `/api/v1/eis/priority-queue` | Priority Queue |
| GET | `/api/v1/temporal/peak-windows` | Peak violation windows |
| GET | `/api/v1/forecast/tomorrow` | Tomorrow's risk forecast |
| POST | `/api/v1/allocation/compute` | Compute officer allocation |
| GET | `/api/v1/patrol/` | List patrol routes |
| POST | `/api/v1/simulator/run` | Run what-if scenario |

## Next Phases

- **Phase 7**: ML Pipeline (DBSCAN → EIS → LightGBM → Patrol Routing)
- **Phase 8**: React Frontend
- **Phase 9**: Deployment (Render + Vercel + Supabase)
