import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Info, 
  ArrowRight, 
  Activity,
  Layers,
  MapPin,
  TrendingDown
} from 'lucide-react';
import { api } from '../utils/api';

export default function CarryingCapacityStudio({ onApplyToPlanner }) {
  // Preset Site selection
  const [selectedPreset, setSelectedPreset] = useState('SITE-07');
  
  // Interactive parameters
  const [params, setParams] = useState({
    usable_area_sqm: 150000,
    min_area_per_person: 30,
    slope_deg: 6.8,
    distance_to_water_m: 80,
    road_access_score: 94,
    medical_score: 88,
    sanitation_score: 85,
    target_population: 2840 // Demand from ZONE-RZ-014
  });

  const [capacityResult, setCapacityResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Recalculate whenever params change
  useEffect(() => {
    calculateCapacity();
  }, [params]);

  const calculateCapacity = async () => {
    try {
      setLoading(true);
      const res = await api.calculateCarryingCapacity(params);
      setCapacityResult(res);
    } catch (e) {
      console.error("Error calculating carrying capacity:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    if (preset === 'SITE-07') {
      setParams(prev => ({
        ...prev,
        usable_area_sqm: 150000,
        slope_deg: 6.8,
        road_access_score: 94,
        medical_score: 88,
        sanitation_score: 85,
        target_population: 2840
      }));
    } else if (preset === 'SITE-04') {
      setParams(prev => ({
        ...prev,
        usable_area_sqm: 95000,
        slope_deg: 4.5,
        road_access_score: 96,
        medical_score: 92,
        sanitation_score: 90,
        target_population: 2840
      }));
    } else if (preset === 'SITE-11') {
      setParams(prev => ({
        ...prev,
        usable_area_sqm: 140000,
        slope_deg: 7.5,
        road_access_score: 88,
        medical_score: 94,
        sanitation_score: 92,
        target_population: 2840
      }));
    }
  };

  const isAdequate = (capacityResult?.surplus_deficit || 0) >= 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-heading text-slate-950">Carrying Capacity Assessment Studio</h2>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                Safe Population Limits Analysis
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Gross Footprint, Environmental Setbacks, and Essential Civic Infrastructure Capacity Limits
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 font-mono font-bold">Candidate Safe Township:</span>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-300">
            {['SITE-07', 'SITE-04', 'SITE-11'].map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedPreset === preset 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white'
                }`}
              >
                {preset === 'SITE-07' ? 'SITE-07 (Mettupalayam)' : preset === 'SITE-04' ? 'SITE-04 (Karamadai)' : 'SITE-11 (Annur)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Pipeline Progression (Stage 1 -> Stage 2 -> Stage 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1: Gross Usable Area */}
        <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-lg relative overflow-hidden">
          <div className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-600">Stage 1 • Gross Physical Capacity</div>
          <div className="text-xs font-bold text-slate-800 mt-0.5">Unconstrained Spatial Footprint</div>
          <div className="text-3xl font-black text-slate-950 mt-3">{capacityResult?.pcc?.toLocaleString() || 5000}</div>
          <div className="text-xs text-slate-600 mt-1">Maximum theoretical population for gross land parcel</div>
          <div className="mt-3 text-[11px] font-mono text-slate-800 font-bold border-t border-slate-200 pt-2">
            {params.usable_area_sqm.toLocaleString()} m² @ {params.min_area_per_person} m²/person standard
          </div>
        </div>

        {/* Stage 2: Environmental & Topographic Threshold */}
        <div className="p-6 rounded-3xl bg-amber-50/70 border-2 border-amber-300 shadow-lg relative overflow-hidden">
          <div className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-800">Stage 2 • Environmental Threshold</div>
          <div className="text-xs font-bold text-amber-800 mt-0.5">Slope Gradient & Flood Buffer Deductions</div>
          <div className="text-3xl font-black text-amber-800 mt-3">{capacityResult?.rcc?.toLocaleString() || 3900}</div>
          <div className="text-xs text-slate-700 mt-1">Hazard-safe buildable terrain exclusion applied</div>
          <div className="mt-3 text-[11px] font-mono text-amber-900 font-bold border-t border-amber-200 pt-2 flex justify-between">
            <span>Terrain Stability: {(capacityResult?.intermediate_factors?.slope_factor * 100 || 88).toFixed(0)}%</span>
            <span>Drainage Clearance: {(capacityResult?.intermediate_factors?.water_factor * 100 || 90).toFixed(0)}%</span>
          </div>
        </div>

        {/* Stage 3: Operational Capacity */}
        <div className="p-6 rounded-3xl bg-emerald-50/80 border-2 border-emerald-400 shadow-xl relative overflow-hidden">
          <div className="text-[11px] font-mono font-black uppercase tracking-wider text-emerald-800">Stage 3 • Verified Habitable Capacity</div>
          <div className="text-xs font-bold text-emerald-800 mt-0.5">Civic Services & Evacuation Access Ready</div>
          <div className="text-3xl font-black text-emerald-700 mt-3">{capacityResult?.ecc?.toLocaleString() || 3198}</div>
          <div className="text-xs text-emerald-900 font-bold mt-1">Final approved safe citizens quota for relocation</div>
          <div className="mt-3 text-[11px] font-mono text-emerald-900 font-bold border-t border-emerald-200 pt-2 flex justify-between">
            <span>Road Access: {(capacityResult?.intermediate_factors?.road_factor * 100 || 85).toFixed(0)}%</span>
            <span>Health & Water: {(capacityResult?.intermediate_factors?.health_factor * 100 || 96).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid: Sliders on Left + Decision Outcome on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-xl space-y-5">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Interactive Capacity Calibration Sandbox</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Usable Area Slider */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-bold">Usable Plateau Area (m²):</span>
                <strong className="text-amber-800 font-mono font-black">{params.usable_area_sqm.toLocaleString()} m²</strong>
              </div>
              <input
                type="range"
                min="40000"
                max="250000"
                step="5000"
                value={params.usable_area_sqm}
                onChange={(e) => setParams({ ...params, usable_area_sqm: parseFloat(e.target.value) })}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Min Area per Person */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-bold">Min Area Standard (m²/person):</span>
                <strong className="text-amber-800 font-mono font-black">{params.min_area_per_person} m²</strong>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="2"
                value={params.min_area_per_person}
                onChange={(e) => setParams({ ...params, min_area_per_person: parseFloat(e.target.value) })}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Slope Angle */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-bold">Terrain Slope Angle (°):</span>
                <strong className="text-amber-800 font-mono font-black">{params.slope_deg}°</strong>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="0.5"
                value={params.slope_deg}
                onChange={(e) => setParams({ ...params, slope_deg: parseFloat(e.target.value) })}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Highway Road Access */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-bold">Road Network Access Score:</span>
                <strong className="text-emerald-700 font-mono font-black">{params.road_access_score}/100</strong>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={params.road_access_score}
                onChange={(e) => setParams({ ...params, road_access_score: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Medical Care Score */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-bold">Medical Facilities Readiness:</span>
                <strong className="text-emerald-700 font-mono font-black">{params.medical_score}/100</strong>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={params.medical_score}
                onChange={(e) => setParams({ ...params, medical_score: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Sanitation Score */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-bold">Sanitation & Drainage Readiness:</span>
                <strong className="text-emerald-700 font-mono font-black">{params.sanitation_score}/100</strong>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={params.sanitation_score}
                onChange={(e) => setParams({ ...params, sanitation_score: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Right Card: Allocation Assessment */}
        <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-950">Capacity Adequacy Assessment</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                isAdequate ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
              }`}>
                {capacityResult?.capacity_status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-semibold">Demand (Target Population):</span>
                <strong className="text-slate-950 font-mono font-black">{params.target_population.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 font-semibold">Effective Capacity (ECC):</span>
                <strong className="text-emerald-700 font-mono font-black">{capacityResult?.ecc?.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm">
                <span className="font-bold text-slate-900">Surplus / Deficit:</span>
                <strong className={`font-mono text-base font-black ${isAdequate ? 'text-emerald-700' : 'text-red-600'}`}>
                  {capacityResult?.surplus_deficit > 0 ? `+${capacityResult?.surplus_deficit}` : capacityResult?.surplus_deficit} persons
                </strong>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border-2 text-xs shadow-sm ${
              isAdequate 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                : 'bg-red-50 border-red-300 text-red-950'
            }`}>
              <div className="font-black mb-1.5 flex items-center gap-2 text-sm">
                {isAdequate ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                <span>{isAdequate ? 'Site Capacity Confirmed' : 'Site Overburdened'}</span>
              </div>
              <p className="text-xs leading-relaxed font-semibold">{capacityResult?.recommendation}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] text-slate-700 space-y-1 font-medium">
            <div><strong className="text-slate-950">NDMA Standard:</strong> 30 m²/person minimum gross relocation space.</div>
            <div><strong className="text-amber-800">TNDMA Relief Buffer:</strong> 10% spare margin recommended.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
