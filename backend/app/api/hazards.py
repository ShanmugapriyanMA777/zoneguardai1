import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import HazardZone, Village, DeformationPoint, RelocationSite
from app.ml.woe import woe_engine

router = APIRouter(prefix="/hazards", tags=["Hazards & GIS Layers"])

@router.get("/layers")
def get_gis_layers(db: Session = Depends(get_db)):
    """
    Returns full GeoJSON FeatureCollections for all GIS Command Center layers:
    - Red-Zones & Multi-Hazard Polygons
    - Habitations & Villages
    - PSInSAR Ground Deformation Scatterers
    - Candidate Relocation Sites
    - Critical Infrastructure
    """
    zones = db.query(HazardZone).all()
    villages = db.query(Village).all()
    deformation_pts = db.query(DeformationPoint).all()
    relocation_sites = db.query(RelocationSite).all()
    
    # 1. Red Zones GeoJSON FeatureCollection
    zone_features = []
    for z in zones:
        geom = json.loads(z.geometry_geojson) if z.geometry_geojson else {
            "type": "Point",
            "coordinates": [z.center_lng, z.center_lat]
        }
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

        zone_features.append({
            "type": "Feature",
            "properties": {
                "id": z.id,
                "code": z.code,
                "name": z.name,
                "district": zone_dist,
                "hazard_type": z.land_use or "Landslide Creep",
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
                "geology": z.geology,
                "vulnerability_score": z.vulnerability_score,
                "recommended_action": z.recommended_action,
                "center_lat": z.center_lat,
                "center_lng": z.center_lng
            },
            "geometry": geom
        })
        
    # 2. Villages GeoJSON
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
                "hazard_score": v.hazard_score,
                "vulnerability_score": v.vulnerability_score,
                "elderly_count": v.elderly_count,
                "children_count": v.children_count,
                "pwd_count": v.pwd_count,
                "vulnerable_households": v.vulnerable_households,
                "zone_code": v.zone_code
            },
            "geometry": {
                "type": "Point",
                "coordinates": [v.lng, v.lat]
            }
        })
        
    # 3. Deformation Points GeoJSON
    deformation_features = []
    for dp in deformation_pts:
        deformation_features.append({
            "type": "Feature",
            "properties": {
                "id": dp.id,
                "point_code": dp.point_code,
                "velocity_mm_yr": dp.velocity_mm_yr,
                "status": dp.status,
                "coherence": dp.coherence,
                "orbit_track": dp.orbit_track,
                "zone_code": dp.zone_code,
                "last_updated": dp.last_updated
            },
            "geometry": {
                "type": "Point",
                "coordinates": [dp.lng, dp.lat]
            }
        })
        
    # 4. Relocation Sites GeoJSON
    site_features = []
    for s in relocation_sites:
        geom = json.loads(s.geometry_geojson) if s.geometry_geojson else {
            "type": "Point",
            "coordinates": [s.lng, s.lat]
        }
        site_features.append({
            "type": "Feature",
            "properties": {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "total_area_sqm": s.total_area_sqm,
                "usable_area_sqm": s.usable_area_sqm,
                "elevation": s.elevation,
                "slope": s.slope,
                "road_accessibility": s.road_accessibility,
                "pcc": s.pcc,
                "correction_factor": s.correction_factor,
                "rcc": s.rcc,
                "management_factor": s.management_factor,
                "ecc": s.ecc,
                "suitability_score": s.suitability_score,
                "status": s.status,
                "lat": s.lat,
                "lng": s.lng
            },
            "geometry": geom
        })
        
    # 5. Critical Infrastructure across all Indian Disaster Hotspots
    infra_points = [
        # Tamil Nadu
        {"name": "Government Lawley Hospital Coonoor", "type": "Hospital", "lat": 11.3520, "lng": 76.7930, "capacity_beds": 140},
        {"name": "Mettupalayam Government Taluk Hospital", "type": "Hospital", "lat": 11.2990, "lng": 76.9480, "capacity_beds": 180},
        {"name": "Ooty Government Headquarters Hospital", "type": "Hospital", "lat": 11.4110, "lng": 76.7020, "capacity_beds": 350},
        {"name": "Mettupalayam Municipal Higher Secondary School", "type": "School", "lat": 11.3020, "lng": 76.9520, "shelter_capacity": 800},
        {"name": "TNDRF Disaster Staging Post 1 (Mettupalayam)", "type": "Shelter", "lat": 11.3010, "lng": 76.9490, "shelter_capacity": 2000},
        # Uttarakhand
        {"name": "Joshimath Community Health Centre", "type": "Hospital", "lat": 30.5560, "lng": 79.5640, "capacity_beds": 90},
        {"name": "Pipalkoti Emergency Relief Base", "type": "Shelter", "lat": 30.4350, "lng": 79.4310, "shelter_capacity": 1500},
        {"name": "Gauchar Airstrip Disaster Logistics Hub", "type": "Shelter", "lat": 30.2940, "lng": 79.1580, "shelter_capacity": 3000},
        # Kerala
        {"name": "Kalpetta District Hospital (Wayanad)", "type": "Hospital", "lat": 11.6110, "lng": 76.0850, "capacity_beds": 250},
        {"name": "Meppadi Relief Camp Staging Facility", "type": "Shelter", "lat": 11.5580, "lng": 76.1310, "shelter_capacity": 1200},
        # Himachal Pradesh
        {"name": "Indira Gandhi Medical College (Shimla)", "type": "Hospital", "lat": 31.1080, "lng": 77.1780, "capacity_beds": 600},
        {"name": "Kangra Zonal Disaster Response Post", "type": "Shelter", "lat": 32.1020, "lng": 76.2720, "shelter_capacity": 1800},
        # Odisha
        {"name": "Puri District Headquarters Hospital", "type": "Hospital", "lat": 19.8160, "lng": 85.8340, "capacity_beds": 320},
        {"name": "Odisha State Super Cyclone Multipurpose Shelter", "type": "Shelter", "lat": 19.8210, "lng": 85.8420, "shelter_capacity": 3500},
        # Assam
        {"name": "Gauhati Medical College & Hospital", "type": "Hospital", "lat": 26.1480, "lng": 91.7410, "capacity_beds": 800},
        {"name": "Brahmaputra Flood Evacuation Staging Hub", "type": "Shelter", "lat": 26.1410, "lng": 91.7960, "shelter_capacity": 4000},
        # Gujarat
        {"name": "GK General Hospital (Bhuj, Kutch)", "type": "Hospital", "lat": 23.2460, "lng": 69.6710, "capacity_beds": 400},
        {"name": "Gandhidham Seismic Emergency Relief Complex", "type": "Shelter", "lat": 23.0790, "lng": 70.1370, "shelter_capacity": 2500}
    ]
    infra_features = [
        {
            "type": "Feature",
            "properties": item,
            "geometry": {"type": "Point", "coordinates": [item["lng"], item["lat"]]}
        }
        for item in infra_points
    ]

    return {
        "red_zones": {"type": "FeatureCollection", "features": zone_features},
        "villages": {"type": "FeatureCollection", "features": village_features},
        "deformation_points": {"type": "FeatureCollection", "features": deformation_features},
        "relocation_sites": {"type": "FeatureCollection", "features": site_features},
        "infrastructure": {"type": "FeatureCollection", "features": infra_features}
    }

@router.get("/factors")
def get_hazard_factors():
    """Returns WoE factor contribution breakdown for multi-hazard conditioning."""
    return {
        "factors": woe_engine.get_summary_table(),
        "model_architecture": "Weight of Evidence (WoE) + Random Forest Hybrid Susceptibility",
        "demo_mode_badge": "Simulated Conditioning Factor Baseline"
    }
