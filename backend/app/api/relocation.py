from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db.session import get_db
from app.db.models import RelocationSite, HazardZone
from app.services.ahp_service import ahp_engine, DEFAULT_CRITERIA
from app.services.recommendation_engine import relocation_engine

router = APIRouter(prefix="/relocation", tags=["Relocation Planning & AHP"])

class AHPCalculateRequest(BaseModel):
    matrix: List[List[float]]

class CustomMatchRequest(BaseModel):
    zone_code: str
    max_radius_km: float = 25.0
    weights: Optional[Dict[str, float]] = None

@router.get("/sites")
def list_relocation_sites(
    status: Optional[str] = None,
    min_suitability: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """List all candidate relocation sites."""
    query = db.query(RelocationSite)
    if status and status != "ALL":
        query = query.filter(RelocationSite.status.ilike(f"%{status}%"))
    if min_suitability is not None:
        query = query.filter(RelocationSite.suitability_score >= min_suitability)
        
    sites = query.order_by(RelocationSite.suitability_score.desc()).all()
    
    return [
        {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "total_area_sqm": s.total_area_sqm,
            "usable_area_sqm": s.usable_area_sqm,
            "elevation": s.elevation,
            "slope": s.slope,
            "distance_from_river_km": s.distance_from_river_km,
            "road_accessibility": s.road_accessibility,
            "road_access_score": s.road_access_score,
            "water_availability_score": s.water_availability_score,
            "healthcare_access_score": s.healthcare_access_score,
            "school_access_score": s.school_access_score,
            "existing_infra_score": s.existing_infra_score,
            "hazard_risk_score": s.hazard_risk_score,
            "ground_stability_score": s.ground_stability_score,
            "pcc": s.pcc,
            "correction_factor": s.correction_factor,
            "rcc": s.rcc,
            "management_factor": s.management_factor,
            "ecc": s.ecc,
            "suitability_score": s.suitability_score,
            "status": s.status,
            "lat": s.lat,
            "lng": s.lng
        }
        for s in sites
    ]

@router.get("/sites/{site_code}")
def get_site_details(site_code: str, db: Session = Depends(get_db)):
    """Fetch details for a single candidate relocation site."""
    site = db.query(RelocationSite).filter(RelocationSite.code.ilike(f"%{site_code}%")).first()
    if not site:
        raise HTTPException(status_code=404, detail=f"Site {site_code} not found")
        
    return {
        "id": site.id,
        "code": site.code,
        "name": site.name,
        "total_area_sqm": site.total_area_sqm,
        "usable_area_sqm": site.usable_area_sqm,
        "elevation": site.elevation,
        "slope": site.slope,
        "distance_from_river_km": site.distance_from_river_km,
        "road_accessibility": site.road_accessibility,
        "road_access_score": site.road_access_score,
        "water_availability_score": site.water_availability_score,
        "healthcare_access_score": site.healthcare_access_score,
        "school_access_score": site.school_access_score,
        "existing_infra_score": site.existing_infra_score,
        "hazard_risk_score": site.hazard_risk_score,
        "ground_stability_score": site.ground_stability_score,
        "pcc": site.pcc,
        "correction_factor": site.correction_factor,
        "rcc": site.rcc,
        "management_factor": site.management_factor,
        "ecc": site.ecc,
        "suitability_score": site.suitability_score,
        "status": site.status,
        "lat": site.lat,
        "lng": site.lng
    }

@router.get("/recommend/{zone_code}")
def get_recommendation_for_zone(zone_code: str, db: Session = Depends(get_db)):
    """
    Core AI Relocation Recommendation Endpoint:
    Matches a red-zone (e.g. ZONE-RZ-014) to optimal candidate sites (e.g. SITE-07).
    """
    clean_code = zone_code.upper()
    if not clean_code.startswith("ZONE-") and not clean_code.startswith("RZ-"):
        clean_code = f"ZONE-{clean_code}"
    if clean_code.startswith("RZ-"):
        clean_code = f"ZONE-{clean_code}"
        
    zone = db.query(HazardZone).filter(HazardZone.code == clean_code).first()
    if not zone:
        zone = db.query(HazardZone).filter(HazardZone.code.ilike(f"%{zone_code}%")).first()
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone {zone_code} not found")
        
    sites = db.query(RelocationSite).all()
    site_dicts = [
        {
            "code": s.code,
            "name": s.name,
            "ecc": s.ecc,
            "suitability_score": s.suitability_score,
            "hazard_risk_score": s.hazard_risk_score,
            "ground_stability_score": s.ground_stability_score,
            "road_access_score": s.road_access_score,
            "water_availability_score": s.water_availability_score,
            "existing_infra_score": s.existing_infra_score,
            "healthcare_access_score": s.healthcare_access_score,
            "road_accessibility": s.road_accessibility,
            "lat": s.lat,
            "lng": s.lng
        }
        for s in sites
    ]
    
    zone_dict = {
        "code": zone.code,
        "name": zone.name,
        "risk_level": zone.risk_level,
        "risk_score": zone.risk_score,
        "population": zone.population,
        "deformation_rate": zone.deformation_rate,
        "center_lat": zone.center_lat,
        "center_lng": zone.center_lng
    }
    
    recommendation = relocation_engine.evaluate_candidates_for_zone(zone_dict, site_dicts)
    return recommendation

@router.get("/ahp/default-matrix")
def get_default_ahp_matrix():
    """Returns default 7x7 pairwise comparison matrix and criteria descriptions."""
    # Standard 7x7 Saaty comparison matrix
    # Criteria: [Hazard Risk, Ground Stability, Accessibility, Water, Healthcare, Infrastructure, Land Capacity]
    default_matrix = [
        [1.00, 1.25, 1.67, 2.50, 2.50, 2.50, 2.50],
        [0.80, 1.00, 1.33, 2.00, 2.00, 2.00, 2.00],
        [0.60, 0.75, 1.00, 1.50, 1.50, 1.50, 1.50],
        [0.40, 0.50, 0.67, 1.00, 1.00, 1.00, 1.00],
        [0.40, 0.50, 0.67, 1.00, 1.00, 1.00, 1.00],
        [0.40, 0.50, 0.67, 1.00, 1.00, 1.00, 1.00],
        [0.40, 0.50, 0.67, 1.00, 1.00, 1.00, 1.00]
    ]
    
    consistency = ahp_engine.compute_ahp_consistency(default_matrix)
    
    return {
        "criteria": DEFAULT_CRITERIA,
        "matrix": default_matrix,
        "consistency_evaluation": consistency
    }

@router.post("/ahp/calculate")
def calculate_ahp(req: AHPCalculateRequest):
    """Calculates weights, lambda_max, CI, and CR consistency for a custom pairwise matrix."""
    return ahp_engine.compute_ahp_consistency(req.matrix)
