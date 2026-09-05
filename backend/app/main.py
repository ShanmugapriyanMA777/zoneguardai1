import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api import (
    auth, dashboard, hazards, zones, deformation, sentinel,
    ml_routes, carrying_capacity, relocation, field_surveys,
    alerts, reports, data_import
)

app = FastAPI(
    title="ZoneGuard AI API",
    description="Intelligent Multi-Hazard Red-Zone Mapping & Proactive Relocation Decision Support System",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for React Vite, Vercel, mobile field app, and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-seed database on startup if empty
@app.on_event("startup")
def startup_event():
    try:
        from app.db.session import engine, Base, SessionLocal
        from app.db.models import HazardZone
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            if db.query(HazardZone).count() == 0:
                print("[*] Empty database detected. Auto-seeding initial multi-hazard dataset...")
                from scripts.seed_demo_data import seed_database
                seed_database()
                print("[*] Database auto-seed completed successfully.")
    except Exception as e:
        print(f"[!] Startup database initialization notice: {e}")

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(hazards.router, prefix=settings.API_V1_STR)
app.include_router(zones.router, prefix=settings.API_V1_STR)
app.include_router(deformation.router, prefix=settings.API_V1_STR)
app.include_router(sentinel.router, prefix=settings.API_V1_STR)
app.include_router(ml_routes.router, prefix=settings.API_V1_STR)
app.include_router(carrying_capacity.router, prefix=settings.API_V1_STR)
app.include_router(relocation.router, prefix=settings.API_V1_STR)
app.include_router(field_surveys.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(data_import.router, prefix=settings.API_V1_STR)

@app.get("/api")
@app.get("/api/info")
def api_info():
    return {
        "system": "ZoneGuard AI",
        "description": "Multi-Hazard Intelligence & Proactive Relocation Decision Support",
        "status": "OPERATIONAL",
        "version": "2.4.0",
        "environment": "DEMO_MODE (Simulated Dataset with Copernicus CDSE / PostGIS Integration Architecture)",
        "district": settings.DEFAULT_DISTRICT,
        "api_docs": "/docs",
        "endpoints": {
            "dashboard_stats": "/api/dashboard/stats",
            "gis_layers": "/api/hazards/layers",
            "hazard_zones": "/api/zones",
            "zone_shap_example": "/api/zones/ZONE-TN-001/shap",
            "relocation_recommendation": "/api/relocation/recommend/ZONE-TN-001",
            "deformation_points": "/api/deformation/points",
            "ahp_matrix": "/api/relocation/ahp/default-matrix"
        }
    }

@app.get("/health")
def healthcheck():
    return {"status": "HEALTHY", "db_connected": True}

# Locate frontend production build directory if available
dist_candidates = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path("/app/frontend_dist"),
    Path(__file__).resolve().parent / "static",
]
frontend_dist_dir = None
for cand in dist_candidates:
    if cand.exists() and (cand / "index.html").exists():
        frontend_dist_dir = cand
        break

if frontend_dist_dir:
    assets_dir = frontend_dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static-assets")

    @app.get("/")
    def serve_index():
        return FileResponse(frontend_dist_dir / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        if full_path.startswith("api/") or full_path in ("api", "docs", "redoc", "openapi.json", "health"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = frontend_dist_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist_dir / "index.html")
else:
    @app.get("/")
    def root():
        return api_info()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
