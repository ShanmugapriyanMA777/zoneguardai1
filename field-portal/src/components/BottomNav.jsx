import React from 'react';
import { 
  Home, 
  Map as MapIcon, 
  List, 
  ClipboardCheck, 
  Compass, 
  RefreshCw 
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, offlineCount = 0 }) {
  const ITEMS = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'assignments', label: 'Tasks', icon: List },
    { id: 'survey', label: 'Survey', icon: ClipboardCheck },
    { id: 'relocation', label: 'Sites', icon: Compass },
    { id: 'sync', label: 'Sync', icon: RefreshCw, badge: offlineCount }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t-2 border-slate-200/80 px-2 py-1.5 backdrop-blur-xl shadow-lg flex items-center justify-around transition-all">
      {ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              setActiveTab(item.id);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer relative btn-touch ${
              isActive 
                ? 'text-emerald-700 font-black' 
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
          >
            {/* Active Pill Indicator Glow */}
            {isActive && (
              <span className="absolute -top-1.5 w-8 h-1 bg-emerald-600 rounded-full animate-fade-in" />
            )}
            
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-100' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            
            {item.badge > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs animate-bounce">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
