# ParkWise Command Center

## AI-Powered Parking Impact Intelligence Platform

ParkWise Command Center is a full-stack AI-powered traffic enforcement intelligence platform built to detect parking-induced congestion, identify illegal parking hotspots, forecast future risk, allocate enforcement officers, generate patrol routes, and support decision-making through an interactive dashboard.

This project was developed for the theme:

**Poor Visibility on Parking-Induced Congestion**

Illegal on-street parking, wrong parking, footpath parking, main-road parking, double parking, and spillover parking reduce road capacity and create congestion around junctions, commercial areas, metro stations, and event-heavy zones. Traditional enforcement is often patrol-based and reactive. ParkWise converts historical police violation data into actionable enforcement intelligence.

---

## Demo Video

Demo video link:

```text
PASTE_DEMO_VIDEO_LINK_HERE
```

---

## Repository Structure

```text
ParkWise-Command-Center/
│
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── scripts/
│   ├── tests/
│   ├── .env.example
│   ├── alembic.ini
│   ├── pytest.ini
│   ├── requirements.txt
│   └── README_BACKEND.md
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── README.md
└── .gitignore
```

---

## Problem Statement

Cities often have large amounts of parking violation data, but enforcement teams do not always have a clear way to answer:

* Where are illegal parking hotspots concentrated?
* Which hotspots create the highest congestion impact?
* Which time windows require stronger enforcement?
* Which hotspots are likely to remain risky in the future?
* How should limited officers be allocated?
* What patrol route should be followed?
* What happens if officer availability or enforcement intensity changes?

ParkWise solves this by building an end-to-end decision intelligence pipeline:

```text
Raw police violation data
→ hotspot detection
→ enriched violation records
→ temporal intelligence
→ EIS risk scoring
→ ML forecasting
→ officer allocation
→ patrol route generation
→ dashboard + simulator
```

---

## Key Features

### 1. Hotspot Detection

ParkWise processes police violation records and groups them into hotspot zones using junction-level grouping and coordinate-based fallback grouping.

The hotspot module identifies:

* hotspot name
* centroid latitude and longitude
* total violation count
* dominant violation type
* dominant vehicle category
* number of unique active dates
* violation density indicators

This helps enforcement teams understand where parking-related violations repeatedly occur.

---

### 2. Enriched Violation Layer

Raw violations are transformed into enriched records with severity scores.

Severity mapping is based on parking impact:

```text
DOUBLE PARKING              highest severity
PARKING IN A MAIN ROAD      high severity
FOOTPATH PARKING            high pedestrian impact
NO PARKING                  medium severity
WRONG PARKING               base severity
```

This enriched layer ensures that all parking violations are not treated equally. A double-parked vehicle or main-road obstruction has a higher impact than a minor parking violation.

---

### 3. Temporal Intelligence

ParkWise detects peak violation windows by analyzing:

* hour of day
* day of week
* hotspot-level recurrence
* violation count per time bucket
* peak enforcement windows

The system generates time-based enforcement intelligence such as:

* morning rush windows
* lunch-hour peaks
* evening rush windows
* night/off-peak patterns

This helps enforcement teams decide not only where to deploy officers, but also when.

---

### 4. Enforcement Impact Score

ParkWise computes an Enforcement Impact Score, also called EIS, for every hotspot.

The EIS score combines multiple risk dimensions:

```text
frequency_score
recurrence_score
density_score
temporal_risk_score
severity_norm
exposure_score
severity_multiplier
```

The final score is converted into a risk category:

```text
0–24.99       Low
25–49.99      Medium
50–74.99      High
75–100        Critical
```

This allows the system to rank hotspots by enforcement priority.

---

### 5. Machine Learning Forecasting

The forecasting module predicts future hotspot risk using features generated from EIS and violation history.

Training features include:

```text
hotspot_id
frequency_score
recurrence_score
density_score
temporal_risk_score
severity_norm
exposure_score
severity_multiplier
total_violations
```

The model predicts future EIS/risk values for hotspots and stores forecasts in the database.

Forecasting helps answer:

* Which hotspots are likely to remain risky?
* Which currently medium-risk hotspots may increase?
* Where should enforcement be planned proactively?

---

### 6. Officer Allocation

ParkWise allocates available officers across high-priority hotspots using current risk scores and forecasted risk.

Allocation considers:

* current EIS
* forecasted EIS
* risk category
* priority rank
* available officer pool
* minimum coverage rules for Critical and High hotspots

Example allocation request:

```json
{
  "total_officers": 20,
  "top_n_hotspots": 4
}
```

The allocation output includes:

* officers allocated per hotspot
* allocation fraction
* deployment window
* EIS snapshot
* risk category

---

### 7. Patrol Route Generation

ParkWise generates patrol routes from allocated hotspots.

The routing module calculates:

* route stops
* total distance
* estimated travel time
* estimated total enforcement time
* route geometry
* route summary

The route generation uses internal fallback geospatial logic so the system remains functional even without external routing APIs.

Example route generation request:

```json
{
  "route_date": "2026-06-19",
  "max_routes": 4,
  "max_stops_per_route": 10
}
```

---

### 8. What-If Simulator

The simulator allows users to test different enforcement scenarios.

Supported scenarios include:

```text
Increase officers by 20%
Reduce frequency by 15%
Reduce temporal risk by 20%
Critical hotspot surge deployment
Low enforcement scenario
```

Example simulator request:

```json
{
  "scenario_name": "Increase officers by 20%",
  "overrides": {
    "total_officers": 24
  }
}
```

Simulator output includes:

* total hotspots analyzed
* improved hotspots
* worsened hotspots
* unchanged hotspots
* baseline average EIS
* simulated average EIS
* average EIS delta
* officer changes
* impact notes

This allows decision-makers to evaluate how enforcement strategy changes may affect congestion risk.

---

### 9. Dashboard API Layer

The backend exposes frontend-ready dashboard endpoints.

The dashboard combines outputs from:

* hotspots
* EIS scores
* forecasts
* allocations
* patrol routes
* simulator data

Main dashboard output includes:

```text
executive_summary
risk_distribution
hotspot_map
forecast overview
allocation overview
routing overview
temporal overview
```

---

### 10. Frontend Dashboard

The frontend is built using React, TypeScript, and Vite.

Frontend screens can include:

* Dashboard Overview
* Hotspot Map
* Hotspot Table
* Risk / EIS Explainability
* Forecast + Allocation
* Patrol Route
* What-If Simulator
* AI Commander cards

The frontend consumes FastAPI endpoints from the backend and presents parking enforcement intelligence in a visual dashboard format.

---

## Tech Stack

### Backend

```text
Python 3.12
FastAPI
SQLAlchemy
Pydantic
Alembic
PostgreSQL
PostGIS
GeoAlchemy2
LightGBM
scikit-learn
pytest
```

### Frontend

```text
React
TypeScript
Vite
ESLint
npm
```

### Database

```text
PostgreSQL
PostGIS
Docker
```

### ML / Data Processing

```text
pandas
numpy
LightGBM
scikit-learn
joblib
```

### API Documentation

```text
Swagger UI
OpenAPI JSON
```

---

## Backend Setup

### 1. Go to Backend Directory

```cmd
cd backend
```

---

### 2. Create Virtual Environment

Windows:

```cmd
C:\Windows\py.exe -3.12 -m venv .venv
.venv\Scripts\activate
```

---

### 3. Install Backend Dependencies

```cmd
C:\Windows\py.exe -3.12 -m pip install -r requirements.txt
```

---

### 4. Environment Variables

Create a local `.env` file inside `backend/` using `backend/.env.example`.

Example:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@127.0.0.1:5433/parkwise
TEST_DATABASE_URL=postgresql+psycopg2://postgres:postgres@127.0.0.1:5433/parkwise_test

DEBUG=true
SECRET_KEY=change-me

USE_MAPPLS=false
MAPPLS_CLIENT_ID=
MAPPLS_CLIENT_SECRET=
MAPPLS_ACCESS_TOKEN=
```

Important:

```text
Do not commit .env
Do not expose real secrets
Use .env.example only for sharing configuration format
```

---

## Database Setup

ParkWise uses PostgreSQL with PostGIS.

### Start PostGIS Using Docker

```cmd
docker run --name parkwise-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=parkwise ^
  -p 5433:5432 ^
  -d postgis/postgis:16-3.4
```

The backend uses port `5433` locally because port `5432` may already be used by another PostgreSQL installation.

### Start Existing Database Container

```cmd
docker start parkwise-postgres
```

### Stop Database Container

```cmd
docker stop parkwise-postgres
```

Do not run `docker rm parkwise-postgres` unless you intentionally want to remove the database container.

---

## Run Backend Migrations

From inside `backend/`:

```cmd
C:\Windows\py.exe -3.12 -m alembic upgrade head
```

This creates required tables such as:

```text
violations
hotspots
enriched_violations
peak_windows
eis_scores
forecasts
allocations
patrol_routes
```

---

## Load Police Violation Data

The ingestion script loads police violation CSV data into the database.

From inside `backend/`:

```cmd
C:\Windows\py.exe -3.12 scripts/load_violations.py
```

Expected result after successful ingestion:

```text
Total rows read: 298450
Inserted count: 298450
Skipped count: 0
DB count: 298450
```

The dataset file should stay local and should not be committed.

---

## Run Backend Server

From inside `backend/`:

```cmd
C:\Windows\py.exe -3.12 -m uvicorn app.main:app --reload
```

Server runs at:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

Expected health response:

```json
{
  "status": "ok",
  "app": "ParkWise Command Center",
  "version": "1.0.0",
  "env": "development"
}
```

---

## Frontend Setup

### 1. Install Node.js

Use Node.js version:

```text
20.19+ or 22.12+
```

Recommended:

```text
Node.js 22 LTS
```

Check version:

```cmd
node -v
npm -v
```

---

### 2. Go to Frontend Directory

From repo root:

```cmd
cd frontend
```

---

### 3. Install Frontend Dependencies

```cmd
npm install
```

---

### 4. Configure Frontend Environment

Create a local `.env` file inside `frontend/` using `frontend/.env.example`.

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Do not commit frontend `.env`.

---

### 5. Run Frontend

```cmd
npm run dev
```

The frontend usually runs at:

```text
http://localhost:5173
```

---

## Full Local Run

Use two terminals.

### Terminal 1: Backend

```cmd
cd backend
C:\Windows\py.exe -3.12 -m uvicorn app.main:app --reload
```

### Terminal 2: Frontend

```cmd
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## Pipeline Execution Order

The complete backend pipeline should be executed in this order:

```text
1. Run migrations
2. Load violations CSV
3. Run hotspot pipeline
4. Run temporal pipeline
5. Run EIS pipeline
6. Train forecast model
7. Generate forecasts
8. Compute officer allocation
9. Generate patrol route
10. Run dashboard/simulator APIs
```

---

## Pipeline API Commands

### Run Hotspot Pipeline

```text
POST /api/v1/hotspots/run-pipeline
```

Creates:

```text
hotspots
enriched_violations
```

Expected database counts:

```text
hotspots             5872
enriched_violations  298450
```

---

### Run Temporal Pipeline

```text
POST /api/v1/temporal/run-pipeline
```

Example body:

```json
{
  "truncate_existing": true,
  "min_window_violations": 5
}
```

Expected output:

```text
peak_windows 13032
```

---

### Run EIS Pipeline

```text
POST /api/v1/eis/run-pipeline
```

Expected output:

```text
eis_scores 5872
```

---

### Train Forecast Model

```text
POST /api/v1/forecast/train
```

Example body:

```json
{
  "horizon_days": 1,
  "model_version": "forecast-v1",
  "min_history_per_hotspot": 1
}
```

Example response:

```json
{
  "status": "trained",
  "horizon_days": 1,
  "model_version": "forecast-v1-h1",
  "model_type": "lightgbm",
  "training_mode": "cross_sectional",
  "rows_used": 5872,
  "train_size": 4404,
  "validation_size": 1468,
  "mae": 3.3045,
  "r2": 0.8698
}
```

---

### Generate Forecasts

```text
POST /api/v1/forecast/generate
```

Example body:

```json
{
  "horizon_days": 1,
  "replace_existing": true
}
```

Expected database count:

```text
forecasts 5872
```

Note:

```text
This endpoint is intended as an admin/pipeline action.
Frontend should not call it automatically on page load.
```

---

### Compute Allocation

```text
POST /api/v1/allocation/compute
```

Example body:

```json
{
  "total_officers": 20,
  "top_n_hotspots": 4
}
```

Expected output:

```text
allocations 4
```

---

### Generate Patrol Route

```text
POST /api/v1/routing/generate
```

Example body:

```json
{
  "route_date": "2026-06-19",
  "max_routes": 4,
  "max_stops_per_route": 10
}
```

Expected output:

```text
patrol_routes 1
```

---

## Important API Endpoints

### Health

```text
GET /health
```

---

### Dashboard

```text
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/risk-distribution
GET /api/v1/dashboard/map
GET /api/v1/dashboard/temporal
GET /api/v1/dashboard/forecast
GET /api/v1/dashboard/allocation
GET /api/v1/dashboard/routing
GET /api/v1/dashboard/full
```

---

### Hotspots

```text
GET  /api/v1/hotspots/
GET  /api/v1/hotspots/map/pins
GET  /api/v1/hotspots/{hotspot_id}
POST /api/v1/hotspots/run-pipeline
```

---

### EIS

```text
GET  /api/v1/eis/scores
GET  /api/v1/eis/scores/{hotspot_id}
GET  /api/v1/eis/priority-queue
POST /api/v1/eis/run-pipeline
```

---

### Temporal

```text
GET  /api/v1/temporal/peak-windows
GET  /api/v1/temporal/enforcement-schedule
GET  /api/v1/temporal/heatmap
GET  /api/v1/temporal/hotspots/{hotspot_id}/windows
GET  /api/v1/temporal/hotspots/{hotspot_id}/risk-score
POST /api/v1/temporal/run-pipeline
```

---

### Forecast

```text
POST /api/v1/forecast/train
POST /api/v1/forecast/generate
GET  /api/v1/forecast
GET  /api/v1/forecast/top
GET  /api/v1/forecast/hotspots/{hotspot_id}
GET  /api/v1/forecast/summary
```

---

### Allocation

```text
POST /api/v1/allocation/compute
GET  /api/v1/allocation/latest
```

---

### Routing

```text
POST /api/v1/routing/generate
GET  /api/v1/routing
GET  /api/v1/routing/latest
GET  /api/v1/routing/summary
GET  /api/v1/routing/{route_id}
```

---

### Patrol

```text
GET /api/v1/patrol/
GET /api/v1/patrol/{route_id}
```

---

### Simulator

```text
GET  /api/v1/simulator/presets
GET  /api/v1/simulator/baseline
POST /api/v1/simulator/run
```

---

### Optional Mappls

```text
GET  /api/v1/mappls/status
POST /api/v1/mappls/route-preview
```

These endpoints are optional and intended for partial MapMyIndia / Mappls integration.

---

## Frontend Integration Guidance

For normal frontend page load, use read-only endpoints.

Recommended frontend APIs:

```text
GET /api/v1/dashboard/full
GET /api/v1/hotspots/?page=1&page_size=50
GET /api/v1/eis/scores
GET /api/v1/forecast/summary
GET /api/v1/forecast/top
GET /api/v1/allocation/latest
GET /api/v1/routing/latest
GET /api/v1/simulator/presets
GET /api/v1/simulator/baseline
```

Avoid calling these automatically on page load:

```text
POST /api/v1/hotspots/run-pipeline
POST /api/v1/eis/run-pipeline
POST /api/v1/temporal/run-pipeline
POST /api/v1/forecast/train
POST /api/v1/forecast/generate
POST /api/v1/allocation/compute
POST /api/v1/routing/generate
POST /api/v1/simulator/run
```

POST endpoints should be used only through admin buttons or controlled user actions.

---

## Suggested Frontend Screens

Minimum demo screens:

```text
1. Dashboard Overview
2. Hotspot Map
3. Hotspot Table
4. Risk / EIS Explainability
5. Forecast + Allocation
6. Patrol Route
7. What-If Simulator
```

Optional screen:

```text
AI Commander
```

AI Commander can be generated in the frontend using:

```text
GET /api/v1/dashboard/full
GET /api/v1/eis/scores
GET /api/v1/allocation/latest
GET /api/v1/routing/latest
```

Example commander card:

```text
Critical hotspot detected at Safina Plaza Junction.
Deploy 5 officers.
Recommended route available.
Forecasted EIS remains high.
```

---

## Current Verified Backend Data

The backend pipeline has been verified with the following database counts:

```text
violations              298450
hotspots                5872
enriched_violations     298450
peak_windows            13032
eis_scores              5872
forecasts               5872
allocations             4
patrol_routes           1
```

---

## Testing

### Backend Tests

From inside `backend/`:

```cmd
C:\Windows\py.exe -3.12 -m pytest tests/unit -v --basetemp=C:\Users\sudhe\OneDrive\Desktop\pytest-temp
```

If the default Windows temp folder gives permission errors, use a project-local pytest temp folder:

```cmd
mkdir C:\Users\sudhe\OneDrive\Desktop\pytest-temp
set TMP=C:\Users\sudhe\OneDrive\Desktop\pytest-temp
set TEMP=C:\Users\sudhe\OneDrive\Desktop\pytest-temp
C:\Windows\py.exe -3.12 -m pytest tests/unit -v --basetemp=C:\Users\sudhe\OneDrive\Desktop\pytest-temp
```

Verified result:

```text
326 tests passed.
```

### Frontend Run Check

From inside `frontend/`:

```cmd
npm install
npm run dev
```

---

## Common Issues

### Docker Makes System Slow

The PostgreSQL/PostGIS database runs in Docker.

If no one is testing, stop it:

```cmd
docker stop parkwise-postgres
```

Restart later:

```cmd
docker start parkwise-postgres
```

Do not remove the container unless you want to delete the database.

---

### Swagger UI Becomes Unresponsive

Swagger can freeze when rendering very large JSON responses.

Avoid opening huge full-list APIs in Swagger such as:

```text
GET /api/v1/eis/scores
GET /api/v1/forecast
GET /api/v1/dashboard/full
```

Use limited endpoints:

```text
GET /api/v1/hotspots/?page=1&page_size=10
GET /api/v1/eis/scores?risk_category=Critical
GET /api/v1/dashboard/summary
```

---

### Forecast Generate Takes Time

Forecast generation is a pipeline/admin action.

It should not be called repeatedly from frontend page load.

Use read APIs instead:

```text
GET /api/v1/forecast/summary
GET /api/v1/forecast/top
GET /api/v1/dashboard/forecast
```

---

### Routing Requires route_date

Invalid request:

```json
{
  "max_routes": 4,
  "max_stops_per_route": 10
}
```

Correct request:

```json
{
  "route_date": "2026-06-19",
  "max_routes": 4,
  "max_stops_per_route": 10
}
```

---

### Simulator Requires scenario_name

Invalid request:

```json
{
  "total_officers": 24
}
```

Correct request:

```json
{
  "scenario_name": "Increase officers by 20%",
  "overrides": {
    "total_officers": 24
  }
}
```

---

### Node Version Issue

Vite requires:

```text
Node.js 20.19+ or 22.12+
```

Recommended:

```text
Node.js 22 LTS
```

If `npm run dev` fails due to Node version, upgrade Node and reinstall dependencies:

```cmd
cd frontend
rmdir /S /Q node_modules
del package-lock.json
npm install
npm run dev
```

---

## Design Philosophy

ParkWise follows a modular design:

```text
Data ingestion is separate from hotspot detection
Hotspot detection is separate from temporal intelligence
Temporal intelligence is separate from EIS scoring
EIS scoring is separate from forecasting
Forecasting is separate from allocation
Allocation is separate from routing
Routing is separate from dashboard presentation
```

This makes the system easier to test, debug, and extend.

---

## Optional MapMyIndia / Mappls Integration

ParkWise is designed to support MapMyIndia / Mappls as a mapping intelligence layer.

The current system already has internal geospatial fallback routing. Mappls can be added as an optional enhancement without replacing the existing working pipeline.

The intended integration strategy is:

```text
Existing internal routing engine remains active
Mappls is added for route preview / map intelligence
If Mappls credentials exist, Mappls can be used
If credentials are missing, system falls back to internal geometry
```

Planned optional endpoints:

```text
GET  /api/v1/mappls/status
POST /api/v1/mappls/route-preview
```

This approach keeps the backend reliable while allowing Mappls-backed visualization or route preview if credentials are available.

---

## Why Optional Mappls Instead of Full Replacement

The existing backend already computes hotspots, forecasts, allocation, and patrol routes.

Replacing routing with an external API at the end of development could risk breaking:

```text
dashboard routing
allocation-to-route conversion
patrol route persistence
unit tests
frontend map rendering
```

Therefore, Mappls is planned as an optional route-preview and map intelligence layer.

This gives the project MapMyIndia support while preserving reliability.

---

## Git Ignore Policy

The repository should not commit:

```text
.env files
node_modules/
dist/
build/
backend/data/
backend/logs/
backend/models/
ML artifacts
Python cache files
pytest cache
large CSV datasets
```

Only `.env.example` files should be committed.

---

## Summary

ParkWise Command Center converts historical parking violation data into actionable parking enforcement intelligence.

It supports:

```text
parking hotspot detection
temporal risk analysis
EIS risk ranking
ML-based risk forecasting
officer allocation
patrol route generation
what-if simulation
dashboard APIs
frontend dashboard integration
optional Mappls integration
```

The system is backend-ready, test-covered, frontend-integrated, and designed for AI-powered parking congestion intelligence.
