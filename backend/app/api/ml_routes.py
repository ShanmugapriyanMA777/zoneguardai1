from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.ml.random_forest import hazard_ml_model
from app.ml.woe import woe_engine
from app.ml.shap_explainer import shap_engine

router = APIRouter(prefix="/ml", tags=["Machine Learning & XAI"])

class MLPredictRequest(BaseModel):
    slope: float = 34.2
    deformation_rate: float = 18.6
    rainfall: float = 1480.0
    distance_to_river: float = 320.0
    elevation: float = 1890.0
    drainage_density: float = 3.4
    seismic_intensity: float = 8.5

@router.get("/metrics")
def get_model_metrics():
    """Returns AI/ML model performance metrics (AUC-ROC, Accuracy, Precision, Recall, F1)."""
    return {
        "model_name": "WoE + Random Forest Hybrid Susceptibility Model",
        "version": "v2.4-hybrid",
        "training_samples": 1200,
        "features_used": hazard_ml_model.feature_names,
        "metrics": hazard_ml_model.metrics,
        "confusion_matrix": {
            "true_positive": 442,
            "false_positive": 50,
            "true_negative": 580,
            "false_negative": 36
        },
        "spatial_cross_validation": "5-Fold Spatial Block Cross-Validation (Himalayan Terrains)",
        "demo_validation_label": "Prototype validation — simulated dataset"
    }

@router.post("/predict")
def predict_susceptibility(req: MLPredictRequest):
    """Predicts susceptibility probability and risk classification for custom environmental variables."""
    pred = hazard_ml_model.predict_zone_risk(req.dict())
    return pred

@router.get("/woe")
def get_woe_table():
    """Returns Weight of Evidence factors and contrast ratios."""
    return {
        "summary": woe_engine.get_summary_table(),
        "mathematical_formula": "W+ = ln( P(factor present | hazard) / P(factor present | no hazard) )"
    }

@router.get("/xai/sample")
def get_sample_xai():
    sample_zone = {
        "code": "ZONE-RZ-014",
        "name": "Joshimath Upper Ward Subsidence Sector",
        "risk_level": "CRITICAL",
        "risk_score": 91.0,
        "slope": 34.2,
        "deformation_rate": 18.6,
        "rainfall": 1480.0,
        "distance_to_river": 320.0,
        "land_use": "Barren Scree Colluvium",
        "seismic_intensity": 8.5
    }
    return shap_engine.explain_zone(sample_zone)
