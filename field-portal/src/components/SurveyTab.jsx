import React, { useState } from 'react';
import { 
  MapPin, 
  Crosshair, 
  Users, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import PhotoEvidenceManager from './PhotoEvidenceManager';

export default function SurveyTab({
  formData,
  setFormData,
  zones,
  onAcquireGps,
  onSubmitSurvey,
  submitting,
  isOnline,
  officer
}) {
  const [evidencePhotos, setEvidencePhotos] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitSurvey(evidencePhotos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      {/* Top Banner */}
      <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950 font-heading">
            Field Ground-Truth Verification & Damage Survey
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Captures GNSS coordinates, household vulnerability, crack depths, and physical slope evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            Target: {formData.zone_code}
          </span>
        </div>
      </div>

      {/* SECTION 1: GPS & LOCATION */}
      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-950 uppercase font-heading">
              1. Location & GPS Telemetry
            </h3>
          </div>
          <button
            type="button"
            onClick={onAcquireGps}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm btn-touch"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Update GNSS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Target Red Zone</label>
            <select
              value={formData.zone_code}
              onChange={(e) => {
                const sel = zones.find(z => z.code === e.target.value);
                if (sel) {
                  setFormData(prev => ({
                    ...prev,
                    zone_code: sel.code,
                    village_name: `${sel.name.split('(')[0].trim()} Settlement`,
                    lat: sel.lat || prev.lat,
                    lng: sel.lng || prev.lng
                  }));
                }
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            >
              {zones.map(z => (
                <option key={z.code} value={z.code}>{z.code} — {z.name.split('(')[0]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Village / Settlement Name</label>
            <input
              type="text"
              value={formData.village_name}
              onChange={(e) => setFormData(prev => ({ ...prev, village_name: e.target.value }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Latitude / Longitude</label>
            <input
              type="text"
              disabled
              value={`${formData.lat}, ${formData.lng}`}
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-emerald-800 font-mono font-black"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">GPS GNSS Accuracy</label>
            <input
              type="text"
              disabled
              value={`±${formData.gps_accuracy_m}m High Precision RTK`}
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-emerald-800 font-mono font-black"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: HOUSEHOLD & POPULATION DEMOGRAPHICS */}
      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Users className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-black text-slate-950 uppercase font-heading">
            2. Household & Population Demographics
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Household ID</label>
            <input
              type="text"
              value={formData.household_id}
              onChange={(e) => setFormData(prev => ({ ...prev, household_id: e.target.value }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Family Members Count</label>
            <input
              type="number"
              value={formData.family_members_count}
              onChange={(e) => setFormData(prev => ({ ...prev, family_members_count: parseInt(e.target.value) || 1 }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Livelihood Occupation</label>
            <select
              value={formData.livelihood_type}
              onChange={(e) => setFormData(prev => ({ ...prev, livelihood_type: e.target.value }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            >
              <option>Tea & Coffee Plantation Worker</option>
              <option>Terrace Agriculture & Farming</option>
              <option>Daily Wage Construction Labour</option>
              <option>Forest Produce Collector</option>
              <option>Local Retail / Small Business</option>
              <option>Tourist Transport / Driver</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Relocation Willingness</label>
            <select
              value={formData.relocation_willingness}
              onChange={(e) => setFormData(prev => ({ ...prev, relocation_willingness: e.target.value }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            >
              <option>Yes - Willing Immediately</option>
              <option>Yes - If Housing Subsidy Provided</option>
              <option>Conditional - Within 5km Radius</option>
              <option>Reluctant / Opposed</option>
            </select>
          </div>
        </div>

        {/* Vulnerability Checklist Pills */}
        <div>
          <label className="text-[11px] font-mono text-slate-600 font-black block mb-2 uppercase">
            Special Vulnerability Categories Present
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "Elderly (>65 yrs)",
              "Children (<5 yrs)",
              "Persons with Disabilities (PWD)",
              "Pregnant / Lactating Mothers",
              "Chronic Medical Needs (Dialysis/Oxygen)",
              "Single Women Headed Household"
            ].map(tag => {
              const selected = formData.vulnerability_tags?.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      vulnerability_tags: selected 
                        ? prev.vulnerability_tags.filter(t => t !== tag)
                        : [...(prev.vulnerability_tags || []), tag]
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer btn-touch ${
                    selected 
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                      : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}{tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: PHYSICAL DAMAGE & FISSURES */}
      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-sm font-black text-slate-950 uppercase font-heading">
            3. Ground Condition & Physical Hazard Verification
          </h3>
        </div>

        {/* Fissure Crack Depth Slider */}
        <div className="p-4 rounded-2xl bg-red-50/80 border-2 border-red-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900">Surface Crack & Fissure Dilatation Depth (cm):</span>
            <span className="text-base font-mono font-black text-red-700">{formData.crack_depth_cm} cm</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="0.5"
            value={formData.crack_depth_cm || 0}
            onChange={(e) => setFormData(prev => ({ ...prev, crack_depth_cm: parseFloat(e.target.value), observed_cracks: parseFloat(e.target.value) > 0 }))}
            className="w-full accent-red-600 cursor-pointer"
          />
        </div>

        {/* Checkbox Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'slope_instability', label: 'Active Slope Instability / Toe Scarp' },
            { key: 'building_damage', label: 'Building Structural Fractures' },
            { key: 'road_damage', label: 'Ghat Highway Heaving / Collapse' },
            { key: 'drainage_blocked', label: 'Blocked Sub-surface Drainage' },
            { key: 'observed_cracks', label: 'Active Ground Tension Cracks' }
          ].map(item => (
            <button
              type="button"
              key={item.key}
              onClick={() => setFormData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
              className={`p-3.5 rounded-2xl text-left border-2 flex items-center justify-between cursor-pointer transition-all btn-touch ${
                formData[item.key]
                  ? 'bg-red-50 border-red-500 text-red-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold">{item.label}</span>
              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black ${
                formData[item.key] ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {formData[item.key] ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: ADVANCED PHOTO EVIDENCE SUITE */}
      <PhotoEvidenceManager
        photos={evidencePhotos}
        setPhotos={setEvidencePhotos}
        gpsCoords={{ lat: formData.lat, lng: formData.lng, accuracy: formData.gps_accuracy_m }}
        zoneCode={formData.zone_code}
        villageName={formData.village_name}
        officer={officer}
      />

      {/* SECTION 5: ROAD PASSABILITY & OFFICER DIRECTIVES */}
      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Damaged Structures Count</label>
            <input
              type="number"
              value={formData.damaged_houses}
              onChange={(e) => setFormData(prev => ({ ...prev, damaged_houses: parseInt(e.target.value) || 0 }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Road & Vehicle Passability</label>
            <select
              value={formData.road_condition}
              onChange={(e) => setFormData(prev => ({ ...prev, road_condition: e.target.value }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            >
              <option>Passable for all vehicles</option>
              <option>Severely Cracked (4x4 Vehicles Only)</option>
              <option>Blocked by Boulder Slump / Closed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Officer Observations & Evacuation Directives</label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 text-xs text-slate-900 font-medium focus:border-emerald-600 focus:bg-white"
          />
        </div>
      </div>

      {/* SUBMISSION ACTION */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 btn-touch"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Transmitting Field Data...' : isOnline ? 'Submit & Transmit Ground Truth' : 'Save in Local Offline Queue'}</span>
        </button>
      </div>
    </form>
  );
}
