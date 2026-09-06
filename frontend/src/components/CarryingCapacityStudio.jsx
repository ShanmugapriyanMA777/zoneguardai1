import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingDown,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { api, calculateClientCarryingCapacity } from '../utils/api';
import fallbackData from '../data/fallbackData.json';

export default function CarryingCapacityStudio({ 
  initialSiteCode = 'SITE-07', 
  targetPop = 2840,
  onApplyToPlanner 
}) {
  const sitesList = fallbackData.relocation_sites || [];
  const zonesList = fallbackData.zones || [];

  // Find initial site data
  const initialSite = sitesList.find(s => s.code === initialSiteCode) || sitesList[0] || {
    code: 'SITE-07',
    name: 'Mettupalayam Safe Plateau Relocation Township (Nilgiris Foothills, TN)',
    usable_area_sqm: 220000,
    slope: 4.8,
    road_access_score: 90,
    water_availability_score: 88,
    healthcare_access_score: 85,
    existing_infra_score: 80
  };

  const [selectedSiteCode, setSelectedSiteCode] = useState(initialSite.code);
  const [selectedZoneCode, setSelectedZoneCode] = useState('ZONE-TN-001');

  // Interactive parameters
  const [params, setParams] = useState({
    usable_area_sqm: initialSite.usable_area_sqm || 220000,
    min_area_per_person: 30,
    slope_deg: initialSite.slope || 4.8,
    distance_to_water_m: 80,
    water_availability_score: initialSite.water_availability_score || 88,
    road_access_score: initialSite.road_access_score || 90,
    medical_score: initialSite.healthcare_access_score || 85,
    sanitation_score: initialSite.existing_infra_score || 80,
    target_population: targetPop || 2840
  });

  // Always initialize synchronously so there is NEVER an empty or broken assessment state
  const [capacityResult, setCapacityResult] = useState(() => calculateClientCarryingCapacity(params));
  const [loading, setLoading] = useState(false);

  // Recalculate whenever params change
  useEffect(() => {
    // Instant zero-latency update locally
    const clientCalc = calculateClientCarryingCapacity(params);
    setCapacityResult(clientCalc);

    // Also attempt server sync if backend is active
    let isCurrent = true;
    api.calculateCarryingCapacity(params)
      .then(res => {
        if (isCurrent && res && res.ecc) {
          setCapacityResult(res);
        }
      })
      .catch(() => {
        // Already handled by clientCalc
      });

    return () => { isCurrent = false; };
  }, [params]);

  // When a candidate haven is selected
  const handleSiteSelect = (siteCode) => {
    setSelectedSiteCode(siteCode);
    const site = sitesList.find(s => s.code === siteCode);
    if (site) {
      setParams(prev => ({
        ...prev,
        usable_area_sqm: site.usable_area_sqm || 180000,
        slope_deg: site.slope || 5.0,
        road_access_score: site.road_access_score || 88,
        medical_score: site.healthcare_access_score || 85,
        sanitation_score: site.existing_infra_score || 82,
        water_availability_score: site.water_availability_score || 85
      }));
    }
  };

  // When source red zone is changed
  const handleZoneSelect = (zCode) => {
    setSelectedZoneCode(zCode);
    const zone = zonesList.find(z => z.code === zCode);
    if (zone && zone.population) {
      setParams(prev => ({
        ...prev,
        target_population: zone.population
      }));
    }
  };

  const isAdequate = (capacityResult?.surplus_deficit ?? 0) >= 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900 select-none">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-heading text-slate-950">Carrying Capacity Assessment Studio</h2>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                PCC ➔ RCC ➔ ECC Multi-Tier Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Quantifying Physical Footprint, Slope Exclusions, and Service Bandwidth for Safe Settlement Relocation
            </p>
          </div>
        </div>

        {/* Site Preset Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 font-mono font-bold">Candidate Haven:</span>
          <select
            value={selectedSiteCode}
            onChange={(e) => handleSiteSelect(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 border-2 border-slate-300 text-xs font-black text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {sitesList.map(s => (
              <option key={s.code} value={s.code}>
                {s.code} - {s.name.split('(')[0]} (ECC: {s.ecc?.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Red Zone Demand Linker Strip */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 via-amber-50 to-emerald-50 border-2 border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-red-600" />
          <span className="font-bold text-slate-900 uppercase font-mono">
            Evacuation Demand Source Zone:
          </span>
          <select
            value={selectedZoneCode}
            onChange={(e) => handleZoneSelect(e.target.value)}
            className="px-3 py-1 rounded-lg bg-white border border-slate-300 font-bold text-slate-900 cursor-pointer"
          >
            {zonesList.map(z => (
              <option key={z.code} value={z.code}>
                {z.code} - {z.name.split('(')[0]} (Pop: {z.population?.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-slate-600 font-semibold">Allocating to: <strong className="text-emerald-700">{selectedSiteCode}</strong></span>
          <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 font-black text-slate-900">
            Demand: {params.target_population.toLocaleString()} citizens
          </span>
        </div>
      </div>

      {/* Visual Pipeline Progression (Stage 1 -> Stage 2 -> Stage 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1: Gross Usable Area */}
        <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-lg relative overflow-hidden">
          <div className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-600">
            Stage 1 • Gross Physical Capacity (PCC)
          </div>
          <div className="text-xs font-bold text-slate-800 mt-0.5">Unconstrained Spatial Footprint</div>
          <div className="text-3xl font-black text-slate-950 mt-3">
            {capacityResult?.pcc?.toLocaleString() || Math.round(params.usable_area_sqm / params.min_area_per_person).toLocaleString()}
          </div>
          <div className="text-xs text-slate-600 mt-1">Maximum theoretical population for gross usable land</div>
          <div className="mt-3 text-[11px] font-mono text-slate-800 font-bold border-t border-slate-200 pt-2 flex justify-between">
            <span>{params.usable_area_sqm.toLocaleString()} m² Usable</span>
            <span>@{params.min_area_per_person} m²/person</span>
          </div>
        </div>

        {/* Stage 2: Environmental & Topographic Threshold */}
        <div className="p-6 rounded-3xl bg-amber-50/70 border-2 border-amber-300 shadow-lg relative overflow-hidden">
          <div className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-800">
            Stage 2 • Real Carrying Capacity (RCC)
          </div>
          <div className="text-xs font-bold text-amber-800 mt-0.5">Slope & Drainage Exclusions Applied</div>
          <div className="text-3xl font-black text-amber-800 mt-3">
            {capacityResult?.rcc?.toLocaleString() || Math.round(params.usable_area_sqm * 0.78 / params.min_area_per_person).toLocaleString()}
          </div>
          <div className="text-xs text-slate-700 mt-1">Topographic and geotechnical hazard buffer deducted</div>
          <div className="mt-3 text-[11px] font-mono text-amber-900 font-bold border-t border-amber-200 pt-2 flex justify-between">
            <span>Slope Factor: {((capacityResult?.intermediate_factors?.slope_factor ?? 0.88) * 100).toFixed(0)}%</span>
            <span>Correction: {capacityResult?.correction_factor || 0.85}x</span>
          </div>
        </div>

        {/* Stage 3: Operational Capacity */}
        <div className="p-6 rounded-3xl bg-emerald-50/80 border-2 border-emerald-400 shadow-xl relative overflow-hidden">
          <div className="text-[11px] font-mono font-black uppercase tracking-wider text-emerald-800">
            Stage 3 • Effective Carrying Capacity (ECC)
          </div>
          <div className="text-xs font-bold text-emerald-800 mt-0.5">Civic Services & Road Transit Ready</div>
          <div className="text-3xl font-black text-emerald-700 mt-3">
            {capacityResult?.ecc?.toLocaleString() || Math.round(params.usable_area_sqm * 0.65 / params.min_area_per_person).toLocaleString()}
          </div>
          <div className="text-xs text-emerald-900 font-bold mt-1">Final approved safe citizens quota for relocation</div>
          <div className="mt-3 text-[11px] font-mono text-emerald-900 font-bold border-t border-emerald-200 pt-2 flex justify-between">
            <span>Road Bandwidth: {((capacityResult?.intermediate_factors?.road_factor ?? 0.90) * 100).toFixed(0)}%</span>
            <span>Mgmt Factor: {capacityResult?.management_factor || 0.89}x</span>
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid: Sliders on Left + Decision Outcome on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Interactive Carrying Capacity Sandbox</span>
            </h3>
            <span className="text-[11px] font-mono font-bold text-slate-500">Real-Time Geotechnical Calibration</span>
          </div>

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
                max="300000"
                step="5000"
                value={params.usable_area_sqm}
                onChange={(e) => setParams(prev => ({ ...prev, usable_area_sqm: parseFloat(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
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
                step="1"
                value={params.min_area_per_person}
                onChange={(e) => setParams(prev => ({ ...prev, min_area_per_person: parseFloat(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
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
                min="1"
                max="25"
                step="0.5"
                value={params.slope_deg}
                onChange={(e) => setParams(prev => ({ ...prev, slope_deg: parseFloat(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
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
                onChange={(e) => setParams(prev => ({ ...prev, road_access_score: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
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
                onChange={(e) => setParams(prev => ({ ...prev, medical_score: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
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
                onChange={(e) => setParams(prev => ({ ...prev, sanitation_score: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Card: Allocation Assessment */}
        <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-950">Capacity Adequacy Assessment</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border shadow-xs ${
                isAdequate 
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                  : 'bg-red-100 text-red-900 border-red-300'
              }`}>
                {capacityResult?.capacity_status || (isAdequate ? 'ADEQUATE' : 'DEFICIT')}
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
              <div className={`flex justify-between p-3 rounded-2xl border-2 shadow-sm ${
                isAdequate ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
              }`}>
                <span className="font-bold text-slate-900">Surplus / Deficit:</span>
                <strong className={`font-mono text-base font-black ${isAdequate ? 'text-emerald-700' : 'text-red-600'}`}>
                  {Number(capacityResult?.surplus_deficit) >= 0 ? `+${capacityResult?.surplus_deficit?.toLocaleString()}` : `${capacityResult?.surplus_deficit?.toLocaleString()}`} persons
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
              <p className="text-xs leading-relaxed font-semibold">
                {capacityResult?.recommendation || (isAdequate 
                  ? 'Capacity satisfies relocation demand with safety buffer.' 
                  : 'Site has a deficit. Multi-site distribution or modular staging required.')}
              </p>
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
