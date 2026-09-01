import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  Activity, 
  MapPin, 
  Users, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Filter, 
  Search, 
  Compass, 
  Flame, 
  Waves, 
  Mountain, 
  Wind, 
  Zap, 
  FileText, 
  Sliders, 
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { api } from '../utils/api';

export default function RedZoneExplorer({ onOpenShap, onOpenReport, onOpenRelocationView }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedHazard, setSelectedHazard] = useState('ALL');
  const [selectedZoneDetail, setSelectedZoneDetail] = useState(null);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await api.getZones().catch(() => []);
      const validZones = Array.isArray(data) ? data : [];
      setZones(validZones);
      if (validZones.length > 0) {
        setSelectedZoneDetail(validZones[0]);
      }
    } catch (e) {
      console.error("Error loading hazard red zones:", e);
    } finally {
      setLoading(false);
    }
  };

  // State filtering logic
  const filteredZones = zones.filter(z => {
    const matchesSearch = 
      z.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.recommended_action?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState = 
      selectedState === 'ALL' || 
      z.name?.toLowerCase().includes(selectedState.toLowerCase());

    const matchesHazard = 
      selectedHazard === 'ALL' ||
      (selectedHazard === 'LANDSLIDE' && (z.name?.toLowerCase().includes('landslide') || z.name?.toLowerCase().includes('slope') || z.name?.toLowerCase().includes('escarpment'))) ||
      (selectedHazard === 'SUBSIDENCE' && (z.name?.toLowerCase().includes('subsidence') || z.name?.toLowerCase().includes('fissure') || z.deformation_rate > 15)) ||
      (selectedHazard === 'FLOOD' && (z.name?.toLowerCase().includes('flood') || z.name?.toLowerCase().includes('riverine') || z.distance_to_river < 100)) ||
      (selectedHazard === 'CYCLONE' && (z.name?.toLowerCase().includes('cyclone') || z.name?.toLowerCase().includes('surge') || z.name?.toLowerCase().includes('coastal'))) ||
      (selectedHazard === 'SEISMIC' && (z.name?.toLowerCase().includes('seismic') || z.name?.toLowerCase().includes('fault')));

    return matchesSearch && matchesState && matchesHazard;
  });

  // Calculate stats
  const totalCritical = zones.filter(z => z.risk_level === 'CRITICAL').length;
  const totalHigh = zones.filter(z => z.risk_level === 'HIGH').length;
  const totalPopRisk = zones.reduce((acc, z) => acc + (z.population || 0), 0);
  const maxDeformZone = zones.reduce((max, z) => (z.deformation_rate > (max?.deformation_rate || 0) ? z : max), null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-700 shadow-sm">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-heading text-slate-950">Pan-India Hazard Red Zones & Precaution Matrix</h2>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                Live Situation Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Current Geomorphic Status, Satellite InSAR Velocity, Ground Truth Cracks & Engineering Precaution Models
            </p>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-2xl text-center">
            <span className="text-[10px] font-mono font-bold text-red-700 block uppercase">Critical Zones</span>
            <span className="text-base font-black text-red-900">{totalCritical}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-2xl text-center">
            <span className="text-[10px] font-mono font-bold text-amber-700 block uppercase">High Risk</span>
            <span className="text-base font-black text-amber-900">{totalHigh}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl text-center">
            <span className="text-[10px] font-mono font-bold text-slate-600 block uppercase">Total Population at Risk</span>
            <span className="text-base font-black text-slate-950">{totalPopRisk.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by zone code, location, or precaution model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-slate-950"
          />
        </div>

        {/* State / Disaster Region Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> State:
          </span>
          {[
            { id: 'ALL', label: 'All India' },
            { id: 'Tamil Nadu', label: 'Tamil Nadu' },
            { id: 'Uttarakhand', label: 'Uttarakhand' },
            { id: 'Kerala', label: 'Kerala' },
            { id: 'Himachal', label: 'Himachal' },
            { id: 'Odisha', label: 'Odisha' },
            { id: 'Assam', label: 'Assam' },
            { id: 'Gujarat', label: 'Gujarat' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedState(st.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedState === st.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Hazard Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Hazard:
          </span>
          {[
            { id: 'ALL', label: 'All Hazards' },
            { id: 'LANDSLIDE', label: '🏔️ Landslide' },
            { id: 'SUBSIDENCE', label: '🏚️ Subsidence' },
            { id: 'FLOOD', label: '🌊 Flood' },
            { id: 'CYCLONE', label: '🌀 Cyclone' },
            { id: 'SEISMIC', label: '🌍 Seismic' }
          ].map(hz => (
            <button
              key={hz.id}
              onClick={() => setSelectedHazard(hz.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedHazard === hz.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              }`}
            >
              {hz.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout: Left List of Red Zones, Right Deep Situation & Precaution Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Red Zone Areas List */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredZones.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 text-center text-slate-500 text-xs font-semibold">
              No red zones match the selected filter. Try adjusting your query.
            </div>
          ) : (
            filteredZones.map(zone => {
              const isSelected = selectedZoneDetail?.code === zone.code;
              const isCritical = zone.risk_level === 'CRITICAL';
              const isDeforming = zone.deformation_rate > 10;

              return (
                <div
                  key={zone.code}
                  onClick={() => setSelectedZoneDetail(zone)}
                  className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-50 border-red-500 shadow-lg ring-2 ring-red-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-950 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-300">
                        {zone.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isCritical ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {zone.risk_level} RISK
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-red-600 font-mono">
                        Score: {zone.risk_score}/100
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-slate-950 mt-2 line-clamp-1">
                    {zone.name}
                  </h3>

                  {/* Current Situation Preview */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Deformation:</span>
                      <strong className={isDeforming ? 'text-red-700 font-black' : 'text-slate-900'}>
                        +{zone.deformation_rate} mm/yr
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Population:</span>
                      <strong className="text-slate-900 font-bold">{zone.population.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Slope:</span>
                      <strong className="text-amber-800 font-bold">{zone.slope}°</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 truncate max-w-[280px]">
                      🛡️ {zone.recommended_action?.split('(')[0] || 'Relocation Planning Active'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (7 Cols): Comprehensive Situation & Precautionary Model */}
        <div className="lg:col-span-7">
          {selectedZoneDetail ? (
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-xl space-y-6">
              {/* Header Details */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                      {selectedZoneDetail.code}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Lat: {selectedZoneDetail.center_lat?.toFixed(4)}°, Lng: {selectedZoneDetail.center_lng?.toFixed(4)}°
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-950 font-heading mt-1">
                    {selectedZoneDetail.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenShap && onOpenShap(selectedZoneDetail.code)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain AI (SHAP)</span>
                  </button>
                  <button
                    onClick={() => onOpenReport && onOpenReport(selectedZoneDetail.code)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>DM Action SOP</span>
                  </button>
                </div>
              </div>

              {/* 1. CURRENT SITUATION & GEOMORPHIC DIAGNOSIS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-600" />
                  <h4 className="text-sm font-black text-slate-950 uppercase tracking-wide">
                    1. Current Ground Situation & Multi-Sensor Telemetry
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200">
                    <span className="text-[10px] font-mono font-bold uppercase text-red-800">InSAR Velocity</span>
                    <div className="text-xl font-black text-red-700 mt-0.5">
                      +{selectedZoneDetail.deformation_rate} <span className="text-xs font-normal">mm/yr</span>
                    </div>
                    <span className="text-[10px] text-red-800 font-bold">Sentinel-1 LOS</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-800">Slope Gradient</span>
                    <div className="text-xl font-black text-amber-700 mt-0.5">
                      {selectedZoneDetail.slope}°
                    </div>
                    <span className="text-[10px] text-amber-800 font-bold">Cartosat 10m DEM</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-[10px] font-mono font-bold uppercase text-blue-800">Annual Rainfall</span>
                    <div className="text-xl font-black text-blue-700 mt-0.5">
                      {selectedZoneDetail.rainfall} <span className="text-xs font-normal">mm</span>
                    </div>
                    <span className="text-[10px] text-blue-800 font-bold">Saturation Index</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-600">Buildings Exposed</span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedZoneDetail.buildings || 480}
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold">{selectedZoneDetail.population.toLocaleString()} Residents</span>
                  </div>
                </div>

                {/* Ground Truth Status Text */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-1.5 font-medium text-slate-800">
                  <div className="font-black text-slate-950 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-red-600" />
                    <span>Ground Truth Diagnostic Summary:</span>
                  </div>
                  <p>
                    Continuous sub-surface shear deformation detected along scarp boundary. High pore-water pressure accumulation observed during monsoon precipitation peaks. Distance to primary drainage basin is <strong>{selectedZoneDetail.distance_to_river} meters</strong> at an elevation of <strong>{selectedZoneDetail.elevation} m MSL</strong>.
                  </p>
                </div>
              </div>

              {/* 2. SUGGESTED AI & ENGINEERING PRECAUTION MODELS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-black text-slate-950 uppercase tracking-wide">
                    2. Suggested Precautionary Decision Models
                  </h4>
                </div>

                <div className="space-y-3">
                  {/* Precaution Model 1: Pre-Disaster Relocation */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5 font-heading">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Model 1: Pre-Disaster Relocation Protocol (AHP-MCDA)
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                        High Feasibility
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      <strong>Action:</strong> {selectedZoneDetail.recommended_action}. Target community will be accommodated in designated stable tablelands meeting verified environmental and civic carrying capacity standards.
                    </p>
                    <button
                      onClick={() => onOpenRelocationView && onOpenRelocationView(selectedZoneDetail.code)}
                      className="mt-1 flex items-center gap-1.5 text-xs font-black text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      <span>Open Safe Relocation Planner & Carrying Capacity Match</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Precaution Model 2: Geotechnical Slope Stabilization */}
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 font-heading">
                        <Mountain className="w-4 h-4 text-amber-700" />
                        Model 2: Geotechnical Engineering Intervention
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        Structural Protection
                      </span>
                    </div>
                    <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside font-medium">
                      <li>Install horizontal sub-horizontal drainage pipes to relieve trapped hydrostatic pressure.</li>
                      <li>Deploy double-twisted steel wire mesh with rock bolts & self-drilling anchors on scarp faces.</li>
                      <li>Construct reinforced concrete toe crib walls along critical transport corridors.</li>
                    </ul>
                  </div>

                  {/* Precaution Model 3: Automated Hydro-Radar Early Warning */}
                  <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-950 flex items-center gap-1.5 font-heading">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Model 3: Dynamic Multi-Sensor Early Warning Trigger
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                        Early Warning Alert
                      </span>
                    </div>
                    <p className="text-xs text-blue-950 leading-relaxed font-medium">
                      Trigger automated emergency sirens if cumulative 24-hour rainfall exceeds <strong>120 mm</strong> or PSInSAR velocity accelerates past <strong>20 mm/year</strong>. Auto-dispatch SMS advisories to all registered village headpersons.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border-2 border-slate-200 text-center text-slate-500 font-medium">
              Select a hazard red zone from the left list to view detailed situation and precautionary models.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
