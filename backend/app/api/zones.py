import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import HazardZone, Village, DeformationPoint, RelocationSite
from app.ml.shap_explainer import shap_engine
from app.ml.random_forest import hazard_ml_model
from app.services.redzone_classifier import redzone_classifier

router = APIRouter(prefix="/zones", tags=["Hazard Zones"])

class RecalculateZoneRequest(BaseModel):
    slope: Optional[float] = None
    deformation_rate: Optional[float] = None
    rainfall: Optional[float] = None
    distance_to_river: Optional[float] = None

class CustomCriteriaRequest(BaseModel):
    min_risk_score: Optional[float] = 75.0
    min_susceptibility: Optional[float] = 0.78
    min_deformation_rate: Optional[float] = 10.0
    min_slope: Optional[float] = 25.0
    min_rainfall: Optional[float] = 1200.0
    min_population_exposed: Optional[int] = 1000
    require_insar_or_rain: Optional[bool] = True

# Static Spatial Layers for Tamil Nadu 3D GIS Visualization
TN_RIVERS = [
    {"name": "Bhavani River (Nilgiris-Erode Catchment)", "coords": [[76.620, 11.280], [76.790, 11.310], [76.940, 11.300], [77.200, 11.450], [77.680, 11.440]]},
    {"name": "Moyar River (Mudumalai Gorge)", "coords": [[76.540, 11.580], [76.720, 11.560], [76.920, 11.590], [77.150, 11.520]]},
    {"name": "Coonoor River (Marapallam Runout)", "coords": [[76.795, 11.355], [76.840, 11.320], [76.930, 11.305]]},
    {"name": "Amaravathi River (Anamalai Catchment)", "coords": [[77.120, 10.250], [77.250, 10.420], [77.580, 10.750], [77.920, 11.010]]},
    {"name": "Vaigai River (Meghamalai-Madurai Basin)", "coords": [[77.380, 9.720], [77.540, 9.980], [77.850, 10.020], [78.120, 9.930], [78.820, 9.350]]},
    {"name": "Tamirabarani River (Kalakkad-Manjolai Basin)", "coords": [[77.350, 8.620], [77.420, 8.680], [77.680, 8.710], [78.020, 8.650], [78.140, 8.620]]},
    {"name": "Pennaiyar River (Cuddalore Surge Corridor)", "coords": [[79.250, 11.950], [79.520, 11.850], [79.760, 11.740], [79.790, 11.730]]},
    {"name": "Kosasthalaiyar River (Chennai Ennore Basin)", "coords": [[79.950, 13.150], [80.120, 13.190], [80.280, 13.210], [80.320, 13.220]]}
]

TN_HIGHWAYS = [
    {"name": "NH-181 Ooty-Coonoor-Mettupalayam Ghat Highway", "type": "Ghat Highway (NH-181)", "coords": [[76.702, 11.411], [76.795, 11.353], [76.880, 11.315], [76.950, 11.300]]},
    {"name": "Valparai 40-Hairpin Ghat Pass (SH-78)", "type": "Ghat Mountain Pass", "coords": [[76.980, 10.580], [76.965, 10.450], [76.955, 10.327], [76.882, 10.301]]},
    {"name": "Kodaikanal Ghat Road (SH-156)", "type": "Ghat Highway", "coords": [[77.765, 10.158], [77.620, 10.220], [77.545, 10.264], [77.467, 10.211]]},
    {"name": "Bodi Mettu Interstate Pass (NH-85)", "type": "Interstate Mountain Highway", "coords": [[77.480, 10.010], [77.380, 10.015], [77.298, 10.021], [77.180, 10.040]]},
    {"name": "East Coast Road (ECR Cyclone Corridor)", "type": "Coastal Highway (ECR / NH-332A)", "coords": [[80.260, 13.000], [80.020, 12.500], [79.820, 11.950], [79.774, 11.735], [79.845, 10.682]]}
]

TN_PEAKS = [
    {"name": "Doddabetta Peak", "elevation_m": 2637, "coords": [76.736, 11.402], "district": "Nilgiris"},
    {"name": "Mukurthi Peak", "elevation_m": 2554, "coords": [76.535, 11.365], "district": "Nilgiris"},
    {"name": "Dolphin's Nose Scarp", "elevation_m": 1550, "coords": [76.825, 11.332], "district": "Nilgiris"},
    {"name": "Vandaravu Peak (Anamalai/Palani)", "elevation_m": 2533, "coords": [77.155, 10.150], "district": "Dindigul/Theni"},
    {"name": "Perumal Peak (Kodaikanal)", "elevation_m": 2440, "coords": [77.552, 10.275], "district": "Dindigul"},
    {"name": "Highwavys Cloud Mountain", "elevation_m": 1650, "coords": [77.395, 9.725], "district": "Theni"},
    {"name": "Agasthyamalai Peak", "elevation_m": 1868, "coords": [77.245, 8.615], "district": "Tirunelveli/Tenkasi"}
]

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

@router.get("/tamilnadu-3d")
def get_tamilnadu_3d_gis(
    district: Optional[str] = Query(None, description="Filter by District (Nilgiris, Coimbatore, Dindigul, Theni, Tenkasi, Tirunelveli, Cuddalore, Nagapattinam, Chennai, ALL)"),
    hazard_type: Optional[str] = Query(None, description="Filter by Hazard Type (Landslide, Debris Flow, Flash Flood, Coastal, ALL)"),
    risk_level: Optional[str] = Query(None, description="Filter by Risk Level (CRITICAL, HIGH, ALL)"),
    min_deformation: Optional[float] = Query(None, description="Minimum InSAR deformation rate in mm/yr"),
    min_rainfall: Optional[float] = Query(None, description="Minimum rainfall in mm"),
    min_population: Optional[int] = Query(None, description="Minimum population"),
    min_risk_threshold: Optional[float] = Query(75.0, description="Red Zone threshold score (default 75)"),
    min_susceptibility: Optional[float] = Query(0.78, description="Minimum AI susceptibility score (default 0.78)"),
    db: Session = Depends(get_db)
):
    """
    Automated Multi-Condition 3D GIS Layer Generator for Tamil Nadu.
    Returns:
    - GeoJSON FeatureCollection of areas classified as 🔴 RED ZONE
    - Evaluated condition checklists and exact reasons for classification
    - 3D Extrusion parameters for MapLibre 3D terrain rendering
    - Spatial overlays: Rivers, Mountain Peaks, Ghat Highways, Villages, and SDRF Infrastructure.
    """
    zones = db.query(HazardZone).all()
    villages = db.query(Village).all()
    deformation_pts = db.query(DeformationPoint).all()
    relocation_sites = db.query(RelocationSite).all()

    custom_thresholds = {
        "min_risk_score": min_risk_threshold if min_risk_threshold is not None else 75.0,
        "min_susceptibility": min_susceptibility if min_susceptibility is not None else 0.78,
    }
    if min_deformation is not None:
        custom_thresholds["min_deformation_rate"] = min_deformation
    if min_rainfall is not None:
        custom_thresholds["min_rainfall"] = min_rainfall
    if min_population is not None:
        custom_thresholds["min_population_exposed"] = min_population

    red_zone_features = []
    candidate_zone_features = []
    
    total_red_zones_count = 0
    critical_count = 0
    high_count = 0
    total_population_at_risk = 0

    for z in zones:
        zone_dict = {
            "code": z.code,
            "name": z.name,
            "population": z.population,
            "buildings": z.buildings,
            "deformation_rate": z.deformation_rate,
            "slope": z.slope,
            "rainfall": z.rainfall,
            "distance_to_river": z.distance_to_river,
            "elevation": z.elevation,
            "susceptibility_score": z.susceptibility_score,
            "geology": z.geology or "Weathered Charnockite Gneiss",
            "hazard_type": z.land_use or "Landslide Creep",
            "has_disaster_history": True
        }

        # Apply Automated Classification Engine
        evaluation = redzone_classifier.evaluate_zone(zone_dict, custom_thresholds)
        is_red = evaluation["is_red_zone"]

        # Parse geometry
        geom = json.loads(z.geometry_geojson) if z.geometry_geojson else {
            "type": "Point",
            "coordinates": [z.center_lng, z.center_lat]
        }

        # Extract district name from zone name
        zone_dist = "Nilgiris"
        if "Coimbatore" in z.name: zone_dist = "Coimbatore"
        elif "Dindigul" in z.name or "Kodaikanal" in z.name: zone_dist = "Dindigul"
        elif "Theni" in z.name or "Meghamalai" in z.name or "Bodi" in z.name: zone_dist = "Theni"
        elif "Tenkasi" in z.name or "Courtallam" in z.name: zone_dist = "Tenkasi"
        elif "Tirunelveli" in z.name or "Manjolai" in z.name: zone_dist = "Tirunelveli"
        elif "Salem" in z.name or "Yercaud" in z.name: zone_dist = "Salem"
        elif "Namakkal" in z.name or "Kolli" in z.name: zone_dist = "Namakkal"
        elif "Kanyakumari" in z.name or "Pechiparai" in z.name: zone_dist = "Kanyakumari"
        elif "Cuddalore" in z.name: zone_dist = "Cuddalore"
        elif "Nagapattinam" in z.name: zone_dist = "Nagapattinam"
        elif "Chennai" in z.name: zone_dist = "Chennai"

        feature_props = {
            "id": z.id,
            "code": z.code,
            "name": z.name,
            "district": zone_dist,
            "hazard_type": z.land_use or "Landslide Creep",
            "risk_level": evaluation["risk_level"],
            "risk_score": evaluation["risk_score"],
            "susceptibility_score": z.susceptibility_score,
            "population": z.population,
            "buildings": z.buildings,
            "deformation_rate": z.deformation_rate,
            "slope": z.slope,
            "rainfall": z.rainfall,
            "distance_to_river": z.distance_to_river,
            "elevation": z.elevation,
            "geology": z.geology,
            "vulnerability_score": z.vulnerability_score,
            "recommended_action": z.recommended_action,
            "center_lat": z.center_lat,
            "center_lng": z.center_lng,
            "is_red_zone": is_red,
            "classification_reasons": evaluation["reasons"],
            "condition_matrix": evaluation["condition_matrix"],
            "condition_hits_count": evaluation["condition_hits_count"],
            "extrusion_height_m": evaluation["extrusion_height_m"],
            "fill_color": "#ef4444" if evaluation["risk_level"] == "CRITICAL" else "#f97316"
        }

        # Apply Optional User Filters
        if district and district != "ALL" and zone_dist.lower() != district.lower():
            continue
        if hazard_type and hazard_type != "ALL":
            if hazard_type.lower() not in (z.land_use or "").lower():
                continue
        if risk_level and risk_level != "ALL":
            if evaluation["risk_level"].upper() != risk_level.upper():
                continue
        if min_deformation is not None and z.deformation_rate < min_deformation:
            continue
        if min_rainfall is not None and z.rainfall < min_rainfall:
            continue
        if min_population is not None and z.population < min_population:
            continue

        feature = {
            "type": "Feature",
            "properties": feature_props,
            "geometry": geom
        }

        if is_red:
            red_zone_features.append(feature)
            total_red_zones_count += 1
            if evaluation["risk_level"] == "CRITICAL":
                critical_count += 1
            else:
                high_count += 1
            total_population_at_risk += z.population
        else:
            candidate_zone_features.append(feature)

    # Habitations GeoJSON
    village_features = []
    for v in villages:
        village_features.append({
            "type": "Feature",
            "properties": {
                "id": v.id,
                "code": v.code,
                "name": v.name,
                "block": v.block,
                "population": v.population,
                "households": v.households,
                "elderly_count": v.elderly_count,
                "children_count": v.children_count,
                "pwd_count": v.pwd_count,
                "zone_code": v.zone_code
            },
            "geometry": {
                "type": "Point",
                "coordinates": [v.lng, v.lat]
            }
        })

    # PSInSAR Points GeoJSON
    ps_features = []
    for dp in deformation_pts:
        ps_features.append({
            "type": "Feature",
            "properties": {
                "point_code": dp.point_code,
                "velocity_mm_yr": dp.velocity_mm_yr,
                "status": dp.status,
                "coherence": dp.coherence,
                "orbit_track": dp.orbit_track,
                "zone_code": dp.zone_code
            },
            "geometry": {
                "type": "Point",
                "coordinates": [dp.lng, dp.lat]
            }
        })

    # Rivers GeoJSON
    river_features = [
        {
            "type": "Feature",
            "properties": {"name": r["name"]},
            "geometry": {"type": "LineString", "coordinates": r["coords"]}
        }
        for r in TN_RIVERS
    ]

    # Highways GeoJSON
    highway_features = [
        {
            "type": "Feature",
            "properties": {"name": h["name"], "type": h["type"]},
            "geometry": {"type": "LineString", "coordinates": h["coords"]}
        }
        for h in TN_HIGHWAYS
    ]

    # Peaks GeoJSON
    peak_features = [
        {
            "type": "Feature",
            "properties": {"name": p["name"], "elevation_m": p["elevation_m"], "district": p["district"]},
            "geometry": {"type": "Point", "coordinates": p["coords"]}
        }
        for p in TN_PEAKS
    ]

    # Critical Infrastructure
    infra_points = [
        {"name": "Government Lawley Hospital Coonoor", "type": "Hospital", "coords": [76.7930, 11.3520], "capacity_beds": 140},
        {"name": "Mettupalayam Government Taluk Hospital", "type": "Hospital", "coords": [76.9480, 11.2990], "capacity_beds": 180},
        {"name": "Ooty Government Headquarters Hospital", "type": "Hospital", "coords": [76.7020, 11.4110], "capacity_beds": 350},
        {"name": "Valparai Taluk Hospital", "type": "Hospital", "coords": [76.9580, 10.3240], "capacity_beds": 120},
        {"name": "Kodaikanal Government Hospital", "type": "Hospital", "coords": [77.4890, 10.2310], "capacity_beds": 160},
        {"name": "TNDRF Disaster Staging Base (Mettupalayam)", "type": "Shelter", "coords": [76.9490, 11.3010], "shelter_capacity": 2000},
        {"name": "TNDRF Western Ghats Post (Pollachi)", "type": "Shelter", "coords": [77.0080, 10.6620], "shelter_capacity": 2500},
        {"name": "Cuddalore Multipurpose Cyclone Shelter", "type": "Shelter", "coords": [79.7420, 11.7580], "shelter_capacity": 3500}
    ]
    infra_features = [
        {
            "type": "Feature",
            "properties": item,
            "geometry": {"type": "Point", "coordinates": item["coords"]}
        }
        for item in infra_points
    ]

    # Candidate Safe Relocation Sites
    site_features = []
    for s in relocation_sites:
        geom = json.loads(s.geometry_geojson) if s.geometry_geojson else {
            "type": "Point",
            "coordinates": [s.lng, s.lat]
        }
        site_features.append({
            "type": "Feature",
            "properties": {
                "code": s.code,
                "name": s.name,
                "usable_area_sqm": s.usable_area_sqm,
                "elevation": s.elevation,
                "slope": s.slope,
                "road_accessibility": s.road_accessibility,
                "ecc": s.ecc,
                "suitability_score": s.suitability_score,
                "status": s.status,
                "lat": s.lat,
                "lng": s.lng
            },
            "geometry": geom
        })

    return {
        "status": "success",
        "red_zones": {
            "type": "FeatureCollection",
            "features": red_zone_features
        },
        "candidate_zones_below_threshold": {
            "type": "FeatureCollection",
            "features": candidate_zone_features
        },
        "villages": {
            "type": "FeatureCollection",
            "features": village_features
        },
        "ps_insar": {
            "type": "FeatureCollection",
            "features": ps_features
        },
        "rivers": {
            "type": "FeatureCollection",
            "features": river_features
        },
        "highways": {
            "type": "FeatureCollection",
            "features": highway_features
        },
        "peaks": {
            "type": "FeatureCollection",
            "features": peak_features
        },
        "infrastructure": {
            "type": "FeatureCollection",
            "features": infra_features
        },
        "relocation_sites": {
            "type": "FeatureCollection",
            "features": site_features
        },
        "summary": {
            "total_detected_red_zones": total_red_zones_count,
            "critical_risk_zones": critical_count,
            "high_risk_zones": high_count,
            "total_population_at_risk": total_population_at_risk,
            "thresholds_applied": custom_thresholds
        }
    }

@router.post("/evaluate-criteria")
def evaluate_custom_criteria(req: CustomCriteriaRequest, db: Session = Depends(get_db)):
    """Dynamic scenario evaluation across all candidate spatial zones in Tamil Nadu."""
    zones = db.query(HazardZone).all()
    results = []
    
    thresholds = {
        "min_risk_score": req.min_risk_score or 75.0,
        "min_susceptibility": req.min_susceptibility or 0.78,
        "min_deformation_rate": req.min_deformation_rate or 10.0,
        "min_slope": req.min_slope or 25.0,
        "min_rainfall": req.min_rainfall or 1200.0,
        "min_population_exposed": req.min_population_exposed or 1000,
        "require_insar_or_rain": req.require_insar_or_rain if req.require_insar_or_rain is not None else True
    }

    for z in zones:
        zone_dict = {
            "code": z.code,
            "name": z.name,
            "population": z.population,
            "deformation_rate": z.deformation_rate,
            "slope": z.slope,
            "rainfall": z.rainfall,
            "distance_to_river": z.distance_to_river,
            "elevation": z.elevation,
            "susceptibility_score": z.susceptibility_score,
            "geology": z.geology or "Weathered Charnockite Gneiss",
            "hazard_type": z.land_use or "Landslide Creep",
            "has_disaster_history": True
        }
        res = redzone_classifier.evaluate_zone(zone_dict, thresholds)
        results.append({
            "code": z.code,
            "name": z.name,
            "is_red_zone": res["is_red_zone"],
            "risk_score": res["risk_score"],
            "risk_level": res["risk_level"],
            "reasons": res["reasons"],
            "condition_matrix": res["condition_matrix"]
        })

    red_count = sum(1 for r in results if r["is_red_zone"])
    return {
        "total_zones_evaluated": len(results),
        "total_red_zones_detected": red_count,
        "thresholds_applied": thresholds,
        "evaluated_zones": results
    }

@router.get("/{code}")
def get_zone_by_code(code: str, db: Session = Depends(get_db)):
    """Fetch complete details and geometry for a specific hazard zone (e.g. ZONE-TN-001)."""
    clean_code = code.upper()
    if not clean_code.startswith("ZONE-") and not clean_code.startswith("RZ-") and not clean_code.startswith("TN-"):
        clean_code = f"ZONE-{clean_code}"
    if clean_code.startswith("RZ-") or clean_code.startswith("TN-"):
        clean_code = f"ZONE-{clean_code}"
        
    zone = db.query(HazardZone).filter(HazardZone.code == clean_code).first()
    if not zone:
        zone = db.query(HazardZone).filter(HazardZone.code.ilike(f"%{code}%")).first()
        
    if not zone:
        raise HTTPException(status_code=404, detail=f"Hazard zone {code} not found")
        
    geom = json.loads(zone.geometry_geojson) if zone.geometry_geojson else None
    
    # Run evaluation to get exact reasons
    zone_dict = {
        "code": zone.code,
        "name": zone.name,
        "population": zone.population,
        "deformation_rate": zone.deformation_rate,
        "slope": zone.slope,
        "rainfall": zone.rainfall,
        "distance_to_river": zone.distance_to_river,
        "elevation": zone.elevation,
        "susceptibility_score": zone.susceptibility_score,
        "geology": zone.geology or "Weathered Charnockite",
        "hazard_type": zone.land_use or "Landslide Creep",
        "has_disaster_history": True
    }
    eval_res = redzone_classifier.evaluate_zone(zone_dict)

    return {
        "id": zone.id,
        "code": zone.code,
        "name": zone.name,
        "risk_level": eval_res["risk_level"],
        "risk_score": eval_res["risk_score"],
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
        "geometry": geom,
        "is_red_zone": eval_res["is_red_zone"],
        "classification_reasons": eval_res["reasons"],
        "condition_matrix": eval_res["condition_matrix"],
        "extrusion_height_m": eval_res["extrusion_height_m"]
    }

@router.get("/{code}/shap")
def get_zone_shap_explanation(code: str, db: Session = Depends(get_db)):
    """Returns SHAP feature attributions and natural-language risk explanation for the zone."""
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
