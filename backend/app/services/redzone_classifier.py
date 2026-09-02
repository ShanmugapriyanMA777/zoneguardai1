"""
ZoneGuard AI — Tamil Nadu Automated Multi-Condition Red Zone Classification Engine
Evaluates spatial geographic zones against multiple risk and deformation conditions.
An area is designated as RED ZONE only when the configured threshold criteria are exceeded.
"""

from typing import Dict, Any, List, Optional
import math

class RedZoneClassificationEngine:
    def __init__(self):
        # Default regulatory and geotechnical thresholds (NDMA / TNDMA guidelines)
        self.DEFAULT_THRESHOLDS = {
            "min_risk_score": 75.0,            # Composite Risk Score >= 75/100
            "min_susceptibility": 0.78,        # AI Hazard Susceptibility >= 0.78
            "min_deformation_rate": 10.0,      # InSAR LOS velocity >= 10.0 mm/year
            "min_slope": 25.0,                 # Mountain slope >= 25 degrees (or coastal elevation <= 3.5m)
            "min_rainfall": 1200.0,            # Monsoon rainfall >= 1,200 mm
            "min_population_exposed": 1000,    # Population >= 1,000
            "require_insar_or_rain": True      # At least one physical dynamic trigger (InSAR or Rain) required
        }

    def evaluate_zone(
        self,
        zone_data: Dict[str, Any],
        custom_thresholds: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates an individual geographic area against multi-condition Red Zone criteria.
        Returns whether it qualifies as RED ZONE, composite risk score, condition check results,
        and natural-language reasons for classification.
        """
        thresholds = {**self.DEFAULT_THRESHOLDS, **(custom_thresholds or {})}
        
        # Extract zone parameters
        deformation = float(zone_data.get("deformation_rate", 0.0) or 0.0)
        slope = float(zone_data.get("slope", 0.0) or 0.0)
        rainfall = float(zone_data.get("rainfall", 0.0) or 0.0)
        susceptibility = float(zone_data.get("susceptibility_score", 0.0) or 0.0)
        elevation = float(zone_data.get("elevation", 0.0) or 0.0)
        population = int(zone_data.get("population", 0) or 0)
        geology = str(zone_data.get("geology", "Weathered Bedrock"))
        hazard_type = str(zone_data.get("hazard_type", "Landslide Creep"))
        has_disaster_history = bool(zone_data.get("has_disaster_history", True))

        # Check conditions
        cond_susceptibility = susceptibility >= thresholds["min_susceptibility"]
        cond_deformation = deformation >= thresholds["min_deformation_rate"]
        cond_rainfall = rainfall >= thresholds["min_rainfall"]
        
        # Slope / Coastal condition: either steep mountain slope (>= threshold) or low-elevation coastal surge bowl (<= 3.5m)
        is_coastal_hazard = any(term in hazard_type.lower() for term in ["coastal", "surge", "flood", "tsunami", "tidal", "inundation"])
        if is_coastal_hazard and elevation <= 4.0:
            cond_slope_terrain = True
            slope_reason = f"Low-elevation coastal storm surge / flood bowl ({elevation:.1f}m ASL)"
        else:
            cond_slope_terrain = slope >= thresholds["min_slope"]
            slope_reason = f"Steep unstable slope gradient ({slope:.1f}° >= {thresholds['min_slope']}°)"

        cond_population = population >= thresholds["min_population_exposed"]
        
        # Geological vulnerability score
        is_high_geo_vulnerability = any(term in geology.lower() for term in [
            "fractured", "colluvium", "weathered", "charnockite shear", "fault", "alluvial", "unconsolidated", "clay", "sand", "granulite"
        ])

        # Composite Risk Calculation (Calibrated Multi-Criteria Index)
        norm_susc = min(susceptibility / 0.95, 1.0)
        norm_rain = min(rainfall / 1800.0, 1.0)
        norm_geo = 0.95 if is_high_geo_vulnerability else 0.5

        if is_coastal_hazard:
            # Coastal surge and flood basin weighting
            norm_coastal_risk = min(max(4.5 - elevation, 0.5) / 4.0, 1.0)
            norm_pop = min(population / 5000.0, 1.0)
            norm_tide_surge = min(max(rainfall, 1200.0) / 1600.0, 1.0)
            
            composite_score = round((
                norm_susc * 30.0 +
                norm_coastal_risk * 25.0 +
                norm_tide_surge * 18.0 +
                norm_pop * 15.0 +
                norm_geo * 12.0
            ), 1)
        else:
            # Mountain landslide & slope subsidence weighting
            norm_deform = min(deformation / 18.0, 1.0)
            norm_slope = min(slope / 36.0, 1.0)
            norm_pop = min(population / 3000.0, 1.0)
            
            composite_score = round((
                norm_deform * 28.0 +
                norm_susc * 26.0 +
                norm_slope * 18.0 +
                norm_rain * 14.0 +
                norm_pop * 8.0 +
                norm_geo * 6.0
            ), 1)

        # Apply previous disaster multiplier if applicable
        if has_disaster_history:
            composite_score = min(round(composite_score + 4.0, 1), 100.0)

        # Classification Rule Determination:
        condition_hits = sum([
            cond_susceptibility,
            cond_deformation or (is_coastal_hazard and elevation <= 4.0),
            cond_rainfall,
            cond_slope_terrain,
            is_high_geo_vulnerability,
            cond_population,
            has_disaster_history
        ])

        has_physical_trigger = cond_deformation or cond_rainfall or cond_slope_terrain
        meets_score = composite_score >= thresholds["min_risk_score"]
        
        is_red_zone = (
            meets_score and
            condition_hits >= 3 and
            (has_physical_trigger if thresholds["require_insar_or_rain"] else True)
        )

        risk_level = "CRITICAL" if composite_score >= 88.0 else "HIGH" if composite_score >= 75.0 else "MODERATE" if composite_score >= 50.0 else "LOW"

        # Construct specific reasons why this was classified as Red Zone
        reasons: List[str] = []
        if is_red_zone:
            if is_coastal_hazard:
                reasons.append(f"Coastal / Estuarine Surge Zone with critical low elevation ({elevation:.1f}m ASL) vulnerable to tidal flooding.")
            elif cond_deformation:
                reasons.append(f"PSInSAR LOS creep rate (+{deformation:.1f} mm/yr) exceeds critical velocity threshold ({thresholds['min_deformation_rate']:.1f} mm/yr).")
            if cond_susceptibility:
                reasons.append(f"AI Hazard Susceptibility model index is {susceptibility:.2f} (classified as Very High Susceptibility).")
            if cond_rainfall:
                reasons.append(f"High monsoon rainfall exposure ({rainfall:.0f} mm/season) exceeds trigger threshold ({thresholds['min_rainfall']:.0f} mm).")
            if cond_slope_terrain and not is_coastal_hazard:
                reasons.append(f"{slope_reason} creates acute geotechnical instability.")
            if is_high_geo_vulnerability:
                reasons.append(f"Geological substrate ({geology}) exhibits severe joint fracturing and shear weakness.")
            if cond_population:
                reasons.append(f"Significant population exposure with {population:,} residents and dense habitations in active hazard corridor.")
            if has_disaster_history:
                reasons.append("Historical landslide / inundation scars present with documented recurrent slope failures.")
        else:
            reasons.append(f"Area does not exceed Red Zone threshold (Composite Score {composite_score:.1f}/100 < {thresholds['min_risk_score']:.1f}).")

        # 3D Extrusion Height for MapLibre 3D Rendering (in meters)
        extrusion_height = round(max(35.0, (composite_score - 40.0) * 5.0), 1) if is_red_zone else 15.0

        return {
            "is_red_zone": is_red_zone,
            "risk_score": composite_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "condition_matrix": {
                "ai_susceptibility": {"met": cond_susceptibility, "value": susceptibility, "threshold": thresholds["min_susceptibility"]},
                "insar_deformation": {"met": cond_deformation, "value": deformation, "threshold": thresholds["min_deformation_rate"]},
                "rainfall_exposure": {"met": cond_rainfall, "value": rainfall, "threshold": thresholds["min_rainfall"]},
                "slope_terrain": {"met": cond_slope_terrain, "value": slope, "threshold": thresholds["min_slope"]},
                "population_exposure": {"met": cond_population, "value": population, "threshold": thresholds["min_population_exposed"]},
                "geological_vulnerability": {"met": is_high_geo_vulnerability, "value": geology},
                "disaster_history": {"met": has_disaster_history, "value": "Documented Scars"}
            },
            "condition_hits_count": condition_hits,
            "extrusion_height_m": extrusion_height,
            "thresholds_applied": thresholds
        }

redzone_classifier = RedZoneClassificationEngine()
