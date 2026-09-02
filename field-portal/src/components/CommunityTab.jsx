import React from 'react';
import { Users, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CommunityTab({
  communitySurvey,
  setCommunitySurvey,
  calculateCERI
}) {
  const handleSaveCommunity = () => {
    confetti({ particleCount: 40, spread: 60 });
    alert(`Community Consultation logged. CERI Score (${communitySurvey.ceri_score}) transmitted to DDMA.`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-950 font-heading">Community Consultation & CERI Index</h2>
          <p className="text-xs text-slate-600 font-medium">
            Computes Community Engagement Risk Index (CERI) to assess social alignment and relocation willingness.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Households Consulted</label>
            <input
              type="number"
              value={communitySurvey.households_consulted}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                const ceri = calculateCERI(val, communitySurvey.willing_count, communitySurvey.reluctant_count, communitySurvey.objection_severity);
                setCommunitySurvey(prev => ({ ...prev, households_consulted: val, ceri_score: ceri }));
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Willing Households</label>
            <input
              type="number"
              value={communitySurvey.willing_count}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                const ceri = calculateCERI(communitySurvey.households_consulted, val, communitySurvey.reluctant_count, communitySurvey.objection_severity);
                setCommunitySurvey(prev => ({ ...prev, willing_count: val, ceri_score: ceri }));
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-emerald-700 font-black focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Reluctant / Opposed</label>
            <input
              type="number"
              value={communitySurvey.reluctant_count}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                const ceri = calculateCERI(communitySurvey.households_consulted, communitySurvey.willing_count, val, communitySurvey.objection_severity);
                setCommunitySurvey(prev => ({ ...prev, reluctant_count: val, ceri_score: ceri }));
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 text-xs text-red-700 font-black focus:border-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* CERI Index Gauge Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between shadow-xs card-hover">
          <div>
            <span className="text-[10px] font-mono text-emerald-900 font-black uppercase block">
              Calculated CERI Score (Community Engagement Risk Index)
            </span>
            <h3 className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
              {communitySurvey.ceri_score} / 100
            </h3>
            <span className="text-xs text-slate-700 font-bold">
              {communitySurvey.ceri_score < 30 ? 'Low Social Resistance (High Community Alignment)' : 'Moderate Resistance (Townhall Consultation Recommended)'}
            </span>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-emerald-600 bg-white flex items-center justify-center font-black text-lg text-emerald-700 shadow-sm">
            {Math.round(100 - communitySurvey.ceri_score)}%
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-600 font-black block mb-1 uppercase">Officer Notes & Public Feedback</label>
          <textarea
            rows={3}
            value={communitySurvey.officer_notes}
            onChange={(e) => setCommunitySurvey(prev => ({ ...prev, officer_notes: e.target.value }))}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 text-xs text-slate-900 font-medium focus:border-emerald-600 focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveCommunity}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-600/25 btn-touch"
        >
          Save Community Consultation & CERI Score
        </button>
      </div>
    </div>
  );
}
