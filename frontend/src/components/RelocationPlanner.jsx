import React, { useState, useEffect, useMemo } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  RotateCcw, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  Layers, 
  Info,
  MapPin,
  TrendingUp,
  Navigation,
  Users,
  Building
} from 'lucide-react';
import { api } from '../utils/api';

export default function RelocationPlanner({ selectedZone, onSelectSiteForReport }) {
  const [sites, setSites] = useState([]);
  const [zones, setZones] = useState([]);
  const [ahpData, setAhpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeZoneCode, setActiveZoneCode] = useState(selectedZone?.code || 'ZONE-TN-001');

  // Sync if selectedZone changes from outside
  useEffect(() => {
    if (selectedZone?.code) {
      setActiveZoneCode(selectedZone.code);
    }
  }, [selectedZone]);

  // Dynamic AHP Criteria Weights State
  const [customWeights, setCustomWeights] = useState({
    hazard_safety: 25,
    ground_stability: 20,
    accessibility: 15,
    water_access: 10,
    healthcare: 10,
    infrastructure: 10,
    land_availability: 10
  });

  useEffect(() => {
    loadPlannerData();
  }, []);

  const loadPlannerData = async () => {
    try {
      setLoading(true);
      const [sitesRes, ahpRes, zonesRes] = await Promise.all([
        api.getRelocationSites(),
        api.getAHPMatrix(),
        api.getZones()
      ]);
      setSites(sitesRes || []);
      setAhpData(ahpRes);
      setZones(zonesRes || []);
    } catch (e) {
      console.error("Error loading relocation planner data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key, val) => {
    setCustomWeights(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  const totalWeight = Object.values(customWeights).reduce((a, b) => a + b, 0);

  // Identify current source red zone
  const currentZone = useMemo(() => {
    return zones.find(z => z.code === activeZoneCode) || 
           (selectedZone?.code === activeZoneCode ? selectedZone : null) ||
           zones[0] || {
             code: "ZONE-TN-001",
             name: "Coonoor Ghat Multi-Hazard Sector",
             district: "Nilgiris",
             population: 2840,
             deformation_rate: 18.6,
             risk_score: 99.6,
             risk_level: "CRITICAL",
             center_lat: 11.353,
             center_lng: 76.795
           };
  }, [zones, activeZoneCode, selectedZone]);

  // Dynamic Haversine distance calculator
  const calculateDistance = (zLat, zLng, sLat, sLng) => {
    if (!zLat || !zLng || !sLat || !sLng) return { distKm: 24.2, transitMins: 45 };
    const dLat = (sLat - zLat) * Math.PI / 180;
    const dLon = (sLng - zLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(zLat * Math.PI / 180) * Math.cos(sLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const distKm = Math.max(3.5, Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)));
    const transitMins = Math.max(15, Math.round((distKm / 32) * 60));
    return { distKm, transitMins };
  };

  // Recalculate site scores dynamically based on weights and source zone
  const scoredSites = useMemo(() => {
    const zLat = Number(currentZone.center_lat || currentZone.centroid_lat || 11.353);
    const zLng = Number(currentZone.center_lng || currentZone.centroid_lng || 76.795);
    const pop = Number(currentZone.population || 2840);

    return sites.map(site => {
      const w = {
        hazard: customWeights.hazard_safety / totalWeight,
        stability: customWeights.ground_stability / totalWeight,
        access: customWeights.accessibility / totalWeight,
        water: customWeights.water_access / totalWeight,
        health: customWeights.healthcare / totalWeight,
        infra: customWeights.infrastructure / totalWeight,
        land: customWeights.land_availability / totalWeight
      };

      const s_hazard = Math.max(0, 100 - (site.hazard_risk_score || 10));
      const s_stability = site.ground_stability_score || 90;
      const s_access = site.road_access_score || 85;
      const s_water = site.water_availability_score || 88;
      const s_health = site.healthcare_access_score || 80;
      const s_infra = site.existing_infra_score || 82;
      const s_land = Math.min(100, Math.max(20, ((site.ecc || 5000) / 3500) * 100));

      const totalScore = (
        w.hazard * s_hazard +
        w.stability * s_stability +
        w.access * s_access +
        w.water * s_water +
        w.health * s_health +
        w.infra * s_infra +
        w.land * s_land
      );

      const sLat = Number(site.lat || 11.300);
      const sLng = Number(site.lng || 76.950);
      const { distKm, transitMins } = calculateDistance(zLat, zLng, sLat, sLng);
      const surplus = (site.ecc || 5600) - pop;

      return {
        ...site,
        calculated_suitability: Math.round(totalScore * 10) / 10,
        safety_index: Math.round(s_hazard),
        distKm,
        transitMins,
        surplus
      };
    }).sort((a, b) => b.calculated_suitability - a.calculated_suitability);
  }, [sites, customWeights, totalWeight, currentZone]);

  const consistency = ahpData?.consistency_evaluation || {
    consistency_ratio_cr: 0.067,
    is_consistent: true,
    status: "CONSISTENT"
  };

  const prominentZones = [
    { code: "ZONE-TN-001", name: "Coonoor Ghat Sector", pop: 2840, risk: "CRITICAL" },
    { code: "ZONE-TN-002", name: "Kotagiri Drop Sector", pop: 2150, risk: "CRITICAL" },
    { code: "ZONE-TN-003", name: "Ketti Valley Habitation", pop: 3420, risk: "CRITICAL" },
    { code: "ZONE-TN-004", name: "Gudalur Debris Corridor", pop: 1980, risk: "CRITICAL" },
    { code: "ZONE-TN-014", name: "Kodaikanal Ghat Pass", pop: 2750, risk: "HIGH" },
    { code: "ZONE-TN-023", name: "Manjolai Ridge", pop: 1620, risk: "HIGH" }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-heading text-slate-950">Safe Relocation Planner</h2>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                GIS-MCDA + AHP Weighted Overlay
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Analytic Hierarchy Process (Saaty 1980) Multi-Criteria Evaluation & Unique Candidate Haven Allocation
            </p>
          </div>
        </div>

        {/* Consistency Ratio Validation Badge */}
        <div className="flex items-center gap-3 p-3 px-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm">
          <div>
            <div className="text-[10px] text-emerald-800 uppercase font-mono font-black">AHP Consistency Ratio (CR)</div>
            <div className="text-lg font-black font-mono text-emerald-700">
              CR = {consistency.consistency_ratio_cr} <span className="text-xs text-emerald-800 font-bold">(&lt; 0.10)</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 text-xs font-black">
            CONSISTENT
          </span>
        </div>
      </div>

      {/* Target Red Zone Relocation Selector */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-red-50 via-amber-50 to-emerald-50 border-2 border-red-200/80 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <span className="text-sm font-black text-slate-900 uppercase font-mono tracking-wider">
              Select Endangered Red Zone to Evacuate:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Select from all 28 sectors:</span>
            <select
              value={activeZoneCode}
              onChange={(e) => setActiveZoneCode(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {zones.map(z => (
                <option key={z.code} value={z.code}>
                  {z.code} - {z.name} (Pop: {z.population?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick select pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {prominentZones.map(pz => {
            const isActive = pz.code === activeZoneCode;
            return (
              <button
                key={pz.code}
                onClick={() => setActiveZoneCode(pz.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white border-red-700 shadow-md scale-102'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>{pz.code}</span>
                <span className="opacity-80 text-[11px]">({pz.name.split(' ')[0]})</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                  {pz.pop.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Zone Summary strip */}
        <div className="p-3 bg-white/90 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-mono font-black text-xs">
              RZ
            </div>
            <div>
              <div className="font-extrabold text-slate-950 text-sm">{currentZone.name} ({currentZone.code})</div>
              <div className="text-slate-600 text-[11px] font-medium">{currentZone.district || 'Western Ghats'} • Risk Score: <strong className="text-red-600">{currentZone.risk_score}/100</strong></div>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase">Population at Risk</div>
              <div className="text-sm font-black text-slate-900">{currentZone.population?.toLocaleString()} citizens</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase">Ground Deformation</div>
              <div className="text-sm font-black text-red-600">+{currentZone.deformation_rate} mm/yr</div>
            </div>
          </div>
        </div>
      </div>

      {/* AHP Weights Tuner */}
      <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-black text-slate-950">Multi-Criteria Decision Analysis (MCDA) Weights Tuning</h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">
            Total Weight Sum: <strong className={totalWeight === 100 ? 'text-emerald-700' : 'text-amber-700'}>{totalWeight}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1 p-3 rounded-2xl bg-red-50/70 border border-red-200">
            <div className="flex justify-between text-xs">
              <span className="text-red-900 font-bold">Hazard Avoidance:</span>
              <strong className="text-red-700 font-mono font-black">{customWeights.hazard_safety}%</strong>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={customWeights.hazard_safety}
              onChange={(e) => handleWeightChange('hazard_safety', e.target.value)}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1 p-3 rounded-2xl bg-red-50/70 border border-red-200">
            <div className="flex justify-between text-xs">
              <span className="text-red-900 font-bold">Ground Stability (PSInSAR):</span>
              <strong className="text-red-700 font-mono font-black">{customWeights.ground_stability}%</strong>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              value={customWeights.ground_stability}
              onChange={(e) => handleWeightChange('ground_stability', e.target.value)}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex justify-between text-xs">
              <span className="text-amber-900 font-bold">Highway Road Access:</span>
              <strong className="text-amber-700 font-mono font-black">{customWeights.accessibility}%</strong>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={customWeights.accessibility}
              onChange={(e) => handleWeightChange('accessibility', e.target.value)}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-900 font-bold">Water & Sanitation:</span>
              <strong className="text-emerald-700 font-mono font-black">{customWeights.water_access}%</strong>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={customWeights.water_access}
              onChange={(e) => handleWeightChange('water_access', e.target.value)}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Ranked Candidate Relocation Sites Table */}
      <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
          <div>
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>AHP Ranked Candidate Havens for {currentZone.code} ({scoredSites.length} Sites)</span>
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Click <strong className="text-red-700">"Allocate & Report"</strong> on any candidate haven to generate a 100% unique Decision Report with custom transit, ECC surplus, and directives.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-xl border border-amber-300">
            Top Recommendation: {scoredSites[0]?.code} ({scoredSites[0]?.name?.split(' ')[0]})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-mono uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Candidate Haven Site</th>
                <th className="py-3 px-3 text-center">Safety Index</th>
                <th className="py-3 px-3 text-center">Capacity (ECC vs Target)</th>
                <th className="py-3 px-3 text-center">Evacuation Corridor</th>
                <th className="py-3 px-3 text-center">Slope</th>
                <th className="py-3 px-3 text-center">Suitability Score</th>
                <th className="py-3 px-3 text-right">Unique Decision Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {scoredSites.map((site, index) => {
                const isTop = index === 0;
                const hasSurplus = site.surplus >= 0;
                return (
                  <tr 
                    key={site.code} 
                    className={`transition-colors ${
                      isTop 
                        ? 'bg-emerald-50/80 font-bold' 
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <td className="py-3.5 px-3 font-mono font-black text-sm">
                      {index === 0 ? (
                        <span className="text-amber-600 flex items-center gap-1 font-black">#1 Rank</span>
                      ) : (
                        <span className="text-slate-500">#{index + 1}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-black text-slate-950 text-sm">{site.code}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{site.name}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-700 text-sm">
                      {site.safety_index || 94}/100
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs">
                      <div className="font-black text-slate-900">{site.ecc?.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">ECC</span></div>
                      <div className={`text-[10px] font-bold ${hasSurplus ? 'text-emerald-700' : 'text-red-600'}`}>
                        {hasSurplus ? `+${site.surplus?.toLocaleString()} surplus` : `${site.surplus?.toLocaleString()} deficit`}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-slate-900 text-[11px]">{site.road_accessibility}</div>
                      <div className="text-[10px] font-mono text-cyan-800 font-bold">
                        {site.distKm} km (~{site.transitMins}m)
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-800">
                      {site.slope}°
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-base font-black font-mono text-amber-700">
                        {site.calculated_suitability}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono"> / 100</span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onSelectSiteForReport && onSelectSiteForReport(currentZone.code, site.code)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer border border-white/30 hover:scale-102"
                        title={`Generate unique relocation report allocating ${site.code} for ${currentZone.code}`}
                      >
                        Allocate & Report
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
