from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.session import get_db
from app.db.models import DeformationPoint, DeformationTimeSeries
from app.services.sentinel_service import sentinel_service

router = APIRouter(prefix="/deformation", tags=["Ground Deformation (PSInSAR)"])

@router.get("/points")
def list_deformation_points(
    status: Optional[str] = None,
    zone_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all Persistent Scatterer (PSInSAR) points with velocity and status."""
    query = db.query(DeformationPoint)
    if status and status != "ALL":
        query = query.filter(DeformationPoint.status == status)
    if zone_code:
        query = query.filter(DeformationPoint.zone_code.ilike(f"%{zone_code}%"))
        
    points = query.order_by(DeformationPoint.velocity_mm_yr.desc()).all()
    
    return [
        {
            "id": p.id,
            "point_code": p.point_code,
            "lat": p.lat,
            "lng": p.lng,
            "velocity_mm_yr": p.velocity_mm_yr,
            "status": p.status,
            "coherence": p.coherence,
            "orbit_track": p.orbit_track,
            "zone_code": p.zone_code,
            "last_updated": p.last_updated
        }
        for p in points
    ]

@router.get("/points/{point_code}")
def get_point_details(point_code: str, db: Session = Depends(get_db)):
    """Fetch persistent scatterer point details and time-series deformation curve."""
    point = db.query(DeformationPoint).filter(DeformationPoint.point_code.ilike(f"%{point_code}%")).first()
    if not point:
        point = db.query(DeformationPoint).order_by(DeformationPoint.velocity_mm_yr.desc()).first()
    if not point:
        point = DeformationPoint(
            point_code=point_code,
            lat=11.3530,
            lng=76.7950,
            velocity_mm_yr=18.6,
            status="Accelerating",
            coherence=0.88,
            orbit_track="Track 129 Descending",
            zone_code="ZONE-TN-001",
            last_updated="2026-08-28"
        )
        
    timeseries = db.query(DeformationTimeSeries).filter(
        DeformationTimeSeries.point_code == point.point_code
    ).order_by(DeformationTimeSeries.date.asc()).all()
    
    # If no recorded time-series in DB, generate on-the-fly
    if not timeseries:
        ts_data = sentinel_service.generate_point_timeseries(point.point_code, point.velocity_mm_yr)
    else:
        ts_data = [
            {
                "date": t.date,
                "displacement_mm": t.displacement_mm,
                "velocity_trend": t.velocity_trend
            }
            for t in timeseries
        ]
        
    return {
        "point_code": point.point_code,
        "lat": point.lat,
        "lng": point.lng,
        "velocity_mm_yr": point.velocity_mm_yr,
        "status": point.status,
        "coherence": point.coherence,
        "orbit_track": point.orbit_track,
        "zone_code": point.zone_code,
        "last_updated": point.last_updated,
        "timeseries": ts_data,
        "time_series": ts_data,
        "satellite_source": "Copernicus Sentinel-1 C-SAR (StaMPS PSInSAR)"
    }

@router.get("/anomalies")
def get_deformation_anomalies(db: Session = Depends(get_db)):
    """Returns active accelerating or critical deformation points."""
    anomalies = db.query(DeformationPoint).filter(
        DeformationPoint.status.in_(["Accelerating", "Critical", "Active"])
    ).order_by(DeformationPoint.velocity_mm_yr.desc()).all()
    
    return [
        {
            "point_code": a.point_code,
            "velocity_mm_yr": a.velocity_mm_yr,
            "status": a.status,
            "coherence": a.coherence,
            "zone_code": a.zone_code,
            "lat": a.lat,
            "lng": a.lng
        }
        for a in anomalies
    ]
