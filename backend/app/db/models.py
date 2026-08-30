from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="ADMIN", nullable=False)  # ADMIN, FIELD_OFFICER, ANALYST
    district = Column(String(100), default="Chamoli-Rudraprayag")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class HazardZone(Base):
    __tablename__ = "hazard_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., ZONE-RZ-014
    name = Column(String(255), nullable=False)
    risk_level = Column(String(50), default="HIGH")  # LOW, MODERATE, HIGH, CRITICAL
    risk_score = Column(Float, default=0.0)  # 0 to 100
    susceptibility_score = Column(Float, default=0.0)  # 0.0 to 1.0
    
    population = Column(Integer, default=0)
    buildings = Column(Integer, default=0)
    deformation_rate = Column(Float, default=0.0)  # mm/year
    
    slope = Column(Float, default=0.0)  # degrees
    rainfall = Column(Float, default=0.0)  # mm/season
    distance_to_river = Column(Float, default=0.0)  # meters
    elevation = Column(Float, default=0.0)  # meters
    drainage_density = Column(Float, default=0.0)
    land_use = Column(String(100), default="Barren / Sparse Vegetation")
    geology = Column(String(100), default="Fractured Gneiss / Colluvium")
    seismic_intensity = Column(Float, default=8.0)
    
    vulnerability_score = Column(Float, default=0.0)  # 0 to 100
    recommended_action = Column(String(255), default="Pre-disaster Relocation Assessment")
    
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    geometry_geojson = Column(Text, nullable=True)  # Polygon Coordinates in GeoJSON
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Village(Base):
    __tablename__ = "villages"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    block = Column(String(100), default="Joshimath")
    population = Column(Integer, default=500)
    households = Column(Integer, default=120)
    elderly_count = Column(Integer, default=60)
    children_count = Column(Integer, default=80)
    pwd_count = Column(Integer, default=15)
    vulnerable_households = Column(Integer, default=35)
    
    hazard_score = Column(Float, default=50.0)
    vulnerability_score = Column(Float, default=50.0)
    
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    zone_code = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DeformationPoint(Base):
    __tablename__ = "deformation_points"
    
    id = Column(Integer, primary_key=True, index=True)
    point_code = Column(String(50), unique=True, index=True, nullable=False)  # PS-1048
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    velocity_mm_yr = Column(Float, nullable=False)  # e.g., +18.6 or -12.4
    status = Column(String(50), default="Stable")  # Stable, Active, Accelerating, Critical
    coherence = Column(Float, default=0.85)  # SAR interferometric coherence (0-1)
    orbit_track = Column(String(50), default="Track 129 Descending")
    zone_code = Column(String(50), nullable=True)
    last_updated = Column(String(50), default="2026-08-20")

class DeformationTimeSeries(Base):
    __tablename__ = "deformation_timeseries"
    
    id = Column(Integer, primary_key=True, index=True)
    point_code = Column(String(50), index=True, nullable=False)
    date = Column(String(20), nullable=False)  # YYYY-MM-DD
    displacement_mm = Column(Float, nullable=False)
    velocity_trend = Column(Float, nullable=True)

class RelocationSite(Base):
    __tablename__ = "relocation_sites"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # SITE-07
    name = Column(String(255), nullable=False)
    
    total_area_sqm = Column(Float, default=150000.0)  # e.g. 150,000 m2
    usable_area_sqm = Column(Float, default=120000.0)
    
    elevation = Column(Float, default=1450.0)  # meters
    slope = Column(Float, default=8.5)  # degrees (gentle)
    distance_from_river_km = Column(Float, default=1.8)
    road_accessibility = Column(String(50), default="Excellent")  # Excellent, Good, Moderate, Poor
    road_access_score = Column(Float, default=90.0)  # 0 to 100
    
    water_availability_score = Column(Float, default=88.0)
    healthcare_access_score = Column(Float, default=85.0)
    school_access_score = Column(Float, default=82.0)
    existing_infra_score = Column(Float, default=80.0)
    hazard_risk_score = Column(Float, default=12.0)  # Low hazard = safe
    ground_stability_score = Column(Float, default=95.0)
    
    # Carrying capacity parameters
    pcc = Column(Integer, default=5000)
    correction_factor = Column(Float, default=0.78)
    rcc = Column(Integer, default=3900)
    management_factor = Column(Float, default=0.82)
    ecc = Column(Integer, default=3198)
    
    suitability_score = Column(Float, default=91.0)  # 0 to 100
    status = Column(String(50), default="Highly Suitable")
    
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    geometry_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FieldSurvey(Base):
    __tablename__ = "field_surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    survey_code = Column(String(50), unique=True, index=True)
    village_name = Column(String(255), nullable=False)
    surveyor_name = Column(String(255), default="Field Officer")
    surveyor_role = Column(String(50), default="FIELD_OFFICER")
    
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    
    observed_population = Column(Integer, default=0)
    damaged_houses = Column(Integer, default=0)
    road_condition = Column(String(100), default="Passable")
    water_availability = Column(String(100), default="Adequate")
    electricity_status = Column(String(100), default="Operational")
    medical_status = Column(String(100), default="Basic First Aid")
    
    observed_cracks = Column(Boolean, default=False)
    crack_depth_cm = Column(Float, default=0.0)
    landslide_signs = Column(Boolean, default=False)
    flood_depth_m = Column(Float, default=0.0)
    ground_condition = Column(String(100), default="Unstable")
    remarks = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)  # URL or base64
    
    status = Column(String(50), default="SYNCED")  # PENDING, SYNCED, VERIFIED
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(100), nullable=False)  # CRITICAL_DEFORMATION, HAZARD_INCREASE, CAPACITY_DEFICIT, FIELD_VERIFICATION
    severity = Column(String(50), default="HIGH")  # CRITICAL, HIGH, MODERATE, LOW
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    zone_code = Column(String(50), nullable=True)
    site_code = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ModelRun(Base):
    __tablename__ = "model_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), default="WoE + Random Forest Hybrid Susceptibility")
    run_type = Column(String(50), default="Simulated Training Baseline")
    auc_roc = Column(Float, default=0.942)
    accuracy = Column(Float, default=0.915)
    precision_score = Column(Float, default=0.898)
    recall = Column(Float, default=0.924)
    f1 = Column(Float, default=0.911)
    parameters_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
