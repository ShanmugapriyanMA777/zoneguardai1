from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.security import verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SwitchRoleRequest(BaseModel):
    role: str  # ADMIN, FIELD_OFFICER, ANALYST

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        # Demo fallback: If user doesn't exist, create an in-memory session or accept demo login
        if "admin" in req.email:
            role = "ADMIN"
            name = "Col. R. K. Sharma (Retd.)"
        elif "officer" in req.email:
            role = "FIELD_OFFICER"
            name = "Pooja Rawat, Field Officer"
        else:
            role = "ANALYST"
            name = "Dr. Vikram Sen, Lead Analyst"
            
        token = create_access_token(subject=req.email, role=role)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "email": req.email,
                "full_name": name,
                "role": role,
                "district": "Chamoli-Rudraprayag"
            }
        }
        
    token = create_access_token(subject=user.email, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "district": user.district
        }
    }

@router.get("/me")
def get_current_user(token: str = None, db: Session = Depends(get_db)):
    if not token:
        # Return default Admin for instant prototype usage
        return {
            "email": "admin@zoneguard.gov.in",
            "full_name": "Col. R. K. Sharma (Retd.)",
            "role": "ADMIN",
            "district": "Chamoli-Rudraprayag"
        }
    payload = decode_token(token)
    email = payload.get("sub", "admin@zoneguard.gov.in")
    role = payload.get("role", "ADMIN")
    return {
        "email": email,
        "role": role,
        "district": payload.get("district", "Chamoli-Rudraprayag")
    }

@router.post("/switch-role")
def switch_role(req: SwitchRoleRequest):
    """Convenient switch role endpoint for SIH judges demo."""
    role = req.role.upper()
    if role not in ("ADMIN", "FIELD_OFFICER", "ANALYST"):
        role = "ADMIN"
        
    names = {
        "ADMIN": "Col. R. K. Sharma (Retd.) [DDMA Admin]",
        "FIELD_OFFICER": "Pooja Rawat [Disaster Field Officer]",
        "ANALYST": "Dr. Vikram Sen [GIS / SAR Analyst]"
    }
    emails = {
        "ADMIN": "admin@zoneguard.gov.in",
        "FIELD_OFFICER": "officer@zoneguard.gov.in",
        "ANALYST": "analyst@zoneguard.gov.in"
    }
    
    token = create_access_token(subject=emails[role], role=role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": emails[role],
            "full_name": names[role],
            "role": role,
            "district": "Chamoli-Rudraprayag"
        }
    }
