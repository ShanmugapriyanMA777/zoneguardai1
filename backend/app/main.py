import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# CORS configuration for local React Vite and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def root():
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
            "zone_shap_example": "/api/zones/ZONE-RZ-014/shap",
            "relocation_recommendation": "/api/relocation/recommend/ZONE-RZ-014",
            "deformation_points": "/api/deformation/points",
            "ahp_matrix": "/api/relocation/ahp/default-matrix"
        }
    }

@app.get("/health")
def healthcheck():
    return {"status": "HEALTHY", "db_connected": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
