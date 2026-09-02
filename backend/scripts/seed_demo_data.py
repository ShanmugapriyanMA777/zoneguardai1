import os
import sys
import json
import math
import random

# Add parent directory to sys.path so app modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import engine, SessionLocal, Base
from app.db.models import (
    User, HazardZone, Village, DeformationPoint, DeformationTimeSeries,
    RelocationSite, FieldSurvey, Alert, ModelRun, AuditLog
)
from app.core.security import get_password_hash
from app.services.capacity_service import capacity_engine
from app.services.redzone_classifier import redzone_classifier

def generate_zone_polygon(center_lat: float, center_lng: float, radius_km: float = 0.85, points_count: int = 8) -> str:
    """Generates realistic GeoJSON Polygon coordinates around center."""
    coords = []
    lat_deg_per_km = 1.0 / 111.0
    lng_deg_per_km = 1.0 / (111.0 * math.cos(math.radians(center_lat)))
    
    for i in range(points_count):
        angle = (i / float(points_count)) * 2 * math.pi
        r = radius_km * (0.85 + 0.3 * random.random())
        lat = center_lat + r * math.sin(angle) * lat_deg_per_km
        lng = center_lng + r * math.cos(angle) * lng_deg_per_km
        coords.append([round(lng, 6), round(lat, 6)])
    coords.append(coords[0])  # Close polygon
    
    return json.dumps({"type": "Polygon", "coordinates": [coords]})

def seed_database():
    print("[*] Recreating database tables for Tamil Nadu Multi-Hazard Disaster Grid...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    random.seed(42)
    
    print("[*] Seeding Disaster Authority Users...")
    users = [
        User(
            email="admin@zoneguard.gov.in",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. K. Senthil Nathan, IAS (State Disaster Management Commissioner, TNDMA)",
            role="ADMIN",
            district="Tamil Nadu State Disaster Management Command"
        ),
        User(
            email="tn.officer@zoneguard.gov.in",
            hashed_password=get_password_hash("officer123"),
            full_name="R. Kavitha (TNDMA Field Incident Commander, Western Ghats)",
            role="FIELD_OFFICER",
            district="Tamil Nadu Western Ghats & Coastal Grid"
        ),
        User(
            email="scientist@zoneguard.gov.in",
            hashed_password=get_password_hash("analyst123"),
            full_name="Dr. S. Ramanathan, ISRO / TNDMA Remote Sensing Lead",
            role="ANALYST",
            district="TNDMA State Remote Sensing Centre (Chennai)"
        )
    ]
    for u in users:
        db.add(u)
        
    print("[*] Seeding Comprehensive Tamil Nadu Multi-Hazard Red-Zones across All Disaster Districts...")
    zone_templates = [
        # =========================================================================
        # 1. TAMIL NADU — NILGIRIS WESTERN GHATS SECTORS
        # =========================================================================
        {
            "code": "ZONE-TN-001",
            "name": "Coonoor Marapallam Ghats Subsidence Sector (Nilgiris, TN)",
            "district": "Nilgiris",
            "hazard_type": "Landslide Creep & Highway Toe Erosion",
            "population": 2840,
            "buildings": 613,
            "deformation_rate": 18.6,
            "slope": 34.2,
            "rainfall": 1480.0,
            "distance_to_river": 320.0,
            "elevation": 1850.0,
            "susceptibility_score": 0.94,
            "geology": "Fractured Charnockite & Weathered Colluvium",
            "recommended_action": "Priority pre-disaster relocation to Mettupalayam Safe Plateau (SITE-07)",
            "center_lat": 11.3530,
            "center_lng": 76.7950,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-002",
            "name": "Kotagiri Kattery Ravines Landslide Corridor (Nilgiris, TN)",
            "district": "Nilgiris",
            "hazard_type": "Debris Flow & Deep Scarp Failure",
            "population": 1950,
            "buildings": 380,
            "deformation_rate": 14.4,
            "slope": 31.5,
            "rainfall": 1420.0,
            "distance_to_river": 180.0,
            "elevation": 1780.0,
            "susceptibility_score": 0.89,
            "geology": "Deep Weathered Lateritic Clay Mantle",
            "recommended_action": "Controlled deep drainage diversion & hillside anchor piling",
            "center_lat": 11.4180,
            "center_lng": 76.8620,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-003",
            "name": "Ooty Doddabetta High-Altitude Cut-Slope (Nilgiris, TN)",
            "district": "Nilgiris",
            "hazard_type": "Highway Cut-Slope Rockfall & Creep",
            "population": 2400,
            "buildings": 490,
            "deformation_rate": 12.8,
            "slope": 38.0,
            "rainfall": 1650.0,
            "distance_to_river": 450.0,
            "elevation": 2420.0,
            "susceptibility_score": 0.87,
            "geology": "Jointed Archaean Gneiss with Steep Bedding",
            "recommended_action": "Retaining wall reinforcement along NH-181 tourist corridor",
            "center_lat": 11.4010,
            "center_lng": 76.7350,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-004",
            "name": "Gudalur Devala Gold-Belt Debris Slump (Nilgiris, TN)",
            "district": "Nilgiris",
            "hazard_type": "Torrential Soil Slump & Mine Subsidences",
            "population": 3400,
            "buildings": 720,
            "deformation_rate": 17.5,
            "slope": 29.5,
            "rainfall": 2450.0,
            "distance_to_river": 140.0,
            "elevation": 980.0,
            "susceptibility_score": 0.93,
            "geology": "Weathered Auriferous Quartzite & Colluvium",
            "recommended_action": "Permanent building decommissioning & plantation worker shelter",
            "center_lat": 11.4780,
            "center_lng": 76.3850,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-005",
            "name": "Lovedale Fernhill Heritage Railway Slump (Nilgiris, TN)",
            "district": "Nilgiris",
            "hazard_type": "Railway Embankment Toe Erosion",
            "population": 1620,
            "buildings": 320,
            "deformation_rate": 13.8,
            "slope": 28.5,
            "rainfall": 1450.0,
            "distance_to_river": 380.0,
            "elevation": 2150.0,
            "susceptibility_score": 0.86,
            "geology": "Saturated Colluvium overlying Impermeable Bedrock",
            "recommended_action": "Sub-surface siphon drainage & micro-pile reinforcement",
            "center_lat": 11.3850,
            "center_lng": 76.6980,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-006",
            "name": "Pykara Glenmorgan Escarpment & Penstock Slump (Nilgiris, TN)",
            "district": "Nilgiris",
            "hazard_type": "High-Pressure Penstock Slope Subsidence",
            "population": 1480,
            "buildings": 280,
            "deformation_rate": 16.1,
            "slope": 36.0,
            "rainfall": 1750.0,
            "distance_to_river": 160.0,
            "elevation": 2050.0,
            "susceptibility_score": 0.91,
            "geology": "Fractured Charnockite Bedrock Shear Zone",
            "recommended_action": "Penstock hillside stabilization & power utility worker relocation",
            "center_lat": 11.4890,
            "center_lng": 76.6120,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-007",
            "name": "Kundah Hydro Catchment Avalanche Sector (Nilgiris, TN)",
            "district": "Nilgiris",
            "hazard_type": "Reservoir Rim Soil Liquefaction & Slip",
            "population": 1820,
            "buildings": 340,
            "deformation_rate": 15.2,
            "slope": 32.5,
            "rainfall": 1890.0,
            "distance_to_river": 90.0,
            "elevation": 1920.0,
            "susceptibility_score": 0.88,
            "geology": "Deep Weathered Gneissic Regolith",
            "recommended_action": "Catchment contour trenching & early telemetry sirens",
            "center_lat": 11.3150,
            "center_lng": 76.6850,
            "has_disaster_history": True
        },

        # =========================================================================
        # 2. TAMIL NADU — COIMBATORE / ANAMALAI HILLS SECTORS
        # =========================================================================
        {
            "code": "ZONE-TN-008",
            "name": "Valparai 40-Hairpin Ghat Road Escarpment (Coimbatore, TN)",
            "district": "Coimbatore",
            "hazard_type": "Torrential Debris Flow & Rockfall",
            "population": 2850,
            "buildings": 580,
            "deformation_rate": 19.8,
            "slope": 36.5,
            "rainfall": 2950.0,
            "distance_to_river": 95.0,
            "elevation": 1180.0,
            "susceptibility_score": 0.96,
            "geology": "Charnockite Massif with Active Hydro-fracturing",
            "recommended_action": "Priority pre-monsoon relocation to Pollachi Tableland (SITE-13)",
            "center_lat": 10.3270,
            "center_lng": 76.9550,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-009",
            "name": "Solaiyar Dam Rim Slope Saturated Slip (Coimbatore, TN)",
            "district": "Coimbatore",
            "hazard_type": "Reservoir Rim Slope Saturated Landslide",
            "population": 2100,
            "buildings": 420,
            "deformation_rate": 15.6,
            "slope": 33.0,
            "rainfall": 3150.0,
            "distance_to_river": 50.0,
            "elevation": 1040.0,
            "susceptibility_score": 0.92,
            "geology": "Weathered Biotite Gneiss & Submerged Toe Scarp",
            "recommended_action": "Emergency catchment shoreline barrier & settlement relocation",
            "center_lat": 10.3010,
            "center_lng": 76.8820,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-010",
            "name": "Aliyar Dam Foothills Landslide Chute (Coimbatore, TN)",
            "district": "Coimbatore",
            "hazard_type": "Basin Toe Boulder Chute & Scarp Failure",
            "population": 1750,
            "buildings": 350,
            "deformation_rate": 13.5,
            "slope": 31.0,
            "rainfall": 1680.0,
            "distance_to_river": 110.0,
            "elevation": 420.0,
            "susceptibility_score": 0.85,
            "geology": "Jointed Granulite & Coarse Scree",
            "recommended_action": "Reinforced concrete rock-shed & highway deflection bund",
            "center_lat": 10.4850,
            "center_lng": 76.9750,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-011",
            "name": "Siruvani Hills Toe Erosion & Creep Zone (Coimbatore, TN)",
            "district": "Coimbatore",
            "hazard_type": "Water Catchment Deep Soil Creep",
            "population": 1600,
            "buildings": 310,
            "deformation_rate": 14.1,
            "slope": 29.5,
            "rainfall": 2100.0,
            "distance_to_river": 60.0,
            "elevation": 860.0,
            "susceptibility_score": 0.88,
            "geology": "Biotite Gneiss with High Hydrostatic Pressure",
            "recommended_action": "Vegetative bio-engineering & tribal hamlet relocation buffer",
            "center_lat": 10.9650,
            "center_lng": 76.6890,
            "has_disaster_history": True
        },

        # =========================================================================
        # 3. TAMIL NADU — DINDIGUL / KODAIKANAL PALANI HILLS
        # =========================================================================
        {
            "code": "ZONE-TN-012",
            "name": "Kodaikanal Pillar Rocks Shear Fracture Scarp (Dindigul, TN)",
            "district": "Dindigul",
            "hazard_type": "Vertical Cliff Scarp Shear & Topple",
            "population": 2250,
            "buildings": 440,
            "deformation_rate": 16.8,
            "slope": 42.0,
            "rainfall": 1720.0,
            "distance_to_river": 280.0,
            "elevation": 2180.0,
            "susceptibility_score": 0.94,
            "geology": "High-Grade Granulite Shear Zone",
            "recommended_action": "Perimeter safety buffer & tourist evacuation siren trigger to Batlagundu (SITE-16)",
            "center_lat": 10.2110,
            "center_lng": 77.4670,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-013",
            "name": "Perumalmalai Ghat Road Runout Corridor (Dindigul, TN)",
            "district": "Dindigul",
            "hazard_type": "Debris Avalanche & Highway Cut-Slope Failure",
            "population": 1890,
            "buildings": 360,
            "deformation_rate": 13.9,
            "slope": 34.0,
            "rainfall": 1480.0,
            "distance_to_river": 190.0,
            "elevation": 1520.0,
            "susceptibility_score": 0.88,
            "geology": "Weathered Granitic Gneiss with High Pore Pressure",
            "recommended_action": "Batted gabion retaining structures and early rain alarms",
            "center_lat": 10.2640,
            "center_lng": 77.5450,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-014",
            "name": "Silver Cascade Waterfall Landslide Sector (Dindigul, TN)",
            "district": "Dindigul",
            "hazard_type": "Torrential Boulder Washout & Gorge Collapse",
            "population": 1520,
            "buildings": 290,
            "deformation_rate": 14.5,
            "slope": 37.0,
            "rainfall": 1640.0,
            "distance_to_river": 40.0,
            "elevation": 1780.0,
            "susceptibility_score": 0.90,
            "geology": "Steep Fractured Gneiss with Waterfall Plunge Toe Undercutting",
            "recommended_action": "Drainage cascades and tourist road traffic management",
            "center_lat": 10.2450,
            "center_lng": 77.5180,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-015",
            "name": "Pannaikadu Coffee Estate Slope Failure (Dindigul, TN)",
            "district": "Dindigul",
            "hazard_type": "Terraced Plantation Soil Slump & Mudflow",
            "population": 2100,
            "buildings": 410,
            "deformation_rate": 15.0,
            "slope": 30.0,
            "rainfall": 1580.0,
            "distance_to_river": 150.0,
            "elevation": 1350.0,
            "susceptibility_score": 0.87,
            "geology": "Colluvial Soil Mantle over Massive Bedrock",
            "recommended_action": "Plantation worker safety relocation to Batlagundu buffer",
            "center_lat": 10.2850,
            "center_lng": 77.6250,
            "has_disaster_history": True
        },

        # =========================================================================
        # 4. TAMIL NADU — THENI / MEGHAMALAI & BODI METTU
        # =========================================================================
        {
            "code": "ZONE-TN-016",
            "name": "Bodinayakkanur Bodi Mettu Ghat Pass (Theni, TN)",
            "district": "Theni",
            "hazard_type": "Interstate Ghat Highway Landslide Corridor",
            "population": 2450,
            "buildings": 510,
            "deformation_rate": 15.8,
            "slope": 36.0,
            "rainfall": 1380.0,
            "distance_to_river": 340.0,
            "elevation": 1200.0,
            "susceptibility_score": 0.91,
            "geology": "Fractured Charnockite with Joint Water Seepage",
            "recommended_action": "Rock-fall barrier drapery & heavy vehicle bypass plan to Chinnamanur (SITE-17)",
            "center_lat": 10.0210,
            "center_lng": 77.2980,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-017",
            "name": "Meghamalai Highwavys Tea Estate Soil Slip (Theni, TN)",
            "district": "Theni",
            "hazard_type": "Torrential Soil Liquefaction & Planar Slide",
            "population": 2150,
            "buildings": 430,
            "deformation_rate": 18.4,
            "slope": 32.5,
            "rainfall": 2150.0,
            "distance_to_river": 110.0,
            "elevation": 1450.0,
            "susceptibility_score": 0.93,
            "geology": "Unconsolidated Colluvium on Steep Gneiss Surface",
            "recommended_action": "Evacuation to Chinnamanur Safe Buffer Settlement (SITE-17)",
            "center_lat": 9.7120,
            "center_lng": 77.3820,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-018",
            "name": "Kumbakkarai Falls Upper Gorge Flash Zone (Theni, TN)",
            "district": "Theni",
            "hazard_type": "Torrential Flash Flood & Rock Boulder Chute",
            "population": 1680,
            "buildings": 320,
            "deformation_rate": 13.2,
            "slope": 35.0,
            "rainfall": 1460.0,
            "distance_to_river": 35.0,
            "elevation": 400.0,
            "susceptibility_score": 0.86,
            "geology": "Steep Jointed Gneissic Valley Gorge",
            "recommended_action": "Acoustic early flash warning and automated barrier gates",
            "center_lat": 10.1780,
            "center_lng": 77.5320,
            "has_disaster_history": True
        },

        # =========================================================================
        # 5. TAMIL NADU — TENKASI & TIRUNELVELI WESTERN GHATS
        # =========================================================================
        {
            "code": "ZONE-TN-019",
            "name": "Courtallam Five Falls Upper Catchment Torrent (Tenkasi, TN)",
            "district": "Tenkasi",
            "hazard_type": "Flash Flood Torrent & Boulder Debris Surge",
            "population": 2650,
            "buildings": 540,
            "deformation_rate": 14.8,
            "slope": 35.0,
            "rainfall": 1950.0,
            "distance_to_river": 40.0,
            "elevation": 420.0,
            "susceptibility_score": 0.91,
            "geology": "Steep Valley Gorge Granulite with Boulder Accumulation",
            "recommended_action": "Automated flash flood acoustic sensor & gate cutoff to Ambasamudram (SITE-18)",
            "center_lat": 8.9320,
            "center_lng": 77.2650,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-020",
            "name": "Manjolai Kakachi Rainforest Escarpment (Tirunelveli, TN)",
            "district": "Tirunelveli",
            "hazard_type": "Monsoon Escarpment Debris Slump",
            "population": 2200,
            "buildings": 460,
            "deformation_rate": 19.5,
            "slope": 38.0,
            "rainfall": 2800.0,
            "distance_to_river": 85.0,
            "elevation": 1150.0,
            "susceptibility_score": 0.95,
            "geology": "Deep Weathered Rainforest Humus over Charnockite",
            "recommended_action": "Priority pre-disaster worker evacuation to Ambasamudram (SITE-18)",
            "center_lat": 8.5830,
            "center_lng": 77.3910,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-021",
            "name": "Kodayar Dam Hydro Flank Creep Sector (Tirunelveli/Tenkasi, TN)",
            "district": "Tirunelveli",
            "hazard_type": "Dam Abutment Soil Liquefaction & Creep",
            "population": 1450,
            "buildings": 270,
            "deformation_rate": 16.2,
            "slope": 34.5,
            "rainfall": 2600.0,
            "distance_to_river": 70.0,
            "elevation": 1050.0,
            "susceptibility_score": 0.90,
            "geology": "Fractured Charnockite Abutment Bedrock",
            "recommended_action": "Abutment drainage galleries & emergency relief staging",
            "center_lat": 8.5320,
            "center_lng": 77.3150,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-022",
            "name": "Papanasam Upper Catchment Saturated Slip (Tirunelveli, TN)",
            "district": "Tirunelveli",
            "hazard_type": "Reservoir Flank Saturated Landslide",
            "population": 1720,
            "buildings": 330,
            "deformation_rate": 14.2,
            "slope": 31.0,
            "rainfall": 2200.0,
            "distance_to_river": 60.0,
            "elevation": 720.0,
            "susceptibility_score": 0.88,
            "geology": "Granulite Bedrock with High Pore-Water Pressure",
            "recommended_action": "Dam spillway coordination and downstream early sirens",
            "center_lat": 8.6950,
            "center_lng": 77.3350,
            "has_disaster_history": True
        },

        # =========================================================================
        # 6. TAMIL NADU — SALEM & NAMAKKAL HILLS
        # =========================================================================
        {
            "code": "ZONE-TN-023",
            "name": "Yercaud 20-Hairpin Ghat Road Landslide Zone (Salem, TN)",
            "district": "Salem",
            "hazard_type": "Steep Ghat Highway Cut-Slope Failure",
            "population": 2300,
            "buildings": 470,
            "deformation_rate": 15.4,
            "slope": 35.5,
            "rainfall": 1560.0,
            "distance_to_river": 260.0,
            "elevation": 1420.0,
            "susceptibility_score": 0.90,
            "geology": "Sheared Charnockite with Active Weathering",
            "recommended_action": "Slope anchoring, steel mesh drapery & safe relocation to Vazhapadi (SITE-19)",
            "center_lat": 11.7750,
            "center_lng": 78.2090,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-024",
            "name": "Kolli Hills 70-Hairpin Ghat Rockfall Corridor (Namakkal, TN)",
            "district": "Namakkal",
            "hazard_type": "Ghat Mountain Pass Multi-Hairpin Rockfall",
            "population": 2500,
            "buildings": 510,
            "deformation_rate": 16.5,
            "slope": 39.0,
            "rainfall": 1490.0,
            "distance_to_river": 310.0,
            "elevation": 1300.0,
            "susceptibility_score": 0.92,
            "geology": "Steep Archaean Gneiss with Perpendicular Joint Sets",
            "recommended_action": "Heavy vehicle traffic restriction & rock-catchment ditches",
            "center_lat": 11.2480,
            "center_lng": 78.3380,
            "has_disaster_history": True
        },

        # =========================================================================
        # 7. TAMIL NADU — KANYAKUMARI WESTERN GHATS TAIL
        # =========================================================================
        {
            "code": "ZONE-TN-025",
            "name": "Pechiparai Catchment Hillside Slump (Kanyakumari, TN)",
            "district": "Kanyakumari",
            "hazard_type": "Tropical Heavy-Rainfall Soil Slip",
            "population": 1920,
            "buildings": 390,
            "deformation_rate": 15.9,
            "slope": 33.0,
            "rainfall": 2400.0,
            "distance_to_river": 75.0,
            "elevation": 450.0,
            "susceptibility_score": 0.89,
            "geology": "Weathered Khondalite & Colluvium",
            "recommended_action": "Catchment bio-shield and relocation to Nagercoil Buffer (SITE-20)",
            "center_lat": 8.4850,
            "center_lng": 77.3120,
            "has_disaster_history": True
        },

        # =========================================================================
        # 8. TAMIL NADU — COASTAL SURGE & URBAN FLOOD BASINS
        # =========================================================================
        {
            "code": "ZONE-TN-026",
            "name": "Cuddalore Silver Beach & Pennaiyar Surge Basin (Cuddalore, TN)",
            "district": "Cuddalore",
            "hazard_type": "Coastal Storm Surge & Estuarine Inundation",
            "population": 6800,
            "buildings": 1450,
            "deformation_rate": 3.4,
            "slope": 0.8,
            "rainfall": 1550.0,
            "distance_to_river": 50.0,
            "elevation": 1.8,
            "susceptibility_score": 0.94,
            "geology": "Unconsolidated Coastal Alluvium & Beach Sands",
            "recommended_action": "Mass pre-cyclone evacuation to Cuddalore Semmandalam Township (SITE-08)",
            "center_lat": 11.7350,
            "center_lng": 79.7740,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-027",
            "name": "Nagapattinam Velankanni Coastal Lowlands (Nagapattinam, TN)",
            "district": "Nagapattinam",
            "hazard_type": "Cyclone Coastal Storm Surge Funnel",
            "population": 5400,
            "buildings": 1120,
            "deformation_rate": 2.8,
            "slope": 0.5,
            "rainfall": 1480.0,
            "distance_to_river": 80.0,
            "elevation": 1.5,
            "susceptibility_score": 0.91,
            "geology": "Deltaic Silts & Loose Dune Sands",
            "recommended_action": "Bio-shield mangrove reinforcement & elevated staging",
            "center_lat": 10.6820,
            "center_lng": 79.8450,
            "has_disaster_history": True
        },
        {
            "code": "ZONE-TN-028",
            "name": "Chennai Ennore Manali Flood Funnel Basin (Chennai, TN)",
            "district": "Chennai",
            "hazard_type": "Urban Riverine Flash Inundation & Industrial Surge",
            "population": 9200,
            "buildings": 2100,
            "deformation_rate": 4.1,
            "slope": 0.6,
            "rainfall": 1620.0,
            "distance_to_river": 40.0,
            "elevation": 2.1,
            "susceptibility_score": 0.95,
            "geology": "Marine Clay Deposits with Low Permeability",
            "recommended_action": "Automated Kosasthalaiyar sluice control & high-ground evacuation to Chengalpattu (SITE-21)",
            "center_lat": 13.2080,
            "center_lng": 80.3120,
            "has_disaster_history": True
        }
    ]
    
    # Evaluate every zone using the automated RedZoneClassificationEngine
    print(f"[*] Evaluating and Seeding {len(zone_templates)} Tamil Nadu Multi-Hazard Zones...")
    for zt in zone_templates:
        eval_result = redzone_classifier.evaluate_zone(zt)
        geom_json = generate_zone_polygon(zt["center_lat"], zt["center_lng"], radius_km=0.85)
        
        zone = HazardZone(
            code=zt["code"],
            name=zt["name"],
            risk_level=eval_result["risk_level"],
            risk_score=eval_result["risk_score"],
            susceptibility_score=zt["susceptibility_score"],
            population=zt["population"],
            buildings=zt["buildings"],
            deformation_rate=zt["deformation_rate"],
            slope=zt["slope"],
            rainfall=zt["rainfall"],
            distance_to_river=zt["distance_to_river"],
            elevation=zt["elevation"],
            drainage_density=1.8,
            land_use=zt.get("hazard_type", "Mountain / Coastal Hazard Zone"),
            geology=zt.get("geology", "Weathered Crystalline Bedrock"),
            seismic_intensity=8.0,
            vulnerability_score=round(eval_result["risk_score"] * 0.94, 1),
            recommended_action=zt["recommended_action"],
            center_lat=zt["center_lat"],
            center_lng=zt["center_lng"],
            geometry_geojson=geom_json
        )
        db.add(zone)
        
    print("[*] Seeding Tamil Nadu Safe Relocation Townships & Staging Sites...")
    relocation_templates = [
        {
            "code": "SITE-07",
            "name": "Mettupalayam Safe Plateau Relocation Township (Nilgiris Foothills, TN)",
            "total_area_sqm": 240000.0,
            "usable_area_sqm": 220000.0,
            "elevation": 325.0,
            "slope": 4.8,
            "road_accessibility": "Excellent (NH-181 4-Lane)",
            "lat": 11.3000,
            "lng": 76.9500
        },
        {
            "code": "SITE-12",
            "name": "Sirumugai Foothills Safe Buffer Settlement (Coimbatore/Nilgiris, TN)",
            "total_area_sqm": 180000.0,
            "usable_area_sqm": 165000.0,
            "elevation": 310.0,
            "slope": 4.2,
            "road_accessibility": "Good (State Highway 80)",
            "lat": 11.3250,
            "lng": 77.0120
        },
        {
            "code": "SITE-13",
            "name": "Pollachi Safe Elevated Bedrock Tableland (Coimbatore, TN)",
            "total_area_sqm": 280000.0,
            "usable_area_sqm": 260000.0,
            "elevation": 280.0,
            "slope": 2.5,
            "road_accessibility": "Excellent (NH-83 Corridor)",
            "lat": 10.6620,
            "lng": 77.0080
        },
        {
            "code": "SITE-16",
            "name": "Batlagundu Palani Foothills Relocation Complex (Dindigul, TN)",
            "total_area_sqm": 250000.0,
            "usable_area_sqm": 230000.0,
            "elevation": 310.0,
            "slope": 3.6,
            "road_accessibility": "Excellent (NH-183)",
            "lat": 10.1580,
            "lng": 77.7650
        },
        {
            "code": "SITE-17",
            "name": "Chinnamanur Safe High-Ground Township (Theni, TN)",
            "total_area_sqm": 220000.0,
            "usable_area_sqm": 200000.0,
            "elevation": 375.0,
            "slope": 3.2,
            "road_accessibility": "Excellent (NH-85 Corridor)",
            "lat": 9.8420,
            "lng": 77.3850
        },
        {
            "code": "SITE-18",
            "name": "Ambasamudram Safe Foothills Relocation Center (Tirunelveli/Tenkasi, TN)",
            "total_area_sqm": 260000.0,
            "usable_area_sqm": 240000.0,
            "elevation": 110.0,
            "slope": 2.8,
            "road_accessibility": "Excellent (SH-40 Corridor)",
            "lat": 8.7050,
            "lng": 77.4520
        },
        {
            "code": "SITE-19",
            "name": "Vazhapadi Elevated Safe Tableland (Salem, TN)",
            "total_area_sqm": 210000.0,
            "usable_area_sqm": 195000.0,
            "elevation": 270.0,
            "slope": 2.2,
            "road_accessibility": "Excellent (NH-79 4-Lane)",
            "lat": 11.6580,
            "lng": 78.4050
        },
        {
            "code": "SITE-20",
            "name": "Nagercoil Safe High-Ground Settlement (Kanyakumari, TN)",
            "total_area_sqm": 190000.0,
            "usable_area_sqm": 175000.0,
            "elevation": 45.0,
            "slope": 2.0,
            "road_accessibility": "Excellent (NH-66 / NH-44)",
            "lat": 8.1830,
            "lng": 77.4120
        },
        {
            "code": "SITE-08",
            "name": "Cuddalore Semmandalam High-Ground Township (Cuddalore, TN)",
            "total_area_sqm": 310000.0,
            "usable_area_sqm": 285000.0,
            "elevation": 18.0,
            "slope": 1.5,
            "road_accessibility": "Excellent (NH-45A Bypass)",
            "lat": 11.7580,
            "lng": 79.7420
        },
        {
            "code": "SITE-21",
            "name": "Chengalpattu Elevated Safe Relocation Township (Chennai South, TN)",
            "total_area_sqm": 350000.0,
            "usable_area_sqm": 320000.0,
            "elevation": 42.0,
            "slope": 1.8,
            "road_accessibility": "Excellent (GST Road / NH-32)",
            "lat": 12.6920,
            "lng": 79.9820
        }
    ]
    
    for st in relocation_templates:
        cap = capacity_engine.calculate_capacity(
            usable_area_sqm=st["usable_area_sqm"],
            slope_deg=st["slope"],
            water_availability_score=90.0,
            road_access_score=94.0 if "Excellent" in st["road_accessibility"] else 82.0
        )
        suit_score = 94.0 if st["code"] == "SITE-07" else 90.0 if "Excellent" in st["road_accessibility"] else 84.0
        
        site = RelocationSite(
            code=st["code"],
            name=st["name"],
            total_area_sqm=st["total_area_sqm"],
            usable_area_sqm=st["usable_area_sqm"],
            elevation=st["elevation"],
            slope=st["slope"],
            road_accessibility=st["road_accessibility"],
            pcc=cap["pcc"],
            correction_factor=cap["correction_factor"],
            rcc=cap["rcc"],
            management_factor=cap["management_factor"],
            ecc=cap["ecc"],
            suitability_score=suit_score,
            status="Highly Suitable" if suit_score >= 85 else "Suitable",
            lat=st["lat"],
            lng=st["lng"],
            geometry_geojson=generate_zone_polygon(st["lat"], st["lng"], radius_km=0.6)
        )
        db.add(site)
        
    print("[*] Seeding 170+ PSInSAR Scatterer Points across Tamil Nadu Red Zones...")
    for zt in zone_templates:
        base_lat = zt["center_lat"]
        base_lng = zt["center_lng"]
        
        for k in range(6):
            pcode = f"PS-TN-{zt['code'].replace('ZONE-TN-', '')}-{k+1:02d}"
            lat = round(base_lat + (random.random() - 0.5) * 0.015, 6)
            lng = round(base_lng + (random.random() - 0.5) * 0.015, 6)
            vel = round(zt["deformation_rate"] * (0.85 + 0.3 * random.random()), 2)
            
            dp = DeformationPoint(
                point_code=pcode,
                lat=lat,
                lng=lng,
                velocity_mm_yr=vel,
                status="Accelerating" if vel > 15.0 else "Active" if vel > 8.0 else "Stable",
                coherence=round(0.80 + 0.18 * random.random(), 2),
                orbit_track="Sentinel-1 Track 129 Descending (C-SAR)",
                zone_code=zt["code"],
                last_updated="2026-08-30"
            )
            db.add(dp)
            
            dates = ["2026-01-15", "2026-03-01", "2026-04-15", "2026-06-01", "2026-07-15", "2026-08-30"]
            for idx, d in enumerate(dates):
                disp = round(vel * (idx + 1) * 0.16, 2)
                ts = DeformationTimeSeries(
                    point_code=pcode,
                    date=d,
                    displacement_mm=disp,
                    velocity_trend=vel
                )
                db.add(ts)

    print("[*] Seeding Habitations & Villages across Tamil Nadu Districts...")
    for zt in zone_templates:
        v = Village(
            code=f"VIL-TN-{zt['code'].replace('ZONE-TN-', '')}",
            name=f"{zt['name'].split('(')[0].strip()} Settlement Cluster",
            block=zt.get("district", "Nilgiris"),
            population=int(zt["population"] * 0.85),
            households=int(zt["buildings"] * 0.92),
            elderly_count=int(zt["population"] * 0.14),
            children_count=int(zt["population"] * 0.19),
            pwd_count=int(zt["population"] * 0.035),
            vulnerable_households=int(zt["buildings"] * 0.38),
            hazard_score=92.0 if zt["deformation_rate"] > 15.0 or zt["susceptibility_score"] >= 0.90 else 84.0,
            vulnerability_score=88.0,
            lat=round(zt["center_lat"] + (random.random() - 0.5) * 0.008, 6),
            lng=round(zt["center_lng"] + (random.random() - 0.5) * 0.008, 6),
            zone_code=zt["code"]
        )
        db.add(v)

    print("[*] Seeding Active Early Warning Alerts...")
    alerts_data = [
        Alert(
            alert_type="CRITICAL_DEFORMATION",
            severity="CRITICAL",
            title="CRITICAL: Coonoor Ghats Creep Acceleration (+18.6 mm/yr)",
            zone_code="ZONE-TN-001",
            message="Sentinel-1 InSAR PS time-series detects accelerating slope subsidence along Marapallam NH-181.",
            site_code="SITE-07",
            is_active=True
        ),
        Alert(
            alert_type="HAZARD_INCREASE",
            severity="CRITICAL",
            title="ALERT: Valparai Extreme Monsoon Saturated Soil Slip Warning",
            zone_code="ZONE-TN-008",
            message="Monsoon rainfall threshold exceeded (2,950 mm). High pore pressure detected across Hairpin 22-38.",
            site_code="SITE-13",
            is_active=True
        ),
        Alert(
            alert_type="FIELD_VERIFICATION",
            severity="HIGH",
            title="WARNING: Kodaikanal Pillar Rocks Joint Opening Detected",
            zone_code="ZONE-TN-012",
            message="Field inspection logged 4.2 cm fissure dilatation in upper granulite rock mass.",
            site_code="SITE-16",
            is_active=True
        ),
        Alert(
            alert_type="COASTAL_SURGE",
            severity="CRITICAL",
            title="SURGE ALERT: Cuddalore Pennaiyar Estuary Surge Overflow",
            zone_code="ZONE-TN-026",
            message="High astronomical tide combined with deep depression surge funnels water into Silver Beach basin.",
            site_code="SITE-08",
            is_active=True
        )
    ]
    for alt in alerts_data:
        db.add(alt)

    db.commit()
    db.close()
    print("[SUCCESS] Comprehensive Tamil Nadu Multi-Hazard 3D Disaster Grid seeded successfully!")

if __name__ == "__main__":
    seed_database()
