import math
from typing import Dict, List, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    direct_dist = R * c
    # In mountainous terrain (Uttarakhand / Himalayas), road distance is approx 1.35x straight line
    return round(direct_dist * 1.35, 2)

class RelocationRecommendationEngine:
    """
    Smart Relocation Matching and Decision Engine.
    Matches high-risk zones/villages to optimal relocation candidate sites.
    """
    def __init__(self):
        pass

    def evaluate_candidates_for_zone(
        self,
        zone: Dict[str, Any],
        candidate_sites: List[Dict[str, Any]],
        max_radius_km: float = 35.0
    ) -> Dict[str, Any]:
        """
        Ranks candidate relocation sites for a target hazard red zone in Tamil Nadu.
        """
        zone_code = zone.get("code", "ZONE-TN-001")
        zone_name = zone.get("name", "Coonoor-Marapallam Ghats Subsidence Sector (Nilgiris, Tamil Nadu)")
        required_pop = int(zone.get("population", 2840))
        z_lat = float(zone.get("center_lat", 11.3530))
        z_lng = float(zone.get("center_lng", 76.7950))
        
        ranked_sites = []
        for site in candidate_sites:
            s_lat = float(site.get("lat", 11.3000))
            s_lng = float(site.get("lng", 76.9500))
            
            distance_km = haversine_distance_km(z_lat, z_lng, s_lat, s_lng)
            
            ecc = int(site.get("ecc", 3000))
            suitability = float(site.get("suitability_score", 85.0))
            hazard_risk = float(site.get("hazard_risk_score", 15.0))
            safety_score = max(0.0, 100.0 - hazard_risk)
            road_access = float(site.get("road_access_score", 85.0))
            water_score = float(site.get("water_availability_score", 85.0))
            infra_score = float(site.get("existing_infra_score", 80.0))
            health_score = float(site.get("healthcare_access_score", 80.0))
            
            surplus = ecc - required_pop
            
            # Capacity adequacy score (0-100)
            if surplus >= 0:
                capacity_score = min(100.0, 80.0 + (surplus / 1000.0) * 20.0)
                capacity_status = "ADEQUATE"
            else:
                deficit_ratio = abs(surplus) / max(1.0, required_pop)
                capacity_score = max(10.0, 70.0 - (deficit_ratio * 80.0))
                capacity_status = "DEFICIT"
                
            # Proximity score (closer is better, e.g. within 5km is 100%, 25km is 40%)
            dist_score = max(20.0, 100.0 - (distance_km / max_radius_km) * 60.0)
            
            # Composite SIH Multi-Criteria Match Score:
            # 0.35 * Safety + 0.25 * Capacity + 0.15 * Accessibility + 0.10 * Infrastructure + 0.10 * Water + 0.05 * Healthcare
            match_score = (
                0.35 * safety_score +
                0.25 * capacity_score +
                0.15 * road_access +
                0.10 * infra_score +
                0.10 * water_score +
                0.05 * health_score
            )
            
            # Penalty if distance exceeds threshold
            if distance_km > max_radius_km:
                match_score *= 0.85
                
            match_score = round(min(100.0, match_score), 1)
            
            # Travel time estimation (average mountain road speed 32 km/h)
            travel_time_mins = round((distance_km / 32.0) * 60.0)
            
            # Generate simulated evacuation route line coordinates between zone and site
            route_coords = self._generate_evacuation_waypoints(z_lat, z_lng, s_lat, s_lng)
            
            ranked_sites.append({
                "site_code": site.get("code"),
                "site_name": site.get("name"),
                "match_score": match_score,
                "suitability_score": suitability,
                "safety_score": round(safety_score, 1),
                "ecc": ecc,
                "required_population": required_pop,
                "capacity_surplus": surplus,
                "capacity_status": capacity_status,
                "distance_km": distance_km,
                "estimated_travel_time_mins": travel_time_mins,
                "road_accessibility": site.get("road_accessibility", "Good"),
                "lat": s_lat,
                "lng": s_lng,
                "evacuation_route": {
                    "distance_km": distance_km,
                    "travel_time_mins": travel_time_mins,
                    "road_condition": "Cleared All-Weather Arterial Route (NH-181 Coonoor-Mettupalayam Ghat Road Bypass)",
                    "checkpoints": ["Marapallam Emergency Gate", "Burliar River Bridge Crossing", "Mettupalayam Relocation Staging Area"],
                    "waypoints": route_coords
                }
            })
            
        # Rank descending by match score
        ranked_sites.sort(key=lambda x: (x["capacity_status"] == "ADEQUATE", x["match_score"]), reverse=True)
        
        # Tag recommendations
        if ranked_sites:
            ranked_sites[0]["recommendation_tag"] = "RECOMMENDED FOR PRE-DISASTER RELOCATION"
            ranked_sites[0]["is_primary_choice"] = True
            for i in range(1, len(ranked_sites)):
                ranked_sites[i]["recommendation_tag"] = "SECONDARY CANDIDATE" if ranked_sites[i]["capacity_status"] == "ADEQUATE" else "CAPACITY CONSTRAINED"
                ranked_sites[i]["is_primary_choice"] = False

        top_choice = ranked_sites[0] if ranked_sites else None
        
        return {
            "source_zone": {
                "code": zone_code,
                "name": zone_name,
                "risk_level": zone.get("risk_level", "CRITICAL"),
                "risk_score": zone.get("risk_score", 91.0),
                "population": required_pop,
                "deformation_rate": zone.get("deformation_rate", 18.6),
                "center_lat": z_lat,
                "center_lng": z_lng
            },
            "candidate_count_evaluated": len(ranked_sites),
            "primary_recommendation": top_choice,
            "ranked_candidates": ranked_sites,
            "decision_rationale": (
                f"For {zone_code} ({required_pop} residents at CRITICAL hazard risk), "
                f"{top_choice['site_code']} ({top_choice['site_name']}) is the highest-ranked relocation site "
                f"with a Suitability Score of {top_choice['suitability_score']}/100, "
                f"Safety Index of {top_choice['safety_score']}/100, and Effective Carrying Capacity of {top_choice['ecc']:,} "
                f"(giving a surplus buffer of {top_choice['capacity_surplus']:+} persons). "
                f"Evacuation corridor distance is {top_choice['distance_km']} km (~{top_choice['estimated_travel_time_mins']} mins)."
            ) if top_choice else "No suitable candidate found."
        }

    def _generate_evacuation_waypoints(self, lat1: float, lon1: float, lat2: float, lon2: float) -> List[List[float]]:
        """Generates realistic intermediate road curvature waypoints for Leaflet Polyline rendering."""
        points = [[lat1, lon1]]
        steps = 6
        for i in range(1, steps):
            t = i / float(steps)
            # Add subtle mountain valley curve
            curv_lat = math.sin(t * math.pi) * 0.008
            curv_lng = math.cos(t * math.pi) * 0.006
            lat = lat1 + (lat2 - lat1) * t + curv_lat
            lng = lon1 + (lon2 - lon1) * t + curv_lng
            points.append([round(lat, 6), round(lng, 6)])
        points.append([lat2, lon2])
        return points

relocation_engine = RelocationRecommendationEngine()
