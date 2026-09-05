# 🚀 ZoneGuard AI — Production Cloud Deployment Guide

ZoneGuard AI is optimized for fast, zero-configuration cloud hosting without requiring Docker.

| Component | Recommended Host | Runtime | Free Tier Available? |
| :--- | :--- | :--- | :--- |
| **Frontend Dashboard** | **Vercel** | Vite / React 19 Edge CDN | ✅ Yes (Free) |
| **Backend API** | **Render / Railway** | Python 3.12 (FastAPI + Uvicorn) | ✅ Yes (Free / Starter) |
| **Mobile Field Portal** | **Vercel / Android APK** | Static Web or Installed APK | ✅ Yes |

---

## ⚡ Option 1: Decoupled Cloud Deployment (Vercel + Render)

This is the standard, highest performance setup: Vercel serves the UI from ultra-fast global edge locations, and Render hosts the Python machine learning and spatial calculation backend.

### Step 1: Deploy Backend to Render

1. Sign up / log in to **[Render.com](https://render.com/)**.
2. Click **New +** → **Web Service** → Connect your GitHub repository.
3. Configure the service:
   * **Name**: `zoneguard-backend`
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Plan**: `Free`
4. Under **Environment Variables**, configure:
   * `DEMO_MODE`: `true`
   * `SECRET_KEY`: `zoneguard-sih-2026-production-key` (or generate a random key)
5. Click **Deploy Web Service**.
6. Render will automatically build dependencies and auto-seed the multi-hazard database.
7. Note down your backend URL (e.g., `https://zoneguard-backend.onrender.com`).

*(Alternatively, use [render.yaml](file:///render.yaml) for 1-click blueprint deployment on Render).*

---

### Step 2: Deploy Frontend to Vercel

#### Method A: Automated CLI Script (Windows)
Run the automated script in your project root:
```powershell
.\deploy_to_vercel.ps1
# OR
deploy_to_vercel.bat
```
Follow the interactive CLI prompts to link to your Vercel account.

#### Method B: Vercel Web Dashboard
1. Go to **[Vercel Dashboard](https://vercel.com/)** → **Add New** → **Project**.
2. Import your `zoneguard-ai` repository.
3. Settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend` (or leave default root; [vercel.json](file:///vercel.json) handles both)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   * `VITE_API_URL`: `https://zoneguard-backend.onrender.com` *(your Render backend URL)*
5. Click **Deploy**.
6. Your live web app is now published globally with instant CDN caching and SSL.

---

## 🚂 Option 2: Railway.app (Native Python)

1. Open **[Railway.app](https://railway.app/)** and select **New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. Railway automatically detects the root [Procfile](file:///Procfile).
4. In **Settings** → **Build & Deploy**:
   * Set Root Directory to `backend` (or leave root with Procfile).
5. In **Variables**, add:
   * `PORT`: `8000`
   * `DEMO_MODE`: `true`
6. Click **Deploy**. Railway provisions an HTTPS endpoint automatically.

---

## 💻 Option 3: Production Self-Hosted on Linux/Windows Server

For deployment on an internal network, disaster management data centre, or Linux VPS (Ubuntu/Debian):

### 1. Install Dependencies
```bash
# Python & Node
sudo apt update
sudo apt install python3-pip python3-venv nodejs npm -y
```

### 2. Build Frontend Assets
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Start Backend with Systemd or PM2
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start with production Uvicorn workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Because FastAPI is configured with static SPA mounting, navigating to `http://<your-server-ip>:8000` will automatically serve the compiled frontend, API endpoints, and GIS layers simultaneously from a single port!

---

## 📋 Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8000` | Cloud web service port (assigned by Render, Railway, or Heroku). |
| `VITE_API_URL` | `""` (defaults to `/api`) | Backend URL when frontend is hosted separately on Vercel. |
| `DATABASE_URL` | `sqlite:///./zoneguard.db` | Connection string. Supports SQLite or PostgreSQL (`postgresql://...`). |
| `DEMO_MODE` | `true` | Pre-computes multi-sensor satellite data and AHP relocation matrices. |
| `REAL_DATA_MODE` | `false` | Enables direct querying of ESA Copernicus CDSE APIs. |
| `SECRET_KEY` | *(Default provided)* | Secret key for JWT authentication tokens. |

---

## 🛡️ Production Readiness Checklist

- [x] **Zero Docker Dependency**: Clean native Python 3 and Node.js execution.
- [x] **Zero-Config Database Seeding**: New or empty databases automatically initialize on startup.
- [x] **Universal CORS**: Dynamic regex origin handling supports local testing, Vercel previews, custom domains, and mobile field portals.
- [x] **Production Static Serving**: FastAPI serves the compiled React SPA if present, eliminating routing collisions.
- [x] **Dynamic Port Binding**: Honors cloud host `$PORT` injection.
- [x] **Vercel Validated**: Schema-compliant `vercel.json` with SPA rewrites.
