import React from 'react';
import { 
  ShieldAlert, 
  Satellite, 
  BrainCircuit, 
  Users, 
  Compass, 
  Sparkles, 
  ClipboardCheck, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Activity,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function LandingPage({ onLaunch, onExploreRedZones, stats }) {
  const features = [
    {
      icon: Satellite,
      title: "Satellite Data Ingestion Engine",
      badge: "Sentinel-1 SAR • Cartosat DEM • Landsat LULC",
      description: "Direct ingestion of ESA Copernicus Sentinel-1 C-SAR (InSAR mm/yr), ISRO Cartosat 10m DEM (slope/curvature), and Landsat-8/9 multispectral LULC canopy indices.",
      border: "border-red-300 bg-red-50/70 text-red-900",
      iconColor: "text-red-600 bg-red-100",
      badgeColor: "bg-red-100 text-red-800 border-red-300"
    },
    {
      icon: BrainCircuit,
      title: "AI Hazard Susceptibility",
      badge: "WoE + Random Forest",
      description: "Combines 7 geomorphic factors (slope, rainfall, river distance, geology, deformation) using Weight of Evidence and Random Forest classification.",
      border: "border-amber-300 bg-amber-50/70 text-amber-900",
      iconColor: "text-amber-600 bg-amber-100",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300"
    },
    {
      icon: Users,
      title: "Carrying Capacity Engine",
      badge: "PCC → RCC → ECC",
      description: "Calculates Physical (PCC), Real (RCC), and Effective (ECC) carrying capacity considering terrain constraints, medical, water, and sanitation factors.",
      border: "border-emerald-300 bg-emerald-50/70 text-emerald-900",
      iconColor: "text-emerald-600 bg-emerald-100",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300"
    },
    {
      icon: Compass,
      title: "GIS-MCDA + AHP Relocation",
      badge: "Saaty Consistency CR < 0.10",
      description: "Ranks candidate relocation sites with multi-criteria weighted overlay and automated capacity matching for high-risk red zones.",
      border: "border-yellow-300 bg-yellow-50/70 text-yellow-900",
      iconColor: "text-yellow-600 bg-yellow-100",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300"
    },
    {
      icon: Sparkles,
      title: "Explainable AI (XAI)",
      badge: "TreeSHAP Attribution",
      description: "Generates feature contribution waterfalls and plain-language reasoning answering 'Why is this zone classified as Critical risk?'.",
      border: "border-slate-300 bg-white text-slate-900 shadow-sm",
      iconColor: "text-red-600 bg-red-100",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300"
    },
    {
      icon: ClipboardCheck,
      title: "Field Survey & Ground Truth Portal",
      badge: "Offline Queue & GPS",
      description: "Enables field disaster officers to capture GPS coordinates, log fissure depths, attach photo evidence, and batch sync when network connectivity returns.",
      border: "border-emerald-300 bg-emerald-50/70 text-emerald-900",
      iconColor: "text-emerald-600 bg-emerald-100",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300"
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-6 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Top Pills */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-black uppercase tracking-wider mb-6 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          TNDMA DISASTER DECISION SUPPORT PLATFORM (TAMIL NADU)
        </div>

        {/* Hero Title */}
        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-tight text-slate-950">
          From Red-Zone Hazard Detection <br />
          to <span className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 bg-clip-text text-transparent">
            Safe Relocation
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto font-medium leading-relaxed">
          AI-powered multi-hazard intelligence for proactive disaster risk reduction, Copernicus Sentinel-1 PSInSAR ground deformation tracking, and evidence-based population relocation.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onLaunch}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-600 hover:opacity-95 text-white font-black text-base shadow-xl shadow-red-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={onExploreRedZones}
            className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-base border-2 border-slate-300 hover:border-slate-400 transition-all cursor-pointer shadow-md"
          >
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Red Zones & Precautions Matrix</span>
          </button>
        </div>

        {/* Real-time District Summary Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-white border-2 border-slate-200 max-w-5xl mx-auto shadow-xl">
          <div className="text-xs uppercase tracking-wider text-slate-700 font-mono font-black mb-4 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Active District Telemetry: Nilgiris-Western Ghats Multi-Hazard Corridor (Tamil Nadu)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-left">
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 shadow-sm">
              <div className="text-[11px] font-bold text-red-800 uppercase font-mono">High Risk Zones</div>
              <div className="text-2xl font-black text-red-600 mt-1">{stats?.cards?.high_risk_zones || 27}</div>
              <div className="text-[10px] font-bold text-red-700">🔴 {stats?.cards?.critical_zones || 7} Critical</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-sm">
              <div className="text-[11px] font-bold text-amber-800 uppercase font-mono">Population at Risk</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{stats?.cards?.population_at_risk?.toLocaleString() || '29,515'}</div>
              <div className="text-[10px] font-bold text-amber-800">Citizens mapped</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-700 uppercase font-mono">Habitations</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.cards?.critical_habitations || 22}</div>
              <div className="text-[10px] font-semibold text-slate-600">Wards / Villages</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 shadow-sm">
              <div className="text-[11px] font-bold text-emerald-800 uppercase font-mono">Suitable Sites</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.cards?.suitable_sites || 12}</div>
              <div className="text-[10px] font-bold text-emerald-700">✅ ECC Validated</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 shadow-sm">
              <div className="text-[11px] font-bold text-red-800 uppercase font-mono">Deformation Alerts</div>
              <div className="text-2xl font-black text-red-600 mt-1">{stats?.cards?.active_deformation_alerts || 23}</div>
              <div className="text-[10px] font-semibold text-red-700">PSInSAR scatterers</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-yellow-50 border-2 border-yellow-200 shadow-sm">
              <div className="text-[11px] font-bold text-yellow-800 uppercase font-mono">Avg Hazard Index</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{stats?.cards?.average_hazard_score || 61.8}/100</div>
              <div className="text-[10px] font-semibold text-amber-800">Tamil Nadu Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Pillars */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
            End-to-End Multi-Hazard Decision Architecture
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto font-medium">
            From Space Segment Radar Interferometry to Grassroots Field Verification & Rehabilitation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className={`p-6 rounded-3xl ${feat.border} border-2 backdrop-blur-md hover:shadow-xl transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${feat.iconColor} border flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full border ${feat.badgeColor}`}>
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-950 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{feat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Decision Workflow Preview Banner */}
      <section className="py-7 px-6 bg-white border-t-2 border-slate-200 text-center shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs font-mono font-black">
          <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-800 border border-red-300 shadow-sm">1. DETECT (Sentinel-1)</span>
          <span className="text-amber-600 font-black">→</span>
          <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-800 border border-red-300 shadow-sm">2. ASSESS (WoE)</span>
          <span className="text-amber-600 font-black">→</span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">3. PREDICT (Random Forest)</span>
          <span className="text-amber-600 font-black">→</span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">4. CALCULATE (PCC→ECC)</span>
          <span className="text-emerald-600 font-black">→</span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">5. FIND SAFE SITES</span>
          <span className="text-emerald-600 font-black">→</span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">6. AHP RANK & ROUTE</span>
          <span className="text-slate-600 font-black">→</span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 shadow-sm">7. VERIFY (Ground Survey)</span>
        </div>
      </section>
    </div>
  );
}
