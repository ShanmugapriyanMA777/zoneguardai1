import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score
from typing import Dict, Any, Tuple

class MultiHazardModel:
    """
    WoE + Random Forest Hybrid Susceptibility & Risk Classifier.
    Predicts multi-hazard susceptibility probabilities and classifies risk tiers.
    """
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            min_samples_split=4,
            random_state=42
        )
        self.feature_names = [
            "slope", "deformation_rate", "rainfall", "distance_to_river",
            "elevation", "drainage_density", "seismic_intensity", "woe_combined"
        ]
        self.metrics = {
            "auc_roc": 0.942,
            "accuracy": 0.915,
            "precision": 0.898,
            "recall": 0.924,
            "f1_score": 0.911,
            "validation_note": "Prototype validation — simulated dataset"
        }
        self._is_trained = False
        self._train_demo_model()

    def _generate_synthetic_training_data(self, n_samples: int = 1200) -> Tuple[np.ndarray, np.ndarray]:
        np.random.seed(42)
        slope = np.random.uniform(5, 55, n_samples)
        deformation = np.random.uniform(-5, 25, n_samples)
        rainfall = np.random.uniform(600, 2200, n_samples)
        dist_river = np.random.uniform(50, 4000, n_samples)
        elevation = np.random.uniform(800, 3200, n_samples)
        drainage = np.random.uniform(0.5, 4.5, n_samples)
        seismic = np.random.uniform(6.5, 9.0, n_samples)
        
        # Calculate latent hazard score based on geotechnical physics
        z = (
            0.045 * slope +
            0.120 * np.maximum(0, deformation) +
            0.0018 * rainfall -
            0.0006 * dist_river +
            0.0004 * elevation +
            0.35 * drainage +
            0.45 * (seismic - 6.5) -
            3.8
        )
        
        # WoE transformed feature
        woe_comb = (
            0.82 * (slope / 45.0) +
            0.93 * (np.maximum(0, deformation) / 20.0) +
            0.71 * (rainfall / 2000.0) +
            0.77 * (1.0 - np.minimum(1.0, dist_river / 2500.0))
        )
        
        prob = 1.0 / (1.0 + np.exp(-z))
        y = (prob > 0.48).astype(int)
        
        X = np.column_stack([
            slope, deformation, rainfall, dist_river,
            elevation, drainage, seismic, woe_comb
        ])
        return X, y

    def _train_demo_model(self):
        X, y = self._generate_synthetic_training_data()
        split = int(len(X) * 0.8)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        
        self.model.fit(X_train, y_train)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        y_pred = (y_pred_proba > 0.5).astype(int)
        
        self.metrics = {
            "auc_roc": round(float(roc_auc_score(y_test, y_pred_proba)), 3),
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 3),
            "precision": round(float(precision_score(y_test, y_pred)), 3),
            "recall": round(float(recall_score(y_test, y_pred)), 3),
            "f1_score": round(float(f1_score(y_test, y_pred)), 3),
            "validation_note": "Prototype validation — simulated dataset"
        }
        self._is_trained = True

    def predict_zone_risk(self, features: Dict[str, float]) -> Dict[str, Any]:
        slope = features.get("slope", 25.0)
        deformation = features.get("deformation_rate", 5.0)
        rainfall = features.get("rainfall", 1200.0)
        dist_river = features.get("distance_to_river", 800.0)
        elevation = features.get("elevation", 1600.0)
        drainage = features.get("drainage_density", 2.2)
        seismic = features.get("seismic_intensity", 8.0)
        
        woe_comb = (
            0.82 * (slope / 45.0) +
            0.93 * (max(0.0, deformation) / 20.0) +
            0.71 * (rainfall / 2000.0) +
            0.77 * max(0.0, 1.0 - (dist_river / 2500.0))
        )
        
        X_input = np.array([[slope, deformation, rainfall, dist_river, elevation, drainage, seismic, woe_comb]])
        prob = float(self.model.predict_proba(X_input)[0][1])
        
        # Risk score 0 to 100
        risk_score = round(prob * 100.0, 1)
        
        if risk_score >= 85.0:
            risk_level = "CRITICAL"
        elif risk_score >= 65.0:
            risk_level = "HIGH"
        elif risk_score >= 40.0:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"
            
        return {
            "susceptibility_probability": round(prob, 4),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "features_evaluated": features
        }

hazard_ml_model = MultiHazardModel()
