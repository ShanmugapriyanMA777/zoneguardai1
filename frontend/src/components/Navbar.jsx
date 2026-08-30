import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Map, 
  Activity, 
  Compass, 
  Users, 
  BarChart3, 
  ClipboardCheck, 
  BookOpen, 
  Database, 
  Bell, 
  ChevronDown, 
  UserCheck, 
  Layers,
  RotateCcw,
  Sparkles,
  AlertOctagon
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentRole, 
  setCurrentRole, 
  alertCount,
  onResetData,
  onOpenAlerts 
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Home Overview', icon: Sparkles },
    { id: 'command-center', label: 'GIS Command Center', icon: Map, badge: 'Pan-India' },
    { id: 'red-zones', label: 'Red Zones & Precautions', icon: AlertOctagon, badge: 'Live Situation' },
    { id: 'deformation', label: 'Satellite Ingestion Studio', icon: Activity, badge: 'SAR • DEM • LULC' },
    { id: 'capacity', label: 'Carrying Capacity', icon: Users, badge: 'PCC→ECC' },
    { id: 'relocation', label: 'Safe Relocation Planner', icon: Compass, badge: 'AHP-MCDA' },
    { id: 'analytics', label: 'Analytics & XAI', icon: BarChart3 },
    { id: 'field-app', label: 'Field Survey Portal', icon: ClipboardCheck, badge: 'Offline Sync' },
  ];

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setRoleDropdownOpen(false);
  };

  const getRoleLabel = () => {
    switch (currentRole) {
      case 'ADMIN':
        return { label: 'District Collector & DDMA', desc: 'Dr. K. Senthil Nathan, IAS', color: 'bg-red-50 text-red-700 border-red-300' };
      case 'FIELD_OFFICER':
        return { label: 'TNDMA Field Officer', desc: 'R. Kavitha', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
      case 'ANALYST':
        return { label: 'Lead GIS/SAR Scientist', desc: 'Dr. S. Ramanathan', color: 'bg-amber-50 text-amber-700 border-amber-300' };
      default:
        return { label: 'TNDMA Admin', desc: 'Authorized', color: 'bg-red-50 text-red-700 border-red-300' };
    }
  };

  const roleInfo = getRoleLabel();

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-slate-200 text-slate-900 select-none shadow-md">
      {/* Top Header Bar */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
        {/* Brand & District Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 via-yellow-500 to-emerald-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-heading font-black text-xl tracking-wider text-slate-950">
                ZONEGUARD <span className="text-red-600">AI</span>
              </span>
              <span className="text-[11px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                CRITICAL HAZARD MONITOR
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                TAMIL NADU (TNDMA)
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold tracking-wide mt-0.5">
              Multi-Hazard Red-Zone Mapping & Proactive Relocation Decision Support System
            </p>
          </div>
        </div>

        {/* District Selector & Status Actions */}
        <div className="flex items-center gap-3.5">
          {/* District Focus Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-800 font-bold shadow-sm">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>District: <strong className="text-slate-950 font-black">Nilgiris - Western Ghats (TN)</strong></span>
          </div>

          {/* Seed Data Reset Action */}
          <button
            onClick={onResetData}
            title="Reset District Simulation Dataset"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-xs font-bold text-red-700 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Reset Baseline</span>
          </button>

          {/* Alert Notification Center */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-800 transition-all cursor-pointer shadow-sm"
            title="Active Hazard & Relocation Alerts"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            {alertCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono font-black text-[10px] shadow-md border-2 border-white">
                {alertCount}
              </span>
            )}
          </button>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${roleInfo.color}`}
            >
              <UserCheck className="w-4 h-4" />
              <div className="text-left hidden md:block">
                <div className="text-[11px] font-black leading-tight">{roleInfo.label}</div>
                <div className="text-[10px] font-semibold opacity-90">{roleInfo.desc}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-68 rounded-2xl bg-white border-2 border-slate-200 shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-500 px-3 py-1 uppercase tracking-wider font-mono">
                  Switch Active Role (Tamil Nadu Demo)
                </div>
                <button
                  onClick={() => handleRoleChange('ADMIN')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                    currentRole === 'ADMIN' ? 'bg-red-100 text-red-900 font-bold border border-red-300' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold">District Collector & DDMA Head</div>
                    <div className="text-[10px] text-slate-600">Dr. K. Senthil Nathan, IAS</div>
                  </div>
                  {currentRole === 'ADMIN' && <span className="text-red-600 font-bold text-xs">● Active</span>}
                </button>

                <button
                  onClick={() => handleRoleChange('FIELD_OFFICER')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between mt-1 ${
                    currentRole === 'FIELD_OFFICER' ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold">TNDMA Field Disaster Officer</div>
                    <div className="text-[10px] text-slate-600">R. Kavitha (Nilgiris Ground Team)</div>
                  </div>
                  {currentRole === 'FIELD_OFFICER' && <span className="text-emerald-600 font-bold text-xs">● Active</span>}
                </button>

                <button
                  onClick={() => handleRoleChange('ANALYST')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between mt-1 ${
                    currentRole === 'ANALYST' ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold">Lead GIS & SAR Scientist</div>
                    <div className="text-[10px] text-slate-600">Dr. S. Ramanathan (TNDMA Remote Sensing)</div>
                  </div>
                  {currentRole === 'ANALYST' && <span className="text-amber-600 font-bold text-xs">● Active</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <nav className="px-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 bg-slate-50 border-t border-slate-200 text-xs font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-yellow-600 text-white shadow-md shadow-red-500/20 border border-red-700'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-600'}`} />
              <span className="tracking-wide">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? 'bg-white/30 text-white border border-white/40' : 'bg-slate-200 text-slate-700 border border-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
