from datetime import datetime, timezone
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.db.models import FieldSurvey, Alert, AuditLog

router = APIRouter(prefix="/field-surveys", tags=["Field Surveys & Mobile App"])

class FieldSurveyCreate(BaseModel):
    village_name: str
    surveyor_name: str = "Field Officer"
    lat: float
    lng: float
    observed_population: int = 0
    damaged_houses: int = 0
    road_condition: str = "Passable"
    water_availability: str = "Adequate"
    electricity_status: str = "Operational"
    medical_status: str = "Basic First Aid"
    observed_cracks: bool = False
    crack_depth_cm: float = 0.0
    landslide_signs: bool = False
    flood_depth_m: float = 0.0
    ground_condition: str = "Stable"
    remarks: Optional[str] = None
    photo_url: Optional[str] = None

class BatchSyncRequest(BaseModel):
    surveys: List[FieldSurveyCreate]

@router.get("")
def list_field_surveys(db: Session = Depends(get_db)):
    """List all submitted and synced field surveys."""
    surveys = db.query(FieldSurvey).order_by(FieldSurvey.id.desc()).all()
    return [
        {
            "id": s.id,
            "survey_code": s.survey_code,
            "village_name": s.village_name,
            "surveyor_name": s.surveyor_name,
            "surveyor_role": s.surveyor_role,
            "lat": s.lat,
            "lng": s.lng,
            "observed_population": s.observed_population,
            "damaged_houses": s.damaged_houses,
            "road_condition": s.road_condition,
            "water_availability": s.water_availability,
            "electricity_status": s.electricity_status,
            "medical_status": s.medical_status,
            "observed_cracks": s.observed_cracks,
            "crack_depth_cm": s.crack_depth_cm,
            "landslide_signs": s.landslide_signs,
            "flood_depth_m": s.flood_depth_m,
            "ground_condition": s.ground_condition,
            "remarks": s.remarks,
            "photo_url": s.photo_url,
            "status": s.status,
            "synced_at": s.synced_at.strftime("%Y-%m-%d %H:%M:%S") if s.synced_at else "Just now"
        }
        for s in surveys
    ]

@router.post("")
def create_field_survey(req: FieldSurveyCreate, db: Session = Depends(get_db)):
    """Submit a single field survey."""
    code = f"FS-2026-{random.randint(1000, 9999)}"
    survey = FieldSurvey(
        survey_code=code,
        village_name=req.village_name,
        surveyor_name=req.surveyor_name,
        surveyor_role="FIELD_OFFICER",
        lat=req.lat,
        lng=req.lng,
        observed_population=req.observed_population,
        damaged_houses=req.damaged_houses,
        road_condition=req.road_condition,
        water_availability=req.water_availability,
        electricity_status=req.electricity_status,
        medical_status=req.medical_status,
        observed_cracks=req.observed_cracks,
        crack_depth_cm=req.crack_depth_cm,
        landslide_signs=req.landslide_signs,
        flood_depth_m=req.flood_depth_m,
        ground_condition=req.ground_condition,
        remarks=req.remarks,
        photo_url=req.photo_url,
        status="SYNCED",
        synced_at=datetime.now(timezone.utc)
    )
    db.add(survey)
    
    # Auto-generate alert if critical damage or severe cracks reported
    if req.damaged_houses > 20 or req.crack_depth_cm > 5.0 or req.ground_condition == "Active Subsidence":
        alert = Alert(
            alert_type="FIELD_VERIFICATION",
            severity="CRITICAL" if req.crack_depth_cm > 6.0 else "HIGH",
            title=f"Urgent Field Incident Logged: {req.village_name}",
            message=f"Field Surveyor {req.surveyor_name} reported {req.damaged_houses} damaged structures and {req.crack_depth_cm}cm fissures. Ground state: {req.ground_condition}.",
            is_active=True
        )
        db.add(alert)
        
    db.commit()
    db.refresh(survey)
    
    return {
        "status": "SUCCESS",
        "survey_code": survey.survey_code,
        "message": f"Survey {survey.survey_code} synchronized successfully with DDMA command center database."
    }

@router.post("/sync")
def sync_offline_queue(req: BatchSyncRequest, db: Session = Depends(get_db)):
    """Synchronizes batch offline survey queue from mobile app."""
    synced_codes = []
    for item in req.surveys:
        code = f"FS-2026-{random.randint(1000, 9999)}"
        survey = FieldSurvey(
            survey_code=code,
            village_name=item.village_name,
            surveyor_name=item.surveyor_name,
            lat=item.lat,
            lng=item.lng,
            observed_population=item.observed_population,
            damaged_houses=item.damaged_houses,
            road_condition=item.road_condition,
            water_availability=item.water_availability,
            electricity_status=item.electricity_status,
            medical_status=item.medical_status,
            observed_cracks=item.observed_cracks,
            crack_depth_cm=item.crack_depth_cm,
            landslide_signs=item.landslide_signs,
            flood_depth_m=item.flood_depth_m,
            ground_condition=item.ground_condition,
            remarks=item.remarks,
            photo_url=item.photo_url,
            status="SYNCED",
            synced_at=datetime.now(timezone.utc)
        )
        db.add(survey)
        synced_codes.append(code)
        
    db.commit()
    return {
        "status": "BATCH_SYNCED",
        "count_synced": len(synced_codes),
        "synced_codes": synced_codes,
        "message": f"Successfully synced {len(synced_codes)} pending field surveys."
    }
