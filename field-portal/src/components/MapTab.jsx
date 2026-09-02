import React from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  Tooltip,
  useMap 
} from 'react-leaflet';
import { Map as MapIcon, ChevronRight, Navigation, ShieldAlert, Crosshair } from 'lucide-react';

function MapPanTo({ coords, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords && Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      try {
        map.flyTo([coords[0], coords[1]], zoom || 13, { duration: 1.0 });
      } catch (e) {
        console.warn("Map pan error:", e);
      }
    }
  }, [coords, zoom, map]);
  return null;
}

export default function MapTab({
  mapCenter,
  setMapCenter,
  mapZoom,
  setMapZoom,
  gpsCoords,
  officer,
  zones,
  relocationSites,
  selectedMapZone,
  setSelectedMapZone,
  onSelectZoneToInspect,
  onNavigateToTab
}) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Map Header & Filter Shortcuts */}
      <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950 font-heading">
              Tamil Nadu Multi-Hazard Spatial Red Zone Map
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Tap any red zone marker to view InSAR velocity, habitations, and trigger field survey.
            </p>
          </div>
        </div>

        {/* Quick Pan Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setMapCenter([10.8500, 78.5000]); setMapZoom(7.5); }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold border border-slate-300 cursor-pointer btn-touch"
          >
            All Tamil Nadu (28)
          </button>
          <button
            onClick={() => { setMapCenter([11.3900, 76.7500]); setMapZoom(11); }}
            className="px-3.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 text-xs font-bold border border-red-300 cursor-pointer btn-touch"
          >
            Nilgiris
          </button>
          <button
            onClick={() => { setMapCenter([10.3270, 76.9550]); setMapZoom(11); }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold border border-slate-300 cursor-pointer btn-touch"
          >
            Valparai
          </button>
          <button
            onClick={() => { setMapCenter([10.2350, 77.5200]); setMapZoom(11); }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold border border-slate-300 cursor-pointer btn-touch"
          >
            Kodaikanal
          </button>
        </div>
      </div>

      {/* Leaflet Map Frame */}
      <div className="h-[550px] w-full rounded-3xl overflow-hidden border-2 border-slate-300 relative shadow-xl">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
        >
          <MapPanTo coords={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri, USGS, TNDMA"
            maxZoom={19}
          />

          {/* Officer GNSS Live Marker */}
          <CircleMarker
            center={[gpsCoords.lat, gpsCoords.lng]}
            radius={10}
            pathOptions={{
              color: '#0284c7',
              weight: 3,
              fillColor: '#38bdf8',
              fillOpacity: 0.95
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <span className="font-black text-xs text-sky-950">Officer: {officer.name}</span>
            </Tooltip>
            <Popup>
              <div className="text-xs p-1 text-slate-900 font-sans">
                <strong className="text-sky-900 block text-sm">Live GNSS Position</strong>
                <div>Lat: <strong>{gpsCoords.lat}</strong>, Lng: <strong>{gpsCoords.lng}</strong></div>
                <div>Accuracy: <strong>±{gpsCoords.accuracy}m RTK</strong></div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Red Zones (Polygons or Points) */}
          {zones.map((z, idx) => {
            const isSelected = selectedMapZone?.code === z.code;
            const isUrgent = z.priority === 'URGENT' || z.risk_score >= 95;
            const fillColor = isUrgent ? '#ef4444' : '#f97316';

            return (
              <CircleMarker
                key={`zone-${z.code || idx}`}
                center={[z.lat, z.lng]}
                radius={isSelected ? 16 : 12}
                pathOptions={{
                  color: isSelected ? '#0f172a' : isUrgent ? '#991b1b' : '#c2410c',
                  weight: isSelected ? 4 : 2.5,
                  fillColor: fillColor,
                  fillOpacity: 0.85
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedMapZone(z);
                  }
                }}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  <span className="text-xs font-bold text-slate-950">
                    {z.code}: {z.name.split('(')[0]} ({z.risk_score}/100)
                  </span>
                </Tooltip>
                <Popup>
                  <div className="text-xs p-1 text-slate-900 space-y-1">
                    <strong className="text-sm text-slate-950 block">{z.name}</strong>
                    <div>Code: <span className="font-mono font-bold text-red-600">{z.code}</span></div>
                    <div>Hazard: <strong>{z.hazard_type}</strong></div>
                    <div>InSAR Velocity: <strong className="text-red-600">+{z.deformation_rate} mm/yr</strong></div>
                    <div>Population: <strong>{z.population?.toLocaleString()}</strong></div>
                    <button
                      onClick={() => {
                        onSelectZoneToInspect(z);
                        onNavigateToTab('survey');
                      }}
                      className="mt-2 w-full py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs cursor-pointer hover:bg-red-700 btn-touch"
                    >
                      Start Ground Verification
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Safe Relocation Sites (Green Pins) */}
          {relocationSites.map((site, idx) => (
            <CircleMarker
              key={`site-${site.code || idx}`}
              center={[site.lat, site.lng]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: '#059669',
                fillOpacity: 0.9
              }}
            >
              <Tooltip direction="bottom" offset={[0, 10]}>
                <span className="text-xs font-bold text-emerald-800">
                  Safe Site: {site.name.split('(')[0]}
                </span>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Floating Slide-In Intelligence Card */}
        {selectedMapZone && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] p-4 rounded-3xl bg-white/95 border-2 border-red-400 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-slate-900 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-red-600 text-xs">{selectedMapZone.code}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 text-[10px] font-black uppercase">
                  {selectedMapZone.priority} PRIORITY
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-950 mt-0.5">{selectedMapZone.name}</h4>
              <p className="text-slate-700 font-semibold">
                InSAR Creep: <strong className="text-red-600">+{selectedMapZone.deformation_rate} mm/yr</strong> • Population: <strong className="text-slate-950">{selectedMapZone.population?.toLocaleString()}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMapCenter([selectedMapZone.lat, selectedMapZone.lng]);
                  setMapZoom(14);
                }}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs cursor-pointer btn-touch"
              >
                Center Map
              </button>
              <button
                onClick={() => {
                  onSelectZoneToInspect(selectedMapZone);
                  onNavigateToTab('survey');
                }}
                className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-red-600/30 btn-touch"
              >
                Start Verification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
