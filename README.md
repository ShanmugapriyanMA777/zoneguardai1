# 🛡️ ZoneGuard AI — National Multi-Hazard Red-Zone Mapping & Relocation Decision Support System

[![ESA Copernicus](https://img.shields.io/badge/ESA-Copernicus%20Sentinel--1%20SAR-blue.svg)](https://dataspace.copernicus.eu/)
[![ISRO Cartosat DEM](https://img.shields.io/badge/ISRO-Cartosat%2010m%20DEM-orange.svg)](https://bhuvan.nrsc.gov.in/)
[![Landsat LULC](https://img.shields.io/badge/USGS%2FNASA-Landsat--8%2F9%20LULC-green.svg)](https://earthexplorer.usgs.gov/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20REST-009688.svg)](https://fastapi.tiangolo.com/)
[![React Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev/)

ZoneGuard AI is an enterprise-grade **National Multi-Hazard Early Warning & Pre-Disaster Relocation Decision Support System**. It integrates live multi-sensor Earth Observation (EO) satellite data, machine learning susceptibility models, and multi-criteria spatial carrying capacity engines to transition disaster management from reactive rescue to proactive mitigation.

---

## 🌟 Key Capabilities

### 1. 🛰️ Multi-Source Satellite Data Ingestion Studio
* **ESA Copernicus Sentinel-1 C-SAR (5.405 GHz)**:
  * Persistent Scatterer Interferometry (PSInSAR via StaMPS + SNAP)
  * Line-of-Sight (LOS) surface creep displacement velocity ($\text{mm/year}$) and temporal phase coherence ($\gamma \ge 0.85$).
* **ISRO Cartosat 10m DEM (NRSC / Bhuvan)**:
  * Sub-pixel terrain slope gradient ($\theta$), profile/plan curvature, aspect, and Topographic Wetness Index ($TWI = \ln(\frac{a}{\tan\beta})$).
* **USGS/NASA Landsat-8/9 OLI & Sentinel-2 LULC**:
  * Harmonized surface reflectance, Canopy $NDVI$, Built-up $NDBI$, surface moisture ($MNDWI$), and geotechnical root shear cohesion reinforcement ($c_r = 18.5\text{ kN/m}^2$).

---

### 2. Multi-Hazard Red-Zone & Precaution Matrix
Direct monitoring across all primary Indian disaster corridors:
* **Tamil Nadu (Nilgiris Ghats & Coast)**: Landslide creep (Coonoor/Kotagiri) and coastal cyclone storm surge.
* **Uttarakhand (Himalayan Belt)**: High-altitude ground subsidence (Joshimath Sunil Ward) and flash floods (Chamoli/Kedarnath).
* **Kerala (Western Ghats Escarpment)**: Torrential debris flows & soil slips (Wayanad Chooralmala / Meppadi).
* **Himachal Pradesh (Seismic Zone V)**: Active thrust fault creep & highway cut-slope failure (Kangra / Shimla).
* **Odisha (Bay of Bengal Coast)**: Super cyclone storm surge & riverine inundation (Puri / Paradip).
* **Assam (Brahmaputra Basin)**: Annual monsoon riverine floodplain inundation (Guwahati / Kaziranga).
* **Gujarat (Kutch Basin)**: Active tectonic fault line deformation (Bhuj).

---

### 3. 👥 Carrying Capacity Calculation Engine ($PCC \to RCC \to ECC$)
1. **Physical Carrying Capacity (PCC)**: Standard usable land allocation ($30\text{ m}^2/\text{person}$).
2. **Real Carrying Capacity (RCC)**: Topographic and hydrological correction factors ($C_{slope} \times C_{water} \times C_{soil}$).
3. **Effective Carrying Capacity (ECC)**: Evacuation road access, medical post density, and sanitation management factors ($M_{road} \times M_{health} \times M_{sanitation}$).

---

### 4. 🧭 AHP-MCDA Safe Relocation Planner
* Multi-criteria weighted overlay ranking using Saaty's Analytic Hierarchy Process (AHP).
* Mathematically validates matrix Consistency Ratio ($CR < 0.10$).
* Direct matching of red zones to high-suitability relocation townships (e.g. `SITE-07 Mettupalayam Safe Plateau`, `SITE-01 Pipalkoti River Terrace`, `SITE-09 Kalpetta Ridge`).

---

### 5. 🤖 Explainable AI (TreeSHAP & WoE)
* **Random Forest Classifier**: $92.4\%$ classification accuracy, $0.948$ AUC-ROC.
* **Weight of Evidence (WoE)**: Geomorphic conditioning factor contrast ratios.
* **TreeSHAP Attribution**: Transparent waterfall breakdown explaining why specific zones are designated as Critical.

---

### 6. 📋 Field Survey & Ground Truth Portal
* Field disaster officer interface for capturing GPS waypoints, structural crack depths, photo evidence, and logging habitations.
* Offline synchronization queue with batch sync when network connectivity is restored.

---

## 🚀 Quick Start & Installation

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows
source venv/bin/activate   # On Linux/macOS

pip install -r requirements.txt

# Seed Database with Multi-Hazard Data
python scripts/seed_demo_data.py

# Start Server
python -m uvicorn app.main:app --port 8000 --reload
```

### 2. Frontend Setup (React Vite)
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📜 License
Developed for National Disaster Management Authorities (NDMA / TNDMA / SDRF). Distributed under the MIT License.
