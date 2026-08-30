from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.db.models import Alert

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("")
def list_alerts(severity: Optional[str] = None, active_only: bool = True, db: Session = Depends(get_db)):
    """List system and hazard alerts."""
    query = db.query(Alert)
    if active_only:
        query = query.filter(Alert.is_active == True)
    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity.upper())
        
    alerts = query.order_by(Alert.id.desc()).all()
    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "zone_code": a.zone_code,
            "site_code": a.site_code,
            "is_active": a.is_active,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else "Recent"
        }
        for a in alerts
    ]

@router.post("/{alert_id}/dismiss")
def dismiss_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    db.commit()
    return {"status": "DISMISSED", "alert_id": alert_id}
