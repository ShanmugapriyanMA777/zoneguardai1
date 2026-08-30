import React, { useState } from 'react';
import { 
  BookOpen, 
  Satellite, 
  BrainCircuit, 
  Users, 
  Compass, 
  CheckCircle2, 
  Smartphone, 
  ShieldAlert, 
  ArrowRight, 
  Layers, 
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function MethodologyPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "1. Sentinel-1 SAR & PSInSAR Deformation",
      tag: "Space Segment",
      icon: Satellite,
      summary: "High-precision millimeter-scale ground displacement time-series from Copernicus Sentinel-1 C-band SAR.",
      details: "Persistent Scatterer Interferometry (PSInSAR) utilizes stable natural radar reflectors (rock outcrops, masonry buildings, infrastructure) across multiple SAR acquisition dates. Line-of-Sight (LOS) velocity (mm/year) is calculated after removing topographic phase, atmospheric phase screen (APS), and orbital errors.",
      formula: "\\Delta \\phi_{int} = \\Delta \\phi_{topo} + \\Delta \\phi_{def} + \\Delta \\phi_{atm} + \\Delta \\phi_{noise}"
    },
    {
      id: 2,
      title: "2. Weight of Evidence (WoE) Feature Engineering",
      tag: "Geomorphic Modeling",
      icon: BrainCircuit,
      summary: "Bivariate statistical weighting of conditioning factors against historical landslide inventories.",
      details: "Weight of Evidence computes positive (W+) and negative (W-) weights based on conditional probabilities. High contrast (C = W+ - W-) indicates high predictive influence on slope failure and hazard susceptibility.",
      formula: "W^+ = \\ln\\left( \\frac{P(B \\mid D)}{P(B \\mid \\bar{D})} \\right), \\quad C = W^+ - W^-"
    },
    {
      id: 3,
      title: "3. Random Forest Multi-Hazard Classification",
      tag: "AI Ensemble",
      icon: Layers,
      summary: "Ensemble decision forest generating susceptibility probability and discrete risk tiers.",
      details: "Combines 7 conditioning variables (slope, rainfall, river distance, elevation, drainage density, geology, seismic intensity, and WoE scores) across 100 decision trees to output non-linear hazard susceptibility probability (0.0 to 1.0) and categorize into LOW, MODERATE, HIGH, or CRITICAL.",
      formula: "\\hat{y} = \\frac{1}{B} \\sum_{b=1}^B T_b(x) \\implies \\text{Risk Score} = \\hat{y} \\times 100"
    },
    {
      id: 4,
      title: "4. Explainable AI (TreeSHAP)",
      tag: "Model Transparency",
      icon: Sparkles,
      summary: "Game-theoretic Shapley feature attribution explaining why any specific zone is classified as Critical.",
      details: "TreeSHAP calculates exact marginal contributions of each environmental factor relative to the district average base value, producing a waterfall breakdown and natural language explanation for disaster management executives.",
      formula: "\\phi_i = \\sum_{S \\subseteq F \\setminus \\{i\\}} \\frac{|S|!(|F| - |S| - 1)!}{|F|!} \\left[ f(S \\cup \\{i\\}) - f(S) \\right]"
    },
    {
      id: 5,
      title: "5. Carrying Capacity Engine (PCC → RCC → ECC)",
      tag: "Urban & Relief Planning",
      icon: Users,
      summary: "Three-tier carrying capacity filtering for candidate resettlement townships.",
      details: "Computes Physical Carrying Capacity (PCC) from usable land area and minimum standard (30 m²/person), reduces it by terrain slope and flood buffer constraints (RCC), and adjusts for medical, sanitation, and road access delivery limits to yield Effective Carrying Capacity (ECC).",
      formula: "\\text{PCC} = \\frac{A}{a_{std}}, \\quad \\text{RCC} = \\text{PCC} \\times \\prod C_f, \\quad \\text{ECC} = \\text{RCC} \\times M_f"
    },
    {
      id: 6,
      title: "6. GIS-MCDA + AHP Weighted Overlay",
      tag: "Decision Science",
      icon: Compass,
      summary: "Analytic Hierarchy Process multi-criteria evaluation with Saaty consistency ratio check (CR < 0.10).",
      details: "Calculates principal eigenvector weights across 7 criteria (Hazard Avoidance 25%, PSInSAR Stability 20%, Road Access 15%, Water 10%, Health 10%, Infrastructure 10%, Land Capacity 10%) and validates matrix consistency (CR < 0.10).",
      formula: "CI = \\frac{\\lambda_{max} - n}{n - 1}, \\quad CR = \\frac{CI}{RI} < 0.10, \\quad S = \\sum_{i=1}^n w_i x_i"
    },
    {
      id: 7,
      title: "7. Field Verification & Closed-Loop Sync",
      tag: "Operations & NDRF",
      icon: Smartphone,
      summary: "Offline-first mobile GIS app for ground truthing, fissure measurements, and telemetry feedback.",
      details: "Field officers record GPS-tagged damage assessments and crack depths in offline queue mode, syncing with the central PostGIS database when cellular connection is restored to update hazard models and verify relocation decisions.",
      formula: "\\text{DETECT} \\to \\text{ASSESS} \\to \\text{PREDICT} \\to \\text{CALCULATE} \\to \\text{FIND} \\to \\text{RANK} \\to \\text{VERIFY}"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center gap-3.5 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-white/10 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <BookOpen className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-white">ZoneGuard AI Scientific Methodology</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-End Disaster Decision Support Architecture: Mathematical Principles & Algorithmic Foundations
          </p>
        </div>
      </div>

      {/* Interactive Workflow Diagram Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[760px] gap-2">
          {steps.map((st, i) => {
            const Icon = st.icon;
            const isActive = activeStep === i;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStep(i)}
                className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-lg' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span className="text-[9px] font-mono font-bold text-slate-400">STEP {st.id}</span>
                </div>
                <div className="text-xs font-bold text-white truncate">{st.title.split('. ')[1]}</div>
                <div className="text-[10px] text-slate-400">{st.tag}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Deep Dive Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
              {steps[activeStep].tag}
            </span>
            <h3 className="text-lg font-bold text-white mt-1.5">{steps[activeStep].title}</h3>
          </div>
          <div className="text-xs font-mono text-slate-400">Step {activeStep + 1} of {steps.length}</div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {steps[activeStep].summary}
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-cyan-300 uppercase font-mono text-[10px]">Technical Implementation & Processing:</div>
          <p className="leading-relaxed">{steps[activeStep].details}</p>
        </div>

        {/* Mathematical Equation Box */}
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs font-mono">
          <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">Mathematical Formulation:</div>
          <div className="p-2.5 rounded bg-slate-950 text-cyan-200 font-bold text-sm tracking-wide overflow-x-auto">
            {steps[activeStep].formula}
          </div>
        </div>

        {/* Step Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-300 transition-colors"
          >
            ← Previous Step
          </button>

          <button
            onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={activeStep === steps.length - 1}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-colors"
          >
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
}
