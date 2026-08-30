from typing import Dict, Any

class CarryingCapacityEngine:
    """
    Carrying Capacity Calculation Engine for Relocation Sites:
      PCC (Physical Carrying Capacity)
      RCC (Real Carrying Capacity)
      ECC (Effective Carrying Capacity)
    """
    def __init__(self, default_min_area_per_person: float = 30.0):
        # 30 sqm/person standard (includes dwelling, sanitation buffer, roads, health post)
        self.default_min_area = default_min_area_per_person

    def calculate_capacity(
        self,
        usable_area_sqm: float,
        slope_deg: float = 8.0,
        water_availability_score: float = 88.0,
        road_access_score: float = 90.0,
        medical_score: float = 85.0,
        sanitation_score: float = 80.0,
        min_area_per_person: float = 30.0,
        target_population: int = 0
    ) -> Dict[str, Any]:
        """
        Computes PCC -> RCC -> ECC with transparent intermediate correction factors.
        """
        area_req = max(10.0, min_area_per_person if min_area_per_person > 0 else self.default_min_area)
        
        # 1. Physical Carrying Capacity (PCC)
        pcc = int(usable_area_sqm / area_req)
        
        # 2. Real Carrying Capacity (RCC)
        # Terrain constraint factor (steeper slope reduces buildable footprint)
        c_slope = max(0.40, 1.0 - (max(0.0, slope_deg - 5.0) * 0.025))
        # Environmental and drainage setback factor
        c_water = 0.70 + (water_availability_score / 100.0) * 0.25
        # Eco-buffer and soil stability factor
        c_terrain = 0.92
        
        correction_factor = round(c_slope * c_water * c_terrain, 3)
        # Cap correction factor within realistic bounds
        correction_factor = min(0.95, max(0.35, correction_factor))
        rcc = int(pcc * correction_factor)
        
        # 3. Effective Carrying Capacity (ECC)
        # Service delivery factors (sanitation, medical infrastructure, road evacuation bandwidth)
        m_road = 0.70 + (road_access_score / 100.0) * 0.30
        m_health = 0.75 + (medical_score / 100.0) * 0.25
        m_sanitation = 0.75 + (sanitation_score / 100.0) * 0.25
        
        management_factor = round(m_road * m_health * m_sanitation, 3)
        management_factor = min(0.95, max(0.40, management_factor))
        ecc = int(rcc * management_factor)
        
        # Capacity evaluation against target population
        surplus_deficit = ecc - target_population if target_population > 0 else 0
        if target_population > 0:
            if surplus_deficit >= 0:
                capacity_status = "ADEQUATE"
                status_color = "green"
                recommendation = "Capacity satisfies relocation demand with safety buffer."
            else:
                capacity_status = "DEFICIT"
                status_color = "red"
                recommendation = f"Site has a deficit of {abs(surplus_deficit)} persons. Expansion or multi-site distribution required."
        else:
            capacity_status = "UNALLOCATED"
            status_color = "blue"
            recommendation = "Site ready for allocation."

        return {
            "usable_area_sqm": usable_area_sqm,
            "min_area_per_person_sqm": area_req,
            "pcc": pcc,
            "correction_factor": correction_factor,
            "rcc": rcc,
            "management_factor": management_factor,
            "ecc": ecc,
            "target_population": target_population,
            "surplus_deficit": surplus_deficit,
            "capacity_status": capacity_status,
            "status_color": status_color,
            "recommendation": recommendation,
            "intermediate_factors": {
                "slope_factor": round(c_slope, 2),
                "water_factor": round(c_water, 2),
                "road_factor": round(m_road, 2),
                "health_factor": round(m_health, 2),
                "sanitation_factor": round(m_sanitation, 2)
            }
        }

capacity_engine = CarryingCapacityEngine()
