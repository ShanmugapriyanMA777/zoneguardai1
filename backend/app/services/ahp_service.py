import numpy as np
from typing import Dict, List, Any

# Random Index (RI) table for AHP consistency calculation (Saaty 1980)
RI_TABLE = {
    1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
}

DEFAULT_CRITERIA = [
    {"key": "hazard_safety", "name": "Hazard Risk Avoidance", "weight": 0.25, "direction": "minimize_hazard"},
    {"key": "ground_stability", "name": "Ground Stability (PSInSAR)", "weight": 0.20, "direction": "maximize"},
    {"key": "accessibility", "name": "Road Accessibility", "weight": 0.15, "direction": "maximize"},
    {"key": "water_access", "name": "Water Availability", "weight": 0.10, "direction": "maximize"},
    {"key": "healthcare", "name": "Healthcare Access", "weight": 0.10, "direction": "maximize"},
    {"key": "infrastructure", "name": "Existing Infrastructure", "weight": 0.10, "direction": "maximize"},
    {"key": "land_availability", "name": "Land Availability & Capacity", "weight": 0.10, "direction": "maximize"}
]

class AHPService:
    """
    Analytic Hierarchy Process (AHP) & GIS-MCDA Weighted Overlay Engine.
    Validates matrix consistency and computes multi-criteria suitability rankings.
    """
    def __init__(self):
        self.criteria = DEFAULT_CRITERIA

    def compute_ahp_consistency(self, matrix: List[List[float]]) -> Dict[str, Any]:
        """
        Computes principal eigenvalue (lambda_max), CI, and CR for pairwise comparison matrix.
        """
        A = np.array(matrix, dtype=float)
        n = A.shape[0]
        
        # Approximate principal eigenvector via geometric mean normalization
        geom_means = np.prod(A, axis=1) ** (1.0 / n)
        weights = geom_means / np.sum(geom_means)
        
        # Calculate lambda_max: (A * w) / w
        Aw = np.dot(A, weights)
        lambda_max = float(np.mean(Aw / weights))
        
        # Consistency Index
        ci = (lambda_max - n) / (n - 1) if n > 1 else 0.0
        ri = RI_TABLE.get(n, 1.32)
        cr = ci / ri if ri > 0 else 0.0
        
        is_consistent = cr < 0.10
        
        return {
            "num_criteria": n,
            "weights": [round(float(w), 4) for w in weights],
            "lambda_max": round(lambda_max, 4),
            "consistency_index_ci": round(ci, 4),
            "random_index_ri": ri,
            "consistency_ratio_cr": round(cr, 4),
            "is_consistent": is_consistent,
            "status": "CONSISTENT" if is_consistent else "INCONSISTENT (Recalibrate Matrix)",
            "threshold": 0.10
        }

    def calculate_site_suitability(
        self,
        site_data: Dict[str, Any],
        custom_weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Calculates GIS-MCDA Suitability Score for a candidate relocation site.
        """
        weights = custom_weights or {c["key"]: c["weight"] for c in self.criteria}
        
        # Normalize weights to sum to 1.0
        w_sum = sum(weights.values())
        norm_weights = {k: v / w_sum for k, v in weights.items()}
        
        # 1. Hazard safety (Inverted: low hazard = high score)
        hazard_risk = float(site_data.get("hazard_risk_score", 15.0))
        s_hazard = max(0.0, 100.0 - hazard_risk)
        
        # 2. Ground stability
        s_stability = float(site_data.get("ground_stability_score", 92.0))
        
        # 3. Road accessibility
        s_access = float(site_data.get("road_access_score", 85.0))
        
        # 4. Water availability
        s_water = float(site_data.get("water_availability_score", 88.0))
        
        # 5. Healthcare access
        s_health = float(site_data.get("healthcare_access_score", 80.0))
        
        # 6. Existing infrastructure
        s_infra = float(site_data.get("existing_infra_score", 82.0))
        
        # 7. Land availability (scale based on ECC)
        ecc = float(site_data.get("ecc", 3000))
        s_land = min(100.0, max(20.0, (ecc / 4000.0) * 100.0))
        
        scores = {
            "hazard_safety": s_hazard,
            "ground_stability": s_stability,
            "accessibility": s_access,
            "water_access": s_water,
            "healthcare": s_health,
            "infrastructure": s_infra,
            "land_availability": s_land
        }
        
        # Weighted overlay summation
        total_suitability = sum(norm_weights.get(k, 0.1) * scores[k] for k in scores)
        total_suitability = round(min(100.0, max(0.0, total_suitability)), 1)
        
        if total_suitability >= 80.0:
            classification = "Highly Suitable"
            status_color = "emerald"
        elif total_suitability >= 60.0:
            classification = "Suitable"
            status_color = "blue"
        elif total_suitability >= 40.0:
            classification = "Moderate"
            status_color = "amber"
        else:
            classification = "Unsuitable"
            status_color = "rose"
            
        return {
            "site_code": site_data.get("code", "UNKNOWN"),
            "site_name": site_data.get("name", ""),
            "suitability_score": total_suitability,
            "classification": classification,
            "status_color": status_color,
            "component_scores": scores,
            "applied_weights": norm_weights
        }

ahp_engine = AHPService()
