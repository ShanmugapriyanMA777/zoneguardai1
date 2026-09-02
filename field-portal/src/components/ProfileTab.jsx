import React from 'react';
import { LogOut, ShieldCheck, User, Building, Phone, Database } from 'lucide-react';

export default function ProfileTab({
  officer,
  backendConnected,
  onLogout
}) {
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <div className="w-18 h-18 rounded-3xl overflow-hidden shadow-xl border-2 border-emerald-500 bg-white p-1 flex items-center justify-center flex-shrink-0">
          <img src="/app-icon.png" alt="ZoneGuard App Icon" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950 font-heading truncate">{officer.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-black">
              AUTHENTICATED
            </span>
          </div>
          <p className="text-xs text-emerald-700 font-bold truncate">{officer.designation}</p>
          <span className="text-[10px] font-mono text-slate-600 font-bold">{officer.badge_no}</span>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex justify-between items-center card-hover">
          <span className="text-slate-600 font-mono font-bold">Disaster Authority Jurisdiction</span>
          <strong className="text-slate-950 text-right">{officer.district}</strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex justify-between items-center card-hover">
          <span className="text-slate-600 font-mono font-bold">Assigned Sector Blocks</span>
          <strong className="text-slate-950 text-right">{officer.assigned_block}</strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex justify-between items-center card-hover">
          <span className="text-slate-600 font-mono font-bold">Emergency Official Contact</span>
          <strong className="text-emerald-700 font-black">{officer.phone}</strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex justify-between items-center card-hover">
          <span className="text-slate-600 font-mono font-bold">Central Database State</span>
          <strong className={backendConnected ? "text-emerald-700 font-black" : "text-amber-600 font-black"}>
            {backendConnected ? "Online Connected (zoneguard.db)" : "Offline Local Cache Mode"}
          </strong>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => alert("Session security token refreshed with Central TNDMA Server.")}
          className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-xs cursor-pointer shadow-xs btn-touch"
        >
          Refresh Security Token
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 btn-touch"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out Officer</span>
        </button>
      </div>
    </div>
  );
}
