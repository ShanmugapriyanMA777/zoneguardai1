import React from 'react';
import { 
  Home, 
  Map as MapIcon, 
  List, 
  ClipboardCheck, 
  Compass, 
  Users, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  PhoneCall, 
  User, 
  Download,
  Crosshair,
  Smartphone
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  officer, 
  isOnline, 
  setIsOnline, 
  offlineCount = 0,
  zonesCount = 5,
  onAcquireGps,
  onInstallPwa,
  deviceFrameMode,
  setDeviceFrameMode
}) {
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'map', label: 'Red Zone Map', icon: MapIcon, badge: '28 Zones' },
    { id: 'assignments', label: 'Tasks', icon: List, badge: `${zonesCount} Active` },
    { id: 'survey', label: 'Field Survey', icon: ClipboardCheck, badge: 'GPS Ready' },
    { id: 'relocation', label: 'Relocation Sites', icon: Compass },
    { id: 'community', label: 'Community (CERI)', icon: Users },
    { id: 'sync', label: 'Sync & Audit', icon: RefreshCw, badge: offlineCount > 0 ? `${offlineCount} Pending` : null }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b-2 border-slate-200/80 shadow-xs backdrop-blur-md transition-all">
      {/* Top Clean Brand Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* LEFT: Clean Official App Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs border-2 border-emerald-500 bg-white p-0.5 flex-shrink-0 flex items-center justify-center">
              <img src="/app-icon.png" alt="ZoneGuard Logo" className="w-full h-full object-contain" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-lg sm:text-xl text-slate-950 tracking-tight leading-none">
                  ZONEGUARD <span className="text-emerald-600">AI</span>
                </h1>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                  FIELD OPS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                Tamil Nadu Disaster Management Authority Ground Survey
              </p>
            </div>
          </div>

          {/* RIGHT: Minimalist, Uncluttered Status & Essential Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Online / Offline Status Pill */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              title="Click to toggle Network Simulation"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer btn-touch ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100 animate-pulse'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[11px]">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            {/* Emergency SOS Call */}
            <a
              href="tel:1077"
              title="Emergency Helpline 1077"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-sm cursor-pointer transition-all btn-touch"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1077 SOS</span>
            </a>

            {/* Officer Profile Avatar */}
            <button
              onClick={() => setActiveTab('profile')}
              title={`Logged in as ${officer?.name || 'Officer'}`}
              className={`w-9 h-9 rounded-xl border-2 font-black text-xs flex items-center justify-center cursor-pointer transition-all btn-touch ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
              }`}
            >
              {officer?.avatar_initials || 'TN'}
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP & TABLET PRIMARY NAVIGATION BAR */}
      <div className="hidden md:block border-t border-slate-200/80 bg-slate-50/70 px-4 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(15);
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap btn-touch ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-sm font-black' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/25 text-white font-bold' : 'bg-slate-200 text-slate-700 font-semibold'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Offline Pending Badge on Desktop */}
          {offlineCount > 0 && (
            <button
              onClick={() => setActiveTab('sync')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-mono font-bold cursor-pointer hover:bg-amber-200 btn-touch"
            >
              <RefreshCw className="w-3 h-3 text-amber-700 animate-spin" />
              <span>{offlineCount} Offline Queue</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
