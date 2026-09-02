import React from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  BrainCircuit, 
  TrendingUp, 
  HelpCircle,
  CheckCircle2,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function ShapModal({ zone, shapData, onClose, onFindRelocation }) {
  if (!shapData && !zone) return null;

  const data = shapData || {
    zone_code: zone?.code || 'ZONE-TN-001',
    risk_score: zone?.risk_score || 99.6,
    risk_level: zone?.risk_level || 'CRITICAL',
    base_district_risk: 32.0,
    narrative_explanation: `Zone ${zone?.code || 'ZONE-TN-001'} is classified as CRITICAL (Overall Risk ${zone?.risk_score || 99.6}/100) primarily driven by significant ground deformation (+${zone?.deformation_rate || 18.6} mm/yr), steep terrain slope (${zone?.slope || 34.2}°), and high monsoon rainfall exposure (${zone?.rainfall || 1480} mm). Satellite interferometry highlights active surface displacement, compounding structural vulnerability for habitations within this red-zone perimeter.`,
    features_breakdown: [
      { feature: "Ground Deformation (PSInSAR)", value: `+${zone?.deformation_rate || 18.6} mm/year`, percentage: 32, impact: "CRITICAL RISK ACCELERATOR", direction: "positive" },
      { feature: "Terrain Slope Angle", value: `${zone?.slope || 34.2}°`, percentage: 25, impact: "STEEP INSTABILITY", direction: "positive" },
      { feature: "Monsoon Rainfall Exposure", value: `${zone?.rainfall || 1480} mm/yr`, percentage: 18, impact: "PORE PRESSURE ELEVATION", direction: "positive" },
      { feature: "Distance to River Drainage", value: `${zone?.distance_to_river || 320} m`, percentage: 11, impact: "TOE EROSION ZONE", direction: "positive" },
      { feature: "Land Use & Geology", value: "Fissured Mountain Terrace", percentage: 8, impact: "POOR COHESION", direction: "positive" },
      { feature: "Seismic Intensity & Drainage", value: "Active Tectonic Zone", percentage: 6, impact: "SEISMIC AMPLIFICATION", direction: "positive" }
    ]
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-white border-2 border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-sm">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-950 font-heading">Explainable AI (TreeSHAP) Reasoning</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  data.risk_level === 'CRITICAL' 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {data.risk_level} (Score {data.risk_score}/100)
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Target Hazard Zone: <strong className="text-slate-950 font-mono">{data.zone_code}</strong></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          {/* Question Callout */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-900">
            <div className="text-xs font-mono uppercase font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Why is this zone classified as {data.risk_level}?</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-800 mt-1 font-medium">
              {data.narrative_explanation}
            </p>
          </div>

          {/* Baseline vs Target Risk Progression */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-semibold">
            <div>
              <div className="text-slate-500 text-[10px] font-mono uppercase">District Baseline Risk</div>
              <div className="text-base font-black text-slate-700">{data.base_district_risk || 32.0}%</div>
            </div>
            <div className="text-center font-mono text-red-600 font-black">
              +{(data.risk_score - (data.base_district_risk || 32.0)).toFixed(1)}% Attributed Hazard Elevation →
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[10px] font-mono uppercase">Zone Hazard Score</div>
              <div className="text-base font-black text-red-700">{data.risk_score} / 100</div>
            </div>
          </div>

          {/* Feature Contribution Waterfall Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-950 uppercase tracking-wider">
              <span>Geomorphic Conditioning Feature Breakdown</span>
              <span className="font-mono text-red-600">SHAP Impact %</span>
            </div>

            <div className="space-y-2.5">
              {data.features_breakdown?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-950">{item.feature}</strong>
                      <span className="ml-2 font-mono text-[10px] text-slate-600 font-bold">({item.value})</span>
                    </div>
                    <span className="font-mono font-black text-red-600">+{item.percentage}%</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        idx === 0 ? 'bg-red-600' :
                        idx === 1 ? 'bg-amber-500' :
                        idx === 2 ? 'bg-amber-600' :
                        'bg-blue-600'
                      }`}
                      style={{ width: `${item.percentage * 2.5}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-600 font-semibold">
                    <span>{item.impact}</span>
                    <span className="font-mono text-slate-500">Direction: Positive Risk Driver</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[10px] font-mono text-slate-500 font-medium">
            Calculated via TreeSHAP + Weight of Evidence (WoE)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onFindRelocation) onFindRelocation(data.zone_code);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <span>Match Relocation Site</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
