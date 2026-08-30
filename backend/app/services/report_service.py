import datetime
from typing import Dict, Any

class ReportService:
    """
    Generates Pre-Disaster Relocation Decision Reports for DDMA Authorities.
    """
    def __init__(self):
        pass

    def build_decision_report(
        self,
        zone_data: Dict[str, Any],
        recommendation_data: Dict[str, Any],
        shap_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes all intelligence layers into a structured executive relocation decision document.
        """
        now = datetime.datetime.now()
        report_id = f"ZGAI-REP-{zone_data.get('code', 'RZ-014')}-{now.strftime('%Y%m%d%H%M')}"
        
        primary_rec = recommendation_data.get("primary_recommendation") or {}
        
        report = {
            "report_id": report_id,
            "generated_at": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "district": "Nilgiris-Western Ghats Multi-Hazard Corridor (Tamil Nadu)",
            "state": "Tamil Nadu, India",
            "issuing_authority": "Tamil Nadu State Disaster Management Authority (TNDMA) & Nilgiris District Disaster Management Authority",
            "title": "ZONEGUARD AI: PRE-DISASTER PROACTIVE RELOCATION DECISION REPORT",
            "classification": "RESTRICTED / TNDMA DISASTER RESPONSE LEVEL-3",
            
            "target_zone": {
                "code": zone_data.get("code"),
                "name": zone_data.get("name"),
                "risk_level": zone_data.get("risk_level"),
                "risk_score": zone_data.get("risk_score"),
                "population_affected": zone_data.get("population"),
                "buildings_at_risk": zone_data.get("buildings"),
                "deformation_rate_mm_yr": zone_data.get("deformation_rate"),
                "terrain_slope_deg": zone_data.get("slope"),
                "monsoon_rainfall_mm": zone_data.get("rainfall"),
                "distance_to_river_m": zone_data.get("distance_to_river"),
                "recommended_action": zone_data.get("recommended_action")
            },
            
            "model_explanation": {
                "summary": shap_data.get("narrative_explanation"),
                "top_risk_drivers": shap_data.get("features_breakdown", [])[:3]
            },
            
            "relocation_allocation": {
                "site_code": primary_rec.get("site_code"),
                "site_name": primary_rec.get("site_name"),
                "suitability_score": primary_rec.get("suitability_score"),
                "safety_index": primary_rec.get("safety_score"),
                "effective_carrying_capacity_ecc": primary_rec.get("ecc"),
                "required_capacity": primary_rec.get("required_population"),
                "capacity_surplus_buffer": primary_rec.get("capacity_surplus"),
                "capacity_status": primary_rec.get("capacity_status"),
                "evacuation_distance_km": primary_rec.get("distance_km"),
                "estimated_transit_time_mins": primary_rec.get("estimated_travel_time_mins"),
                "route_corridor": primary_rec.get("evacuation_route", {}).get("road_condition"),
                "recommendation_status": primary_rec.get("recommendation_tag")
            },
            
            "actionable_directives": [
                f"1. Immediate issuance of Stage-1 Pre-Evacuation Alert to Nilgiris Coonoor / Kotagiri administrative circles.",
                f"2. Mobilize Tamil Nadu Disaster Response Force (TNDRF) staging unit to {primary_rec.get('site_name', 'SITE-07')}.",
                f"3. Activate arterial evacuation corridor via NH-181 Mettupalayam Ghats bypass with transit time ~{primary_rec.get('estimated_travel_time_mins', 45)} minutes.",
                f"4. Coordinate with Tamil Nadu Public Health & Family Welfare Department for emergency medical post deployment at {primary_rec.get('site_code', 'SITE-07')} (ECC {primary_rec.get('ecc', 3198)}).",
                f"5. Dispatch TNDMA Field Surveyors for real-time subsidence fissure validation via ZoneGuard Mobile app."
            ],
            
            "digital_signoff": {
                "generated_by": "ZoneGuard AI Decision Engine v2.4 (TNDMA Edition)",
                "validation_standard": "AHP-MCDA & WoE-Random Forest (TNDMA / NDMA Guidelines 2024)",
                "status": "APPROVED FOR DISTRICT COLLECTOR EXECUTIVE ACTION"
            }
        }
        return report

report_engine = ReportService()
