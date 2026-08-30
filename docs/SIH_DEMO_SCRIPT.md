# ZoneGuard AI — SIH Demonstration & Judge Presentation Script

This document details the exact 17-step end-to-end presentation flow for Smart India Hackathon (SIH) judges and disaster management authorities.

---

## The Demonstration Storyline

**Scenario:** Monsoonal pore-pressure spikes and geological thrust line reactivation have triggered rapid surface subsidence in the Himalayan hazard corridor.

### STEP 1: Role Authentication
1. Launch the application.
2. In the top-right header role switcher, observe **Col. R. K. Sharma (Retd.) [DDMA District Administrator]**.
3. View the live telemetry banner showing **17 High-Risk Zones, 29,515 Citizens at Risk, and 23 Active PSInSAR Deformation Alerts**.

### STEP 2: Open GIS Command Center
1. Click **"Launch Command Center"** or select the **"GIS Command Center"** tab.
2. The full-screen interactive Leaflet map loads centered on the **Chamoli-Rudraprayag Hazard Corridor**.

### STEP 3: Base Map & Layer Inspection
1. Switch base maps between **Dark Matter**, **Satellite Imagery**, and **Terrain DEM**.
2. Toggle individual hazard layers in the bottom-left controller:
   - 🔴 **Red Zones** (Hazard polygons colored Green/Low, Yellow/Mod, Orange/High, Red/Critical)
   - 📡 **PSInSAR Deformation Points** (Persistent Scatterers with LOS displacement velocity)
   - 🏘️ **Habitations & Villages** (Population exposure & socio-economic vulnerability)
   - 🟢 **Relocation Sites** (Resettlement townships with carrying capacity)
   - 🏥 **Critical Infrastructure** (Hospitals, colleges, suspension bridges, SDRF shelters)

### STEP 4: Inspect Key Red-Zone `ZONE-RZ-014`
1. Click the **"Locate: RZ-014 (Critical)"** quick button or click directly on polygon `ZONE-RZ-014` (Joshimath Upper Ward).
2. The **Zone Inspector Side Drawer** opens displaying live telemetry:
   - **Zone Code:** `ZONE-RZ-014`
   - **Risk Level:** `CRITICAL (91 / 100)`
   - **Population at Risk:** `2,840 residents (613 buildings)`
   - **Ground Deformation:** `+18.6 mm/year (Accelerating Subsidence)`
   - **Slope Angle:** `34.2° (Steep Gradient)`
   - **Rainfall Exposure:** `1480 mm/season`
   - **Recommended Action:** `"Priority pre-disaster relocation"`

### STEP 5: Explainable AI (TreeSHAP) Reasoning
1. Click **"Why Critical? (SHAP Explainability)"**.
2. The **SHAP Modal** pops up:
   - Natural language executive summary explaining why the zone is dangerous.
   - Attributed risk elevation from baseline **32% $\to$ 91%**.
   - Feature contribution waterfall:
     - **Ground Deformation (PSInSAR):** `+31% contribution (+18.6 mm/yr)`
     - **Terrain Slope:** `+24% contribution (34.2°)`
     - **Monsoon Rainfall:** `+18% contribution (1480 mm)`
     - **River Proximity:** `+12% contribution (320m)`
     - **Lithology:** `+8% contribution (Fissured Gneiss)`

### STEP 6: Execute Proactive Relocation Matching
1. Click **"Find Safe Relocation Site"**.
2. The recommendation engine evaluates 15 candidate sites using GIS-MCDA + AHP and filters by required capacity ($2,840$).
3. **`SITE-07` (Pipalkoti Safe Plateau Relocation Township)** is recommended:
   - **Suitability Score:** `91 / 100`
   - **Safety Index:** `94 / 100`
   - **Effective Carrying Capacity (ECC):** `3,198 persons`
   - **Capacity Surplus:** `+358 persons (ADEQUATE)`
   - **Evacuation Distance:** `26 km (~49 mins transit time)`
   - **Road Accessibility:** `Excellent (NH-58 Arterial Bypass)`

### STEP 7: Evacuation Corridor & Polyline Route
1. Notice the cyan pulsating **Evacuation Polyline Route** rendered on the GIS map connecting `ZONE-RZ-014` directly to `SITE-07`.

### STEP 8: Generate Pre-Disaster Relocation Decision Report
1. Click **"Decision Report"**.
2. An official, formatted **Pre-Disaster Relocation Decision Report** opens with:
   - Executive summaries, target zone hazard factors, and allocated site parameters.
   - Actionable directives for DDMA and SDRF deployment.
   - Digital sign-off block.
   - 1-click **"Export PDF"** and **"Print"** capabilities.

### STEP 9: Field Officer Mobile Ground Truthing & Sync
1. In the top navbar, switch role to **"Disaster Field Officer (Pooja Rawat)"** or click **"Field Mobile App"**.
2. The mobile phone simulator interface appears:
   - GPS telemetry tags live coordinates ($30.5582^\circ\text{ N}, 79.5664^\circ\text{ E}$).
   - Log observed tension cracks ($8.4\text{ cm}$), damaged structures ($142$), and ground conditions.
   - Attach photographic evidence.
   - Toggle **Offline Mode** to demonstrate queue storage (`Pending Sync: 1`), then hit **"Sync Offline Queue"** to upload back to the central DDMA command center database.

### STEP 10: Explore Modules
1. **Ground Deformation (PSInSAR):** Inspect time-series curves for Persistent Scatterer `PS-1048`.
2. **Carrying Capacity Studio:** Adjust sliders for area, slope, and sanitation to see real-time $PCC \to RCC \to ECC$ updates.
3. **Safe Relocation Planner:** Modify AHP criteria weights and view real-time Consistency Ratio ($CR < 0.10$).
4. **Analytics Dashboard:** Review risk distributions and WoE factor importance tables.
