import React from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Activity, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AlertsModal({ alerts, onClose, onDismiss, onSelectZone }) {
  const getSeverityStyle = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MODERATE': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Active District Hazard & Deformation Alerts ({alerts.length})</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Alerts */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No active alerts. District hazard telemetry within safe baselines.
            </div>
          ) : (
            alerts.map((al) => (
              <div 
                key={al.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityStyle(al.severity)}`}>
                    {al.severity} • {al.alert_type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{al.created_at}</span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{al.title}</h4>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">{al.message}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                  <div className="flex items-center gap-2">
                    {al.zone_code && (
                      <span className="text-[10px] font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {al.zone_code}
                      </span>
                    )}
                    {al.site_code && (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {al.site_code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDismiss(al.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                    >
                      Dismiss
                    </button>
                    {al.zone_code && (
                      <button
                        onClick={() => {
                          onClose();
                          onSelectZone(al.zone_code);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>View Zone</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
