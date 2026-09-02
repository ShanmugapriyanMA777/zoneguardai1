import React from 'react';
import { RefreshCw, WifiOff, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

export default function SyncTab({
  offlineQueue,
  syncedSurveys,
  syncing,
  onAutoSync
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950 font-heading">Synchronization & Verification Audit Trail</h2>
          <p className="text-xs text-slate-600 font-medium">
            Traceable record of all field surveys, GPS waypoints, offline queues, and state database sync status.
          </p>
        </div>
        <button
          onClick={onAutoSync}
          disabled={syncing || offlineQueue.length === 0}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer btn-touch ${
            offlineQueue.length > 0 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30' 
              : 'bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Records...' : `Batch Sync Queue (${offlineQueue.length})`}</span>
        </button>
      </div>

      {/* Offline Queue Section */}
      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-950 uppercase font-heading flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <span>Pending Offline Synchronization Queue ({offlineQueue.length})</span>
          </h3>
        </div>

        {offlineQueue.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center text-slate-600 text-xs font-bold">
            Offline queue is empty. All local field records are synchronized with the central ZoneGuard server.
          </div>
        ) : (
          <div className="space-y-2">
            {offlineQueue.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/70 border-2 border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs card-hover">
                <div>
                  <span className="font-mono font-black text-amber-900 text-xs">{item.survey_code || `PENDING-#${idx+1}`}</span>
                  <h4 className="font-black text-slate-950">{item.village_name}</h4>
                  <span className="text-[11px] text-slate-700 font-semibold">
                    GPS: {item.lat}, {item.lng} • Damaged: {item.damaged_houses} houses
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 border border-amber-400 text-[10px] font-mono font-black">
                  Awaiting Network Sync
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Synced Audit Log Table */}
      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-3">
        <h3 className="text-sm font-black text-slate-950 uppercase font-heading flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Verified Field Survey Records ({syncedSurveys.length})</span>
        </h3>

        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
          {syncedSurveys.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center text-slate-600 text-xs font-bold">
              No remote records loaded yet. Tap 'Batch Sync Queue' to upload.
            </div>
          ) : (
            syncedSurveys.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs card-hover">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-700 text-xs">{item.survey_code}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{item.synced_at || 'Verified'}</span>
                  </div>
                  <h4 className="font-black text-slate-950 mt-0.5">{item.village_name}</h4>
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    Surveyor: <strong className="text-slate-950">{item.surveyor_name}</strong> • Fissures: <strong className="text-red-600">{item.crack_depth_cm || 0} cm</strong>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-black">
                  SYNCED TO DDMA
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
