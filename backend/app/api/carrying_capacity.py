from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.db.models import RelocationSite
from app.services.capacity_service import capacity_engine

router = APIRouter(prefix="/carrying-capacity", tags=["Carrying Capacity (PCC -> RCC -> ECC)"])

class CapacitySimulateRequest(BaseModel):
    usable_area_sqm: float = 150000.0
    slope_deg: float = 6.8
    water_availability_score: float = 92.0
    road_access_score: float = 94.0
    medical_score: float = 88.0
    sanitation_score: float = 85.0
    min_area_per_person: float = 30.0
    target_population: int = 2840

@router.get("/{site_code}")
def get_site_capacity(site_code: str, target_population: Optional[int] = 0, db: Session = Depends(get_db)):
    """Computes carrying capacity for a specific candidate site in DB."""
    site = db.query(RelocationSite).filter(RelocationSite.code.ilike(f"%{site_code}%")).first()
    if not site:
        raise HTTPException(status_code=404, detail=f"Site {site_code} not found")
        
    capacity_res = capacity_engine.calculate_capacity(
        usable_area_sqm=site.usable_area_sqm,
        slope_deg=site.slope,
        water_availability_score=site.water_availability_score,
        road_access_score=site.road_access_score,
        medical_score=site.healthcare_access_score,
        sanitation_score=site.existing_infra_score,
        target_population=target_population
    )
    
    return {
        "site_code": site.code,
        "site_name": site.name,
        "total_area_sqm": site.total_area_sqm,
        "capacity_metrics": capacity_res
    }

@router.post("/simulate")
def simulate_capacity(req: CapacitySimulateRequest):
    """
    Interactive simulation sandbox for carrying capacity calculations:
    PCC -> RCC -> ECC.
    """
    return capacity_engine.calculate_capacity(
        usable_area_sqm=req.usable_area_sqm,
        slope_deg=req.slope_deg,
        water_availability_score=req.water_availability_score,
        road_access_score=req.road_access_score,
        medical_score=req.medical_score,
        sanitation_score=req.sanitation_score,
        min_area_per_person=req.min_area_per_person,
        target_population=req.target_population
    )
