import React from 'react';
import { Compass, Droplets, Zap, HeartPulse, GraduationCap, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RelocationTab({
  siteInspection,
  setSiteInspection,
  relocationSites
}) {
  const handleSaveInspection = () => {
    confetti({ particleCount: 45, spread: 60 });
    alert(`Site Inspection for ${siteInspection.site_code} logged and carrying capacity updated.`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-950 font-heading">Relocation Site Verification Portal</h2>
          <p className="text-xs text-slate-600 font-medium">
            Inspect proposed high-ground relocation townships for water, electricity, road access, and safety.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Select Candidate Safe Site</label>
            <select
              value={siteInspection.site_code}
              onChange={(e) => {
                const sel = relocationSites?.find(s => s.code === e.target.value);
                if (sel) {
                  setSiteInspection(prev => ({
                    ...prev,
                    site_code: sel.code,
                    site_name: sel.name,
                    verified_area_sqm: sel.usable_area_sqm || 200000,
                    road_accessibility: sel.road_accessibility || prev.road_accessibility
                  }));
                }
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            >
              <option value="SITE-07">SITE-07 — Mettupalayam Safe Plateau (Nilgiris Foot, TN)</option>
              <option value="SITE-12">SITE-12 — Sirumugai Foothills Buffer (Coimbatore, TN)</option>
              <option value="SITE-13">SITE-13 — Pollachi Elevated Tableland (Coimbatore, TN)</option>
              <option value="SITE-16">SITE-16 — Batlagundu Palani Foothills (Dindigul, TN)</option>
              <option value="SITE-17">SITE-17 — Chinnamanur High-Ground (Theni, TN)</option>
              <option value="SITE-18">SITE-18 — Ambasamudram Safe Foothills (Tirunelveli, TN)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Verified Usable Land Area (sqm)</label>
            <input
              type="number"
              value={siteInspection.verified_area_sqm}
              onChange={(e) => setSiteInspection(prev => ({ ...prev, verified_area_sqm: parseInt(e.target.value) || 0 }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Assigned Suitability Rating</label>
            <select
              value={siteInspection.assigned_status}
              onChange={(e) => setSiteInspection(prev => ({ ...prev, assigned_status: e.target.value }))}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-emerald-700 font-black focus:border-emerald-600 focus:bg-white"
            >
              <option>Suitable</option>
              <option>Conditionally Suitable</option>
              <option>Not Suitable</option>
            </select>
          </div>
        </div>

        {/* Key Infrastructure Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-200 card-hover">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>Potable Water</span>
            </div>
            <strong className="text-xs text-slate-950 mt-1 block font-black">{siteInspection.water_availability}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 card-hover">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Electricity Grid</span>
            </div>
            <strong className="text-xs text-slate-950 mt-1 block font-black">{siteInspection.electricity_status}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 card-hover">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900">
              <HeartPulse className="w-4 h-4 text-red-600" />
              <span>Hospital Proximity</span>
            </div>
            <strong className="text-xs text-slate-950 mt-1 block font-black">{siteInspection.healthcare_distance_km} km (Primary Health Centre)</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50 border-2 border-purple-200 card-hover">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>School Proximity</span>
            </div>
            <strong className="text-xs text-slate-950 mt-1 block font-black">{siteInspection.school_distance_km} km (Govt Higher Secondary)</strong>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Site Inspection Field Notes</label>
          <textarea
            rows={3}
            value={siteInspection.inspection_notes}
            onChange={(e) => setSiteInspection(prev => ({ ...prev, inspection_notes: e.target.value }))}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 text-xs text-slate-900 font-medium focus:border-emerald-600 focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveInspection}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-600/25 btn-touch"
        >
          Log Site Inspection & Update Carrying Capacity
        </button>
      </div>
    </div>
  );
}
