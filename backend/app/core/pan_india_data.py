"""
ZoneGuard AI Core Configuration Engine
Covers all major Indian disaster corridors and hazard types:
1. Landslides & Debris Flow (Western Ghats & Himalayas)
2. Riverine & Flash Floods (Assam Brahmaputra, Bihar Kosi, Tamil Nadu Coast)
3. Coastal Cyclones & Storm Surges (Odisha, Tamil Nadu, Andhra Pradesh)
4. Seismic & Earthquake Micro-zonation (Himachal, Gujarat Kutch, Uttarakhand)
5. Ground Subsidence & Mining Voids (Joshimath Uttarakhand, Jharia Coalfields)
"""

PAN_INDIA_REGIONS = {
    "all_tn": {
        "name": "Tamil Nadu Disaster Grid",
        "state": "Tamil Nadu",
        "center": [10.8500, 78.5000],
        "zoom": 7.5,
        "primary_hazard": "Multi-Hazard Grid (Landslide Creep, Flash Floods, Coastal Surge)",
        "red_zone_count": 28
    },
    "TN_NILGIRIS": {
        "name": "Nilgiris & Western Ghats (Tamil Nadu)",
        "center_lat": 11.3530,
        "center_lng": 76.7950,
        "zoom": 11,
        "primary_hazard": "LANDSLIDE"
    },
    "UK_JOSHIMATH": {
        "name": "Joshimath & Chamoli Valley (Uttarakhand)",
        "center_lat": 30.5580,
        "center_lng": 79.5660,
        "zoom": 12,
        "primary_hazard": "SUBSIDENCE"
    },
    "KL_WAYANAD": {
        "name": "Wayanad Chooralmala Escarpment (Kerala)",
        "center_lat": 11.5320,
        "center_lng": 76.1320,
        "zoom": 12,
        "primary_hazard": "LANDSLIDE"
    },
    "HP_KANGRA": {
        "name": "Kangra & Shimla Ridge (Himachal Pradesh)",
        "center_lat": 31.1048,
        "center_lng": 77.1734,
        "zoom": 11,
        "primary_hazard": "SEISMIC"
    },
    "OD_PURI": {
        "name": "Puri & Paradip Coastal Surge Corridor (Odisha)",
        "center_lat": 19.8135,
        "center_lng": 85.8312,
        "zoom": 11,
        "primary_hazard": "CYCLONE"
    },
    "AS_GUWAHATI": {
        "name": "Brahmaputra Flood Basin (Assam)",
        "center_lat": 26.1445,
        "center_lng": 91.7362,
        "zoom": 11,
        "primary_hazard": "FLOOD"
    },
    "GJ_BHUJ": {
        "name": "Kutch Active Seismic Rift (Gujarat)",
        "center_lat": 23.2420,
        "center_lng": 69.6669,
        "zoom": 11,
        "primary_hazard": "SEISMIC"
    }
}

HAZARD_TYPES = {
    "LANDSLIDE": {
        "label": "Landslide & Slope Creep",
        "icon": "Mountain",
        "unit": "Deformation / Slope",
        "color": "#dc2626"
    },
    "FLOOD": {
        "label": "Riverine & Flash Flood",
        "icon": "Waves",
        "unit": "Inundation Depth (m)",
        "color": "#2563eb"
    },
    "CYCLONE": {
        "label": "Coastal Cyclone & Surge",
        "icon": "Wind",
        "unit": "Wind (km/h) / Surge (m)",
        "color": "#7c3aed"
    },
    "SEISMIC": {
        "label": "Earthquake / Seismic PGA",
        "icon": "Activity",
        "unit": "PGA (%g) / Fault Line",
        "color": "#ea580c"
    },
    "SUBSIDENCE": {
        "label": "Ground Subsidence & Sinking",
        "icon": "TrendingDown",
        "unit": "LOS Velocity (mm/yr)",
        "color": "#b91c1c"
    },
    "MULTI_HAZARD": {
        "label": "Compound Multi-Hazard Index",
        "icon": "ShieldAlert",
        "unit": "Composite Risk Score (0-100)",
        "color": "#d97706"
    }
}

# Multi-Hazard Weight Coefficients (Saaty AHP Derived)
HAZARD_WEIGHTS = {
    "LANDSLIDE": {
        "deformation_rate": 0.35,
        "slope": 0.25,
        "rainfall": 0.20,
        "lithology_factor": 0.10,
        "distance_to_drainage": 0.10
    },
    "FLOOD": {
        "flood_depth": 0.40,
        "rainfall_24h": 0.30,
        "elevation_deficit": 0.15,
        "distance_to_river": 0.15
    },
    "CYCLONE": {
        "wind_speed": 0.40,
        "storm_surge_elevation": 0.30,
        "distance_to_coastline": 0.20,
        "housing_vulnerability": 0.10
    },
    "SEISMIC": {
        "peak_ground_accel": 0.45,
        "fault_line_proximity": 0.25,
        "soil_liquefaction": 0.15,
        "unreinforced_masonry": 0.15
    },
    "SUBSIDENCE": {
        "sar_velocity_mm_yr": 0.50,
        "aquifer_depletion": 0.25,
        "geological_void": 0.15,
        "structural_fissure": 0.10
    }
}
