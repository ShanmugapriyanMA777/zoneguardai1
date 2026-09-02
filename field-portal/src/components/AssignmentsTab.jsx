import React from 'react';
import { List, Navigation, ClipboardCheck, AlertTriangle } from 'lucide-react';

export default function AssignmentsTab({
  zones,
  officer,
  onSelectZoneToInspect,
  onNavigateToTab,
  setMapCenter,
  setMapZoom,
  setSelectedMapZone
}) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-950 font-heading">Field Inspection Assignments</h2>
          <p className="text-xs text-slate-600 font-medium">
            Priority disaster hazard corridors assigned to Officer {officer.name} by DDMA Nilgiris.
          </p>
        </div>
        <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
          {zones.length} Assigned Zones
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((z) => {
          const isUrgent = z.priority === 'URGENT';
          return (
            <div 
              key={z.code}
              className="p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-red-400 transition-all space-y-3 shadow-md card-hover"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-100 text-slate-900 border border-slate-300">
                    {z.code}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    isUrgent ? 'bg-red-100 text-red-900 border border-red-300 animate-pulse' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {z.priority}
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-red-600">
                  Risk Score: {z.risk_score}/100
                </span>
              </div>

              <h3 className="text-base font-black text-slate-950">{z.name}</h3>
              
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>Hazard: <strong className="text-red-700 block">{z.hazard_type}</strong></div>
                <div>InSAR Rate: <strong className="text-red-700 block">+{z.deformation_rate} mm/yr</strong></div>
                <div>Population: <strong className="text-slate-950 block">{z.population?.toLocaleString()}</strong></div>
                <div>Slope: <strong className="text-amber-800 block">{z.slope}°</strong></div>
              </div>

              <p className="text-[11px] text-slate-800 bg-amber-50 p-3 rounded-2xl border border-amber-200 font-medium">
                <strong className="text-amber-900">Directive:</strong> {z.recommended_action}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setMapCenter([z.lat, z.lng]);
                    setMapZoom(14);
                    setSelectedMapZone(z);
                    onNavigateToTab('map');
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer btn-touch"
                >
                  <Navigation className="w-3.5 h-3.5 text-slate-700" />
                  <span>Navigate GPS</span>
                </button>
                <button
                  onClick={() => {
                    onSelectZoneToInspect(z);
                    onNavigateToTab('survey');
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-600/25 btn-touch"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Start Survey</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
