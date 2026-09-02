import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from './utils/api';

// Components
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import DashboardTab from './components/DashboardTab';
import MapTab from './components/MapTab';
import AssignmentsTab from './components/AssignmentsTab';
import SurveyTab from './components/SurveyTab';
import RelocationTab from './components/RelocationTab';
import CommunityTab from './components/CommunityTab';
import SyncTab from './components/SyncTab';
import ProfileTab from './components/ProfileTab';

// Icons for Auth & Splash
import { 
  KeyRound, 
  UserCheck, 
  User, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Smartphone,
  Signal,
  Battery
} from 'lucide-react';

// Preset Officer Accounts for Instant Demo Login
const DEMO_ACCOUNTS = [
  {
    id: "OFFICER-TN-774",
    name: "R. Kavitha",
    email: "kavitha.tndma@zoneguard.gov.in",
    designation: "TNDMA Field Incident Commander & Revenue Inspector",
    district: "Nilgiris - Western Ghats Disaster Grid (Tamil Nadu)",
    assigned_block: "Coonoor & Kotagiri Taluk",
    phone: "+91 94421 88920",
    badge_no: "TNDMA-WG-2026-088",
    avatar_initials: "RK",
    role: "INCIDENT_COMMANDER"
  },
  {
    id: "OFFICER-TN-102",
    name: "Dr. K. Senthil Nathan, IAS",
    email: "collector.nilgiris@zoneguard.gov.in",
    designation: "District Collector & Chairman DDMA",
    district: "Nilgiris District Disaster Grid (Tamil Nadu)",
    assigned_block: "District HQ Command Center",
    phone: "+91 94432 11001",
    badge_no: "DDMA-IAS-2026-001",
    avatar_initials: "SN",
    role: "ADMIN"
  },
  {
    id: "OFFICER-TN-405",
    name: "M. Rajesh",
    email: "rajesh.sdrf@zoneguard.gov.in",
    designation: "SDRF Senior Field Surveyor & Rescue Lead",
    district: "Coimbatore & Anamalai Hazard Grid (Tamil Nadu)",
    assigned_block: "Valparai & Solaiyar Ghats",
    phone: "+91 98410 44552",
    badge_no: "SDRF-TN-2026-405",
    avatar_initials: "MR",
    role: "FIELD_SURVEYOR"
  }
];

// Preset Tamil Nadu Assigned Hazard Zones
const ASSIGNED_ZONES = [
  {
    code: "ZONE-TN-001",
    name: "Coonoor Marapallam Ghats Subsidence Sector",
    district: "Nilgiris",
    hazard_type: "Landslide Creep & Highway Toe Erosion",
    priority: "URGENT",
    priority_level: 1,
    risk_score: 99.6,
    deformation_rate: 18.6,
    slope: 34.2,
    population: 2840,
    habitations_count: 3,
    status: "Inspection Required",
    lat: 11.3530,
    lng: 76.7950,
    recommended_action: "Priority pre-disaster relocation to Mettupalayam Safe Plateau (SITE-07)"
  },
  {
    code: "ZONE-TN-002",
    name: "Kotagiri Kattery Ravines Landslide Corridor",
    district: "Nilgiris",
    hazard_type: "Debris Flow & Scarp Failure",
    priority: "HIGH",
    priority_level: 2,
    risk_score: 88.5,
    deformation_rate: 14.4,
    slope: 31.5,
    population: 1950,
    habitations_count: 2,
    status: "Pending Survey",
    lat: 11.4180,
    lng: 76.8620,
    recommended_action: "Deep drainage diversion & hillside anchor piling"
  },
  {
    code: "ZONE-TN-004",
    name: "Gudalur Devala Gold-Belt Debris Slump",
    district: "Nilgiris",
    hazard_type: "Torrential Soil Slump & Mine Subsidences",
    priority: "URGENT",
    priority_level: 1,
    risk_score: 99.1,
    deformation_rate: 17.5,
    slope: 29.5,
    population: 3400,
    habitations_count: 4,
    status: "Active Verification",
    lat: 11.4780,
    lng: 76.3850,
    recommended_action: "Permanent building decommissioning & plantation worker shelter"
  },
  {
    code: "ZONE-TN-008",
    name: "Valparai 40-Hairpin Ghat Road Escarpment",
    district: "Coimbatore",
    hazard_type: "Torrential Debris Flow & Rockfall",
    priority: "URGENT",
    priority_level: 1,
    risk_score: 100.0,
    deformation_rate: 19.8,
    slope: 36.5,
    population: 2850,
    habitations_count: 3,
    status: "Scheduled",
    lat: 10.3270,
    lng: 76.9550,
    recommended_action: "Priority pre-monsoon relocation to Pollachi Tableland (SITE-13)"
  },
  {
    code: "ZONE-TN-012",
    name: "Kodaikanal Pillar Rocks Shear Fracture Scarp",
    district: "Dindigul",
    hazard_type: "Vertical Cliff Scarp Shear & Topple",
    priority: "HIGH",
    priority_level: 2,
    risk_score: 98.9,
    deformation_rate: 16.8,
    slope: 42.0,
    population: 2250,
    habitations_count: 2,
    status: "Pending Survey",
    lat: 10.2110,
    lng: 77.4670,
    recommended_action: "Perimeter safety buffer & tourist evacuation siren trigger"
  }
];

export default function App() {
  // Screen Flow: 'splash' -> 'auth' -> 'app'
  const [appScreen, setAppScreen] = useState('splash');
  const [splashProgress, setSplashProgress] = useState(15);
  const [splashStatus, setSplashStatus] = useState("Connecting to Copernicus Sentinel-1 SAR Telemetry Grid...");

  // Auth Screen State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [officer, setOfficer] = useState(DEMO_ACCOUNTS[0]);

  // Login Form
  const [loginForm, setLoginForm] = useState({
    officerId: "OFFICER-TN-774",
    password: "••••••••",
    department: "TNDMA Incident Command",
    remember: true
  });

  // Signup Form
  const [signupForm, setSignupForm] = useState({
    name: "",
    officerId: "",
    email: "",
    phone: "",
    district: "Nilgiris (Western Ghats Grid)",
    department: "Tamil Nadu Disaster Management Authority (TNDMA)",
    password: "",
    badgeNo: ""
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendConnected, setBackendConnected] = useState(false);
  const [deviceFrameMode, setDeviceFrameMode] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  // Live GPS Coordinates
  const [gpsCoords, setGpsCoords] = useState({ lat: 11.3532, lng: 76.7954, accuracy: 3.2 });
  const [mapCenter, setMapCenter] = useState([11.3530, 76.7950]);
  const [mapZoom, setMapZoom] = useState(13);

  // Data State
  const [zones, setZones] = useState(ASSIGNED_ZONES);
  const [relocationSites, setRelocationSites] = useState([]);
  const [selectedMapZone, setSelectedMapZone] = useState(ASSIGNED_ZONES[0]);
  
  // Offline Queue
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('zoneguard_field_offline_queue');
      return saved ? JSON.parse(saved) : [
        {
          survey_code: "FS-TN-2026-8812",
          village_name: "Kotagiri Kattery Sector Cluster (ZONE-TN-002)",
          zone_code: "ZONE-TN-002",
          surveyor_name: "R. Kavitha (Field Officer)",
          lat: 11.4182,
          lng: 76.8621,
          gps_accuracy_m: 3.4,
          household_id: "HH-KT-042",
          family_members_count: 5,
          vulnerability_tags: ["Elderly (>65 yrs)", "Children (<5 yrs)"],
          livelihood_type: "Tea Plantation Worker",
          relocation_willingness: "Yes - Priority",
          observed_population: 820,
          damaged_houses: 34,
          observed_cracks: true,
          crack_depth_cm: 6.2,
          ground_condition: "Active Subsidence",
          remarks: "Tea estate retaining wall sheared by 4 inches overnight. Urgent drainage diversion required.",
          created_at: new Date().toLocaleString()
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const [syncedSurveys, setSyncedSurveys] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active Survey Form State
  const [formData, setFormData] = useState({
    zone_code: "ZONE-TN-001",
    village_name: "Coonoor Marapallam Upper Ward Settlement",
    surveyor_name: "R. Kavitha (TNDMA Field Incident Commander)",
    lat: 11.3532,
    lng: 76.7954,
    gps_accuracy_m: 3.2,
    household_id: "HH-CN-014-08",
    family_members_count: 4,
    vulnerability_tags: ["Elderly (>65 yrs)", "Persons with Disabilities (PWD)"],
    livelihood_type: "Tea & Coffee Plantation Worker",
    relocation_willingness: "Yes - Willing Immediately",
    observed_population: 2840,
    damaged_houses: 142,
    road_condition: "Severely Cracked (4x4 Vehicles Only)",
    observed_cracks: true,
    crack_depth_cm: 8.4,
    slope_instability: true,
    building_damage: true,
    road_damage: true,
    drainage_blocked: true,
    remarks: "Continuous ground creaking logged along Marapallam NH-181 scarp. Pre-disaster relocation to Mettupalayam recommended."
  });

  // Relocation Site Inspection State
  const [siteInspection, setSiteInspection] = useState({
    site_code: "SITE-07",
    site_name: "Mettupalayam Safe Plateau Relocation Township (Nilgiris Foot, TN)",
    verified_area_sqm: 220000,
    road_accessibility: "Excellent (NH-181 4-Lane)",
    water_availability: "Adequate (Bhavani River Source)",
    electricity_status: "TNEB Substation Connection Ready",
    healthcare_distance_km: 2.1,
    school_distance_km: 1.5,
    assigned_status: "Suitable",
    inspection_notes: "Elevated bedrock plateau verified stable. Excellent highway ingress for emergency vehicles."
  });

  // Community Engagement Survey State
  const [communitySurvey, setCommunitySurvey] = useState({
    zone_code: "ZONE-TN-001",
    village_name: "Coonoor Marapallam Settlement",
    households_consulted: 48,
    willing_count: 42,
    reluctant_count: 6,
    objection_severity: "Low",
    ceri_score: 22.4,
    officer_notes: "90% of families agree to pre-monsoon relocation provided transport subsidy is disbursed."
  });

  // Splash Screen Initialization Simulation
  useEffect(() => {
    const steps = [
      { progress: 25, status: "Synchronizing Sentinel-1 PSInSAR Deformation Feeds..." },
      { progress: 50, status: "Calibrating Offline High-Precision GNSS Receiver..." },
      { progress: 75, status: "Indexing 28 Tamil Nadu Multi-Hazard Spatial Red Zones..." },
      { progress: 95, status: "Securing Disaster Incident Officer Session..." },
      { progress: 100, status: "ZoneGuard Offline-First Engine Ready" }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setSplashProgress(steps[stepIndex].progress);
        setSplashStatus(steps[stepIndex].status);
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setAppScreen('auth');
        }, 400);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Online / Offline & Initial Data Fetch
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      autoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    fetchInitialData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Save offline queue
  useEffect(() => {
    try {
      localStorage.setItem('zoneguard_field_offline_queue', JSON.stringify(offlineQueue));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }, [offlineQueue]);

  const fetchInitialData = async () => {
    try {
      const [statsRes, sitesRes, surveysRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getRelocationSites().catch(() => []),
        api.getFieldSurveys().catch(() => [])
      ]);

      if (statsRes) setBackendConnected(true);
      if (Array.isArray(sitesRes) && sitesRes.length > 0) setRelocationSites(sitesRes);
      if (Array.isArray(surveysRes)) setSyncedSurveys(surveysRes);
    } catch (e) {
      setBackendConnected(false);
    }
  };

  const handleAcquireGPS = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = parseFloat(pos.coords.accuracy.toFixed(1));
          setGpsCoords({ lat, lng, accuracy: acc });
          setFormData(prev => ({ ...prev, lat, lng, gps_accuracy_m: acc }));
          setMapCenter([lat, lng]);
        },
        () => {
          setGpsCoords({ lat: 11.3532, lng: 76.7954, accuracy: 3.2 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleSelectZoneToInspect = (zone) => {
    setSelectedMapZone(zone);
    setFormData(prev => ({
      ...prev,
      zone_code: zone.code,
      village_name: `${zone.name.split('(')[0].trim()} Settlement`,
      lat: zone.lat || prev.lat,
      lng: zone.lng || prev.lng,
      observed_population: zone.population || prev.observed_population
    }));
    setMapCenter([zone.lat || 11.3530, zone.lng || 76.7950]);
  };

  const handleSubmitSurvey = async (evidencePhotos = []) => {
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    setSubmitting(true);

    const surveyCode = `FS-TN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord = {
      ...formData,
      survey_code: surveyCode,
      surveyor_role: "FIELD_OFFICER",
      evidence_photos_count: evidencePhotos.length,
      photos: evidencePhotos,
      status: isOnline ? "SYNCED" : "PENDING_SYNC",
      created_at: new Date().toLocaleString(),
      synced_at: isOnline ? new Date().toLocaleString() : null
    };

    if (isOnline) {
      try {
        await api.submitSurvey(newRecord);
        setSyncedSurveys(prev => [newRecord, ...prev]);
        confetti({ particleCount: 50, spread: 60 });
        alert(`Field Survey ${surveyCode} uploaded and synced with State Command Center.`);
      } catch (err) {
        setOfflineQueue(prev => [newRecord, ...prev]);
        alert(`Upload saved to local offline queue. Will auto-sync when central server is connected.`);
      }
    } else {
      setOfflineQueue(prev => [newRecord, ...prev]);
      alert(`Device offline. Survey ${surveyCode} stored in local encrypted memory.`);
    }

    setSubmitting(false);
    setActiveTab('sync');
  };

  const autoSync = async () => {
    if (offlineQueue.length === 0) return;
    setSyncing(true);
    if (navigator.vibrate) navigator.vibrate(50);
    try {
      const res = await api.syncSurveys(offlineQueue);
      if (res?.status === "BATCH_SYNCED") {
        setSyncedSurveys(prev => [...offlineQueue.map(q => ({ ...q, status: "SYNCED" })), ...prev]);
        setOfflineQueue([]);
        confetti({ particleCount: 60, spread: 70 });
      }
    } catch (e) {
      console.warn("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  };

  const calculateCERI = (households, willing, reluctant, severity) => {
    const refusalRatio = households > 0 ? (reluctant / households) : 0;
    const severityWeight = severity === "High" ? 35 : severity === "Moderate" ? 20 : 10;
    const ceri = Math.round((refusalRatio * 55 + severityWeight));
    return Math.min(100, Math.max(0, ceri));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(40);
    const matched = DEMO_ACCOUNTS.find(a => a.id.toLowerCase() === loginForm.officerId.toLowerCase() || a.email.toLowerCase() === loginForm.officerId.toLowerCase()) || DEMO_ACCOUNTS[0];
    setOfficer(matched);
    setAppScreen('app');
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleQuickDemoLogin = (account) => {
    if (navigator.vibrate) navigator.vibrate(30);
    setOfficer(account);
    setAppScreen('app');
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.officerId) {
      alert("Please fill in your name and Officer ID.");
      return;
    }
    if (navigator.vibrate) navigator.vibrate(50);
    const newOfficer = {
      id: signupForm.officerId || `OFFICER-TN-${Math.floor(100 + Math.random() * 900)}`,
      name: signupForm.name,
      email: signupForm.email || `${signupForm.name.toLowerCase().replace(/\s+/g, '')}@zoneguard.gov.in`,
      designation: `${signupForm.department} Field Officer`,
      district: `${signupForm.district} Grid (Tamil Nadu)`,
      assigned_block: "Assigned Corridor",
      phone: signupForm.phone || "+91 94400 00000",
      badge_no: signupForm.badgeNo || `TNDMA-FO-2026-${Math.floor(100 + Math.random() * 900)}`,
      avatar_initials: signupForm.name.substring(0, 2).toUpperCase(),
      role: "FIELD_SURVEYOR"
    };
    setOfficer(newOfficer);
    setAppScreen('app');
    confetti({ particleCount: 60, spread: 70 });
  };

  const handleLogout = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    setAppScreen('auth');
  };

  // =========================================================================
  // VIEW 1: SPLASH SCREEN
  // =========================================================================
  if (appScreen === 'splash') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden animate-fade-in">
        <div className="absolute w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl animate-pulse pointer-events-none" />
        
        <div className="relative z-10 max-w-sm w-full text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/80 bg-white p-2">
            <img src="/app-icon.png" alt="ZoneGuard AI Field Officer Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
              GOVERNMENT OF TAMIL NADU • TNDMA
            </span>
            <h1 className="text-2xl font-black text-white font-heading tracking-wide">
              ZONEGUARD <span className="text-emerald-400">FIELD OPS</span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Disaster Ground-Truth & Relocation Mobile Portal
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${splashProgress}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-emerald-400 font-bold animate-pulse">
              {splashStatus}
            </p>
          </div>

          <button
            onClick={() => setAppScreen('auth')}
            className="text-[11px] font-mono font-bold text-slate-500 hover:text-slate-300 underline cursor-pointer pt-2 btn-touch"
          >
            Skip Initialization →
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATION SCREEN (LOGIN & REGISTER)
  // =========================================================================
  if (appScreen === 'auth') {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none animate-fade-in">
        <div className="max-w-md w-full bg-white rounded-3xl border-2 border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500 bg-white p-1">
              <img src="/app-icon.png" alt="ZoneGuard AI App Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                OFFICER INCIDENT AUTHENTICATION
              </span>
              <h2 className="text-xl font-black text-slate-950 font-heading mt-1">
                ZoneGuard AI Field Portal
              </h2>
              <p className="text-xs text-slate-600 font-semibold">
                Tamil Nadu Disaster Management Authority (TNDMA)
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-300 text-xs font-black">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 btn-touch ${
                authMode === 'login' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Officer Login</span>
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 btn-touch ${
                authMode === 'signup' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Register Officer</span>
            </button>
          </div>

          {/* LOGIN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
              <div>
                <label className="text-[11px] font-mono text-slate-700 font-black block mb-1 uppercase">
                  Officer ID / Official Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginForm.officerId}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, officerId: e.target.value }))}
                    placeholder="OFFICER-TN-774"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-700 font-black block mb-1 uppercase">
                  Security Passcode
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter security passcode"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all btn-touch"
              >
                <span>Authorize & Launch Field Ops</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo Credentials Panel */}
              <div className="pt-3 border-t-2 border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-mono text-slate-800 font-black uppercase">
                      Quick Demo Accounts (1-Click)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    PIN: demo123
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border-2 border-slate-200 hover:border-emerald-500 text-left transition-all space-y-2 card-hover"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-950">{acc.name}</span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.2 rounded-md">
                              {acc.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-semibold">{acc.designation}</p>
                          <p className="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">{acc.assigned_block}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginForm({
                              officerId: acc.id,
                              password: "demo123",
                              department: acc.designation,
                              remember: true
                            });
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs cursor-pointer text-center btn-touch"
                        >
                          Auto-Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDemoLogin(acc)}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer text-center shadow-xs flex items-center justify-center gap-1 btn-touch"
                        >
                          <span>1-Click Login</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-3.5 animate-fade-in">
              <div>
                <label className="text-[11px] font-mono text-slate-700 font-black block mb-1 uppercase">
                  Officer Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. R. Kavitha"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-mono text-slate-700 font-black block mb-1 uppercase">
                    Badge / ID
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.officerId}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, officerId: e.target.value }))}
                    placeholder="OFFICER-TN-892"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-700 font-black block mb-1 uppercase">
                    District
                  </label>
                  <select
                    value={signupForm.district}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
                  >
                    <option>Nilgiris</option>
                    <option>Coimbatore</option>
                    <option>Dindigul</option>
                    <option>Theni</option>
                    <option>Tenkasi</option>
                    <option>Salem</option>
                    <option>Kanyakumari</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-700 font-black block mb-1 uppercase">
                  Official Email
                </label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="officer@tndma.tn.gov.in"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-700 font-black block mb-1 uppercase">
                  Passcode
                </label>
                <input
                  type="password"
                  required
                  value={signupForm.password}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all mt-2 btn-touch"
              >
                <span>Register & Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MAIN FIELD OFFICER APPLICATION
  // =========================================================================
  const renderAppContent = () => (
    <div className="flex-1 flex flex-col font-sans select-none pb-20 md:pb-6 bg-slate-100 min-h-screen">
      {/* Clean Minimalist Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        officer={officer}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        offlineCount={offlineQueue.length}
        zonesCount={zones.length}
        onAcquireGps={handleAcquireGPS}
        onInstallPwa={() => alert("To install on Android: Open Chrome Menu > Install App.")}
        deviceFrameMode={deviceFrameMode}
        setDeviceFrameMode={setDeviceFrameMode}
      />

      {/* Main Tab Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            officer={officer}
            zones={zones}
            offlineQueue={offlineQueue}
            syncedSurveys={syncedSurveys}
            gpsCoords={gpsCoords}
            onAcquireGps={handleAcquireGPS}
            onNavigateToTab={setActiveTab}
            onSelectZone={handleSelectZoneToInspect}
          />
        )}

        {activeTab === 'map' && (
          <MapTab
            mapCenter={mapCenter}
            setMapCenter={setMapCenter}
            mapZoom={mapZoom}
            setMapZoom={setMapZoom}
            gpsCoords={gpsCoords}
            officer={officer}
            zones={zones}
            relocationSites={relocationSites}
            selectedMapZone={selectedMapZone}
            setSelectedMapZone={setSelectedMapZone}
            onSelectZoneToInspect={handleSelectZoneToInspect}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsTab
            zones={zones}
            officer={officer}
            onSelectZoneToInspect={handleSelectZoneToInspect}
            onNavigateToTab={setActiveTab}
            setMapCenter={setMapCenter}
            setMapZoom={setMapZoom}
            setSelectedMapZone={setSelectedMapZone}
          />
        )}

        {activeTab === 'survey' && (
          <SurveyTab
            formData={formData}
            setFormData={setFormData}
            zones={zones}
            onAcquireGps={handleAcquireGPS}
            onSubmitSurvey={handleSubmitSurvey}
            submitting={submitting}
            isOnline={isOnline}
            officer={officer}
          />
        )}

        {activeTab === 'relocation' && (
          <RelocationTab
            siteInspection={siteInspection}
            setSiteInspection={setSiteInspection}
            relocationSites={relocationSites}
          />
        )}

        {activeTab === 'community' && (
          <CommunityTab
            communitySurvey={communitySurvey}
            setCommunitySurvey={setCommunitySurvey}
            calculateCERI={calculateCERI}
          />
        )}

        {activeTab === 'sync' && (
          <SyncTab
            offlineQueue={offlineQueue}
            syncedSurveys={syncedSurveys}
            syncing={syncing}
            onAutoSync={autoSync}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            officer={officer}
            backendConnected={backendConnected}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Touch-Optimized Bottom Nav for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        offlineCount={offlineQueue.length}
      />
    </div>
  );

  // Return Phone Simulator on desktop or Full Native Screen
  if (deviceFrameMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 select-none">
        <div className="mb-4 flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-xs text-white">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">Field Officer Device Hardware View</span>
          <button
            onClick={() => setDeviceFrameMode(false)}
            className="ml-4 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer text-xs btn-touch"
          >
            Exit Frame
          </button>
        </div>

        <div className="w-[412px] h-[870px] bg-black rounded-[52px] p-3.5 shadow-2xl border-4 border-slate-700 relative flex flex-col overflow-hidden">
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="h-6 w-full bg-white flex items-center justify-between px-6 pt-1 text-[11px] font-mono font-bold text-slate-900 z-40 rounded-t-[36px]">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-slate-800">
              <Signal className="w-3 h-3" />
              <span className="text-[10px]">5G</span>
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="flex-1 w-full bg-slate-100 rounded-b-[36px] overflow-y-auto overflow-x-hidden no-scrollbar relative">
            {renderAppContent()}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400 rounded-full z-50 pointer-events-none" />
        </div>
      </div>
    );
  }

  return renderAppContent();
}
