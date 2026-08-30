import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import HazardZone
from app.ml.shap_explainer import shap_engine
from app.ml.random_forest import hazard_ml_model

router = APIRouter(prefix="/zones", tags=["Hazard Zones"])

class RecalculateZoneRequest(BaseModel):
    slope: Optional[float] = None
    deformation_rate: Optional[float] = None
    rainfall: Optional[float] = None
    distance_to_river: Optional[float] = None

@router.get("")
def list_zones(
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all hazard zones with optional search and risk filtering."""
    query = db.query(HazardZone)
    if risk_level and risk_level != "ALL":
        query = query.filter(HazardZone.risk_level == risk_level.upper())
    if search:
        query = query.filter(
            (HazardZone.name.ilike(f"%{search}%")) |
            (HazardZone.code.ilike(f"%{search}%"))
        )
    zones = query.order_by(HazardZone.risk_score.desc()).all()
    
    return [
        {
            "id": z.id,
            "code": z.code,
            "name": z.name,
            "risk_level": z.risk_level,
            "risk_score": z.risk_score,
            "susceptibility_score": z.susceptibility_score,
            "population": z.population,
            "buildings": z.buildings,
            "deformation_rate": z.deformation_rate,
            "slope": z.slope,
            "rainfall": z.rainfall,
            "distance_to_river": z.distance_to_river,
            "elevation": z.elevation,
            "drainage_density": z.drainage_density,
            "land_use": z.land_use,
            "geology": z.geology,
            "seismic_intensity": z.seismic_intensity,
            "vulnerability_score": z.vulnerability_score,
            "recommended_action": z.recommended_action,
            "center_lat": z.center_lat,
            "center_lng": z.center_lng
        }
        for z in zones
    ]

@router.get("/{code}")
def get_zone_by_code(code: str, db: Session = Depends(get_db)):
    """Fetch complete details and geometry for a specific hazard zone (e.g. ZONE-RZ-014)."""
    clean_code = code.upper()
    if not clean_code.startswith("ZONE-") and not clean_code.startswith("RZ-"):
        clean_code = f"ZONE-{clean_code}"
    if clean_code.startswith("RZ-"):
        clean_code = f"ZONE-{clean_code}"
        
    zone = db.query(HazardZone).filter(HazardZone.code == clean_code).first()
    if not zone:
        # Fallback search by fuzzy code
        zone = db.query(HazardZone).filter(HazardZone.code.ilike(f"%{code}%")).first()
        
    if not zone:
        raise HTTPException(status_code=404, detail=f"Hazard zone {code} not found")
        
    geom = json.loads(zone.geometry_geojson) if zone.geometry_geojson else None
    
    return {
        "id": zone.id,
        "code": zone.code,
        "name": zone.name,
        "risk_level": zone.risk_level,
        "risk_score": zone.risk_score,
        "susceptibility_score": zone.susceptibility_score,
        "population": zone.population,
        "buildings": zone.buildings,
        "deformation_rate": zone.deformation_rate,
        "slope": zone.slope,
        "rainfall": zone.rainfall,
        "distance_to_river": zone.distance_to_river,
        "elevation": zone.elevation,
        "drainage_density": zone.drainage_density,
        "land_use": zone.land_use,
        "geology": zone.geology,
        "seismic_intensity": zone.seismic_intensity,
        "vulnerability_score": zone.vulnerability_score,
        "recommended_action": zone.recommended_action,
        "center_lat": zone.center_lat,
        "center_lng": zone.center_lng,
        "geometry": geom
    }

@router.get("/{code}/shap")
def get_zone_shap_explanation(code: str, db: Session = Depends(get_db)):
    """
    Returns SHAP feature attributions and natural-language risk explanation for the zone.
    Answers: 'Why is this zone HIGH RISK / CRITICAL?'
    """
    zone_data = get_zone_by_code(code, db)
    explanation = shap_engine.explain_zone(zone_data)
    return explanation

@router.post("/{code}/recalculate")
def recalculate_zone_risk(code: str, req: RecalculateZoneRequest, db: Session = Depends(get_db)):
    """Simulates impact of changed conditioning variables on risk score."""
    zone = db.query(HazardZone).filter(HazardZone.code.ilike(f"%{code}%")).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    features = {
        "slope": req.slope if req.slope is not None else zone.slope,
        "deformation_rate": req.deformation_rate if req.deformation_rate is not None else zone.deformation_rate,
        "rainfall": req.rainfall if req.rainfall is not None else zone.rainfall,
        "distance_to_river": req.distance_to_river if req.distance_to_river is not None else zone.distance_to_river,
        "elevation": zone.elevation,
        "drainage_density": zone.drainage_density,
        "seismic_intensity": zone.seismic_intensity
    }
    
    pred = hazard_ml_model.predict_zone_risk(features)
    
    return {
        "zone_code": zone.code,
        "original_risk_score": zone.risk_score,
        "recalculated_risk_score": pred["risk_score"],
        "recalculated_risk_level": pred["risk_level"],
        "susceptibility_probability": pred["susceptibility_probability"],
        "simulated_inputs": features
    }
