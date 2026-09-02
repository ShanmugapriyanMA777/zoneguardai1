import React from 'react';
import { 
  ClipboardCheck, 
  Map as MapIcon, 
  Compass, 
  ChevronRight, 
  AlertOctagon, 
  Crosshair, 
  Users, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function DashboardTab({ 
  officer, 
  zones, 
  offlineQueue, 
  syncedSurveys, 
  gpsCoords, 
  onAcquireGps, 
  onNavigateToTab, 
  onSelectZone 
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Officer Incident Command Sector Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/60 border-2 border-emerald-200/80 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-emerald-700">
                Active Ground Sector
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                TNDMA Western Ghats Command
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-heading mt-1.5">
              Nilgiris & Western Ghats Multi-Hazard Verification Grid
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              Field Incident Officer: <strong className="text-slate-950">{officer.name}</strong> ({officer.designation})
            </p>
          </div>

          {/* GPS Live GNSS Lock Action */}
          <button
            onClick={onAcquireGps}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer btn-touch"
          >
            <Crosshair className="w-4 h-4" />
            <span>Lock Live GNSS Coordinates</span>
          </button>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-white border-2 border-red-200 shadow-xs card-hover">
            <div className="text-[10px] font-mono uppercase text-red-700 font-black">Assigned Zones</div>
            <div className="text-2xl font-black text-red-600 mt-1">{zones.length}</div>
            <div className="text-[10px] text-red-700 font-bold">3 Urgent Priority</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-amber-200 shadow-xs card-hover">
            <div className="text-[10px] font-mono uppercase text-amber-700 font-black">Habitations</div>
            <div className="text-2xl font-black text-amber-600 mt-1">14</div>
            <div className="text-[10px] text-slate-600 font-bold">12,290 Citizens</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-xs card-hover">
            <div className="text-[10px] font-mono uppercase text-emerald-700 font-black">Relocation Sites</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">10</div>
            <div className="text-[10px] text-emerald-800 font-bold">58,166 Capacity</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-sky-200 shadow-xs card-hover">
            <div className="text-[10px] font-mono uppercase text-sky-700 font-black">Offline Queue</div>
            <div className="text-2xl font-black text-sky-600 mt-1">{offlineQueue.length}</div>
            <div className="text-[10px] text-slate-600 font-bold">Local Encrypted</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-purple-200 shadow-xs card-hover">
            <div className="text-[10px] font-mono uppercase text-purple-700 font-black">Synced Audits</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{syncedSurveys.length + 12}</div>
            <div className="text-[10px] text-purple-800 font-bold">State Database</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-red-200 shadow-xs card-hover">
            <div className="text-[10px] font-mono uppercase text-red-700 font-black">Active Alerts</div>
            <div className="text-2xl font-black text-red-600 mt-1">4</div>
            <div className="text-[10px] text-red-700 font-bold">InSAR + Rain Alert</div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigateToTab('survey')}
          className="p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-emerald-500 cursor-pointer transition-all shadow-md group space-y-3 card-hover btn-touch"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-950 font-heading">Start GPS Field Survey</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Record household vulnerability, fissure crack depths, and capture GNSS-watermarked photos.
          </p>
          <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
            Launch Survey Form <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateToTab('map')}
          className="p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-red-500 cursor-pointer transition-all shadow-md group space-y-3 card-hover btn-touch"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
            <MapIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-950 font-heading">Interactive Red Zone Map</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Inspect all 28 Tamil Nadu hazard sectors, habitations, rivers, roads, and safe relocation shelters.
          </p>
          <span className="text-xs font-black text-red-600 flex items-center gap-1">
            Open 3D Field Map <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        <div 
          onClick={() => onNavigateToTab('relocation')}
          className="p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-teal-500 cursor-pointer transition-all shadow-md group space-y-3 card-hover btn-touch"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-700 group-hover:scale-110 transition-transform">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-950 font-heading">Relocation Site Inspection</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Verify Mettupalayam, Pollachi, Batlagundu safe plateaus for water, electricity, and capacity.
          </p>
          <span className="text-xs font-black text-teal-700 flex items-center gap-1">
            Inspect Safe Sites <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Live High-Priority Early Warning Alerts */}
      <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-black text-slate-950 font-heading">
              Live High-Priority Disaster Early Warnings
            </h3>
          </div>
          <span className="text-xs font-mono font-black text-red-600 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
            4 Active Telemetry Alerts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-red-50/80 border-2 border-red-200 space-y-2 card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-red-200 text-red-900 border border-red-300">
                CRITICAL IN-SAR DEFORMATION
              </span>
              <span className="text-xs font-mono text-red-700 font-black">+18.6 mm/yr</span>
            </div>
            <h4 className="text-sm font-black text-slate-950">Coonoor Marapallam Ghats Creep (NH-181)</h4>
            <p className="text-xs text-slate-700 font-medium">
              Sentinel-1 InSAR PS time-series detects accelerating slope subsidence along Marapallam road flank.
            </p>
            <button 
              onClick={() => {
                if (zones[0]) onSelectZone(zones[0]);
                onNavigateToTab('survey');
              }}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-sm btn-touch"
            >
              Inspect Zone ZONE-TN-001
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/80 border-2 border-red-200 space-y-2 card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-red-200 text-red-900 border border-red-300">
                EXTREME RAIN TRIGGER
              </span>
              <span className="text-xs font-mono text-red-700 font-black">2,950 mm Rain</span>
            </div>
            <h4 className="text-sm font-black text-slate-950">Valparai 40-Hairpin Ghat Monsoon Saturation</h4>
            <p className="text-xs text-slate-700 font-medium">
              Monsoon threshold exceeded. Critical pore-water pressure detected across Hairpin 22-38.
            </p>
            <button 
              onClick={() => {
                const z = zones.find(item => item.code === 'ZONE-TN-008') || zones[0];
                if (z) onSelectZone(z);
                onNavigateToTab('survey');
              }}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-sm btn-touch"
            >
              Inspect Zone ZONE-TN-008
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
