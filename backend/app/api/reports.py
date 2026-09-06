from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import HazardZone, RelocationSite
from app.ml.shap_explainer import shap_engine
from app.services.recommendation_engine import relocation_engine
from app.services.report_service import report_engine

router = APIRouter(prefix="/reports", tags=["Decision Reports"])

@router.get("/decision/{zone_code}")
def get_decision_report(zone_code: str, site_code: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Generates a structured Pre-Disaster Relocation Decision Report for DDMA / NDRF Authorities.
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
        "buildings": zone.buildings,
        "deformation_rate": zone.deformation_rate,
        "slope": zone.slope,
        "rainfall": zone.rainfall,
        "distance_to_river": zone.distance_to_river,
        "recommended_action": zone.recommended_action,
        "center_lat": zone.center_lat,
        "center_lng": zone.center_lng
    }
    
    recommendation = relocation_engine.evaluate_candidates_for_zone(zone_dict, site_dicts)
    if site_code:
        chosen_site = next((s for s in site_dicts if s["code"].upper() == site_code.upper()), None)
        if chosen_site:
            dist_km = relocation_engine.calculate_haversine(zone_dict["center_lat"], zone_dict["center_lng"], chosen_site["lat"], chosen_site["lng"])
            recommendation["primary_recommendation"] = {
                "site_code": chosen_site["code"],
                "site_name": chosen_site["name"],
                "suitability_score": int(chosen_site["suitability_score"] * 100 if chosen_site["suitability_score"] <= 1 else chosen_site["suitability_score"]),
                "safety_score": int(chosen_site.get("safety_score") or 88),
                "ecc": chosen_site["ecc"],
                "required_population": zone_dict["population"],
                "capacity_surplus": chosen_site["ecc"] - zone_dict["population"],
                "distance_km": dist_km,
                "estimated_travel_time_mins": int(dist_km / 35 * 60),
                "route_corridor": chosen_site.get("road_accessibility", "National Highway Corridor"),
                "decision_rationale": f"Explicitly allocated candidate haven {chosen_site['name']} ({chosen_site['code']}) for endangered population of {zone_dict['code']}."
            }

    shap_data = shap_engine.explain_zone(zone_dict)
    report = report_engine.build_decision_report(zone_dict, recommendation, shap_data)
    return report
