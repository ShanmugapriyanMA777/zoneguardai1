import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  CircleMarker, 
  Polyline, 
  Popup, 
  useMap 
} from 'react-leaflet';
import { 
  Layers, 
  AlertTriangle, 
  Compass, 
  Sparkles, 
  FileText, 
  Activity, 
  Users, 
  ShieldAlert, 
  Search, 
  MapPin, 
  ChevronRight, 
  X, 
  ArrowRight,
  Crosshair,
  Building2,
  Navigation,
  CheckCircle2,
  Mountain
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Map pan helper component with error resilience
function MapPanTo({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (
      coords && 
      Array.isArray(coords) && 
      coords.length === 2 && 
      typeof coords[0] === 'number' && 
      typeof coords[1] === 'number' && 
      !isNaN(coords[0]) && 
      !isNaN(coords[1])
    ) {
      try {
        map.flyTo(coords, zoom || 13, { duration: 1.2 });
      } catch (e) {
        console.warn("MapPanTo flyTo warning:", e);
      }
    }
  }, [coords, zoom, map]);
  return null;
}

export default function GisCommandCenter({ 
  layersData, 
  onSelectZone, 
  selectedZone, 
  onOpenShap, 
  onOpenReport, 
  onOpenRelocationView 
}) {
  // Base map style - default to clean Topographic Map
  const [baseMap, setBaseMap] = useState('terrain'); // 'terrain', 'satellite', 'dark', 'osm'
  
  // Layer visibility toggles
  const [layerVisibility, setLayerVisibility] = useState({
    redZones: true,
    deformation: true,
    villages: true,
    relocationSites: true,
    infrastructure: true,
    evacuationRoute: true
  });

  // Active evacuation route to display
  const [activeEvacRoute, setActiveEvacRoute] = useState(null);
  // Target coordinates for pan (Tamil Nadu Nilgiris Coonoor)
  const [flyCoords, setFlyCoords] = useState([11.3530, 76.7950]);
  // Matched relocation site details when calculated
  const [matchedSite, setMatchedSite] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  const toggleLayer = (layerKey) => {
    setLayerVisibility(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Base Map Tile URLs (100% Free, High Reliability, Zero API Key Required)
  const baseMapTiles = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      subdomains: '',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics'
    },
    terrain: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      subdomains: '',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, USGS, NOAA'
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: 'abc',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };

  // Risk Color Mapping
  const getRiskColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return '#dc2626'; // Red
      case 'HIGH': return '#ea580c'; // Orange
      case 'MODERATE': return '#d97706'; // Amber/Yellow
      case 'LOW': return '#059669'; // Green
      default: return '#2563eb';
    }
  };

  // Deformation Velocity Color
  const getDeformationColor = (vel) => {
    if (vel >= 14.0) return '#dc2626'; // Accelerating Red
    if (vel >= 8.0) return '#ea580c'; // High Orange
    if (vel >= 3.0) return '#d97706'; // Moderate Yellow
    return '#0284c7'; // Stable Cyan
  };

  // Handle Zone Click
  const handleZoneClick = (zoneProp) => {
    if (!zoneProp) return;
    onSelectZone(zoneProp);
    if (typeof zoneProp.center_lat === 'number' && typeof zoneProp.center_lng === 'number') {
      setFlyCoords([zoneProp.center_lat, zoneProp.center_lng]);
    }
    setMatchedSite(null);
    setActiveEvacRoute(null);
  };

  // Handle Find Safe Relocation Matching
  const handleFindRelocation = async () => {
    if (!selectedZone) return;
    setLoadingMatch(true);
    try {
      const res = await fetch(`/api/relocation/recommend/${selectedZone.code}`);
      const data = await res.json();
      if (data?.primary_recommendation) {
        setMatchedSite(data.primary_recommendation);
        if (Array.isArray(data.primary_recommendation.evacuation_route?.waypoints)) {
          setActiveEvacRoute(data.primary_recommendation.evacuation_route.waypoints);
        }
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
      }
    } catch (e) {
      console.error("Relocation recommendation error:", e);
    } finally {
      setLoadingMatch(false);
    }
  };

  // Quick Preset search targets
  const handleQuickLocate = (target) => {
    if (target === 'RZ-014') {
      const zone = layersData?.red_zones?.features?.find(f => f.properties.code === 'ZONE-RZ-014')?.properties;
      if (zone) handleZoneClick(zone);
    } else if (target === 'RZ-002') {
      const zone = layersData?.red_zones?.features?.find(f => f.properties.code === 'ZONE-RZ-002')?.properties;
      if (zone) handleZoneClick(zone);
    } else if (target === 'SITE-07') {
      const site = layersData?.relocation_sites?.features?.find(f => f.properties.code === 'SITE-07')?.properties;
      if (site && typeof site.lat === 'number' && typeof site.lng === 'number') {
        setFlyCoords([site.lat, site.lng]);
      }
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-95px)] bg-[#f8fafc] flex overflow-hidden">
      {/* Map Area */}
      <div className="flex-1 h-full relative">
        <MapContainer
          center={[11.3500, 76.7900]}
          zoom={11}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapPanTo coords={flyCoords} zoom={selectedZone ? 13 : 11} />

          {/* Dynamic Base Map Tile with Clean Remount */}
          <TileLayer
            key={baseMap}
            url={baseMapTiles[baseMap]?.url || baseMapTiles.terrain.url}
            subdomains={baseMapTiles[baseMap]?.subdomains || 'abcd'}
            attribution={baseMapTiles[baseMap]?.attribution}
            maxZoom={19}
          />

          {/* 1. Red Zones & Multi-Hazard Polygons */}
          {layerVisibility.redZones && layersData?.red_zones?.features?.map((feature, idx) => {
            const props = feature.properties;
            const geom = feature.geometry;
            if (!props || !geom || !geom.coordinates) return null;

            const polyCoords = geom.coordinates[0]?.map(coord => [coord[1], coord[0]]) || [];
            if (polyCoords.length === 0) return null;

            const isSelected = selectedZone?.code === props.code;
            const color = getRiskColor(props.risk_level);

            return (
              <Polygon
                key={`zone-${props.code}-${idx}`}
                positions={polyCoords}
                pathOptions={{
                  color: isSelected ? '#0f172a' : color,
                  weight: isSelected ? 3.5 : 2,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.65 : 0.35,
                  dashArray: props.risk_level === 'CRITICAL' ? '4, 4' : null,
                }}
                eventHandlers={{
                  click: () => handleZoneClick(props)
                }}
              >
                <Popup>
                  <div className="text-xs p-1 text-slate-900 min-w-[200px]">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-1.5">
                      <span className="font-black text-amber-700">{props.code}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black text-white uppercase" style={{ backgroundColor: color }}>
                        {props.risk_level}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-950">{props.name}</div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-slate-700">
                      <div>Risk Score: <strong className="text-slate-950">{props.risk_score}/100</strong></div>
                      <div>Population: <strong className="text-slate-950">{props.population?.toLocaleString()}</strong></div>
                      <div>Deformation: <strong className="text-red-600">{props.deformation_rate} mm/yr</strong></div>
                      <div>Slope: <strong className="text-slate-950">{props.slope}°</strong></div>
                    </div>
                    <button
                      onClick={() => handleZoneClick(props)}
                      className="mt-2 w-full py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                    >
                      Inspect Zone Details & Relocation
                    </button>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* 2. PSInSAR Deformation Points */}
          {layerVisibility.deformation && layersData?.deformation_points?.features?.map((dp, idx) => {
            const p = dp.properties;
            const lat = dp.geometry?.coordinates?.[1];
            const lng = dp.geometry?.coordinates?.[0];
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            const isCritical = p?.status === 'Accelerating' || (p?.velocity_mm_yr || 0) > 15;
            const color = getDeformationColor(p?.velocity_mm_yr || 0);

            return (
              <CircleMarker
                key={`dp-${p?.point_code || idx}`}
                center={[lat, lng]}
                radius={isCritical ? 6 : 4}
                pathOptions={{
                  color: isCritical ? '#ffffff' : color,
                  weight: isCritical ? 2 : 1,
                  fillColor: color,
                  fillOpacity: 0.9
                }}
              >
                <Popup>
                  <div className="text-xs p-1 text-slate-900 min-w-[180px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="font-mono font-black text-amber-700">{p?.point_code}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isCritical ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {p?.status}
                      </span>
                    </div>
                    <div className="text-[11px]">Velocity: <strong className="text-red-600 font-bold">{p?.velocity_mm_yr > 0 ? `+${p.velocity_mm_yr}` : p?.velocity_mm_yr} mm/year</strong></div>
                    <div className="text-[10px] text-slate-600">Coherence: {p?.coherence} | Orbit: {p?.orbit_track}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 3. Relocation Candidate Townships */}
          {layerVisibility.relocationSites && layersData?.relocation_sites?.features?.map((site, idx) => {
            const sp = site.properties;
            const lat = site.geometry?.coordinates?.[1];
            const lng = site.geometry?.coordinates?.[0];
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            return (
              <CircleMarker
                key={`site-${sp?.code || idx}`}
                center={[lat, lng]}
                radius={8}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: '#059669',
                  fillOpacity: 0.95
                }}
              >
                <Popup>
                  <div className="text-xs p-1 text-slate-900 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="font-bold text-emerald-800">{sp?.code}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        {sp?.status || 'Suitable'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-950">{sp?.name}</div>
                    <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px] text-slate-700">
                      <div>Suitability: <strong className="text-emerald-700 font-bold">{sp?.suitability_score}/100</strong></div>
                      <div>ECC Capacity: <strong className="text-emerald-700 font-bold">{sp?.ecc?.toLocaleString()}</strong></div>
                      <div>Slope: <strong className="text-slate-950">{sp?.slope}°</strong></div>
                      <div>Access: <strong className="text-slate-950">{sp?.road_accessibility}</strong></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 4. Villages & Habitations */}
          {layerVisibility.villages && layersData?.villages?.features?.map((v, idx) => {
            const vp = v.properties;
            const lat = v.geometry?.coordinates?.[1];
            const lng = v.geometry?.coordinates?.[0];
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            const isHighVuln = (vp?.hazard_score || 0) >= 75;

            return (
              <CircleMarker
                key={`village-${vp?.code || idx}`}
                center={[lat, lng]}
                radius={isHighVuln ? 4.5 : 3.5}
                pathOptions={{
                  color: isHighVuln ? '#ea580c' : '#64748b',
                  weight: 1,
                  fillColor: isHighVuln ? '#ea580c' : '#94a3b8',
                  fillOpacity: 0.8
                }}
              >
                <Popup>
                  <div className="text-xs p-1 text-slate-900 min-w-[170px]">
                    <div className="font-bold text-amber-800">{vp?.name}</div>
                    <div className="text-[10px] text-slate-600">Block: {vp?.block}</div>
                    <div className="mt-1 text-[10px]">
                      <div>Population: <strong className="text-slate-950">{vp?.population?.toLocaleString()}</strong> ({vp?.households} HH)</div>
                      <div>Vulnerability: <strong className="text-amber-700">{vp?.vulnerability_score}/100</strong></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 5. Critical Infrastructure */}
          {layerVisibility.infrastructure && layersData?.infrastructure?.features?.map((inf, idx) => {
            const ip = inf.properties;
            const lat = inf.geometry?.coordinates?.[1];
            const lng = inf.geometry?.coordinates?.[0];
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            return (
              <CircleMarker
                key={`infra-${idx}`}
                center={[lat, lng]}
                radius={5}
                pathOptions={{
                  color: '#ffffff',
                  weight: 1.5,
                  fillColor: ip?.type === 'Hospital' ? '#dc2626' : ip?.type === 'School' ? '#2563eb' : '#7c3aed',
                  fillOpacity: 0.95
                }}
              >
                <Popup>
                  <div className="text-xs p-1 text-slate-900">
                    <div className="font-bold text-slate-950">{ip?.name}</div>
                    <div className="text-[10px] text-slate-600">Type: {ip?.type}</div>
                    {ip?.capacity_beds && <div className="text-[10px]">Bed Capacity: {ip.capacity_beds}</div>}
                    {ip?.shelter_capacity && <div className="text-[10px]">Shelter Space: {ip.shelter_capacity} people</div>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 6. Active Evacuation Corridor Polyline */}
          {layerVisibility.evacuationRoute && activeEvacRoute && Array.isArray(activeEvacRoute) && activeEvacRoute.length > 1 && (
            <Polyline
              positions={activeEvacRoute}
              pathOptions={{
                color: '#0284c7',
                weight: 5,
                opacity: 0.9,
                dashArray: '8, 8',
                lineCap: 'round'
              }}
            />
          )}
        </MapContainer>

        {/* Floating Top Controls Overlay */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
          {/* Nilgiris Western Ghats Sector Focus Presets */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border-2 border-slate-300 shadow-xl">
            <span className="text-[11px] font-mono font-black text-slate-800 px-2 flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5 text-amber-600" />
              NILGIRIS GHATS:
            </span>
            <button
              onClick={() => handleQuickLocate('RZ-014')}
              className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 text-xs font-black border border-red-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>RZ-014 (Coonoor Ghats)</span>
            </button>
            <button
              onClick={() => handleQuickLocate('RZ-002')}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black border border-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>RZ-002 (Kotagiri Kattery)</span>
            </button>
            <button
              onClick={() => handleQuickLocate('SITE-07')}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-black border border-emerald-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>SITE-07 (Mettupalayam Safe Zone)</span>
            </button>
          </div>

          {/* Base Map Switcher */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border-2 border-slate-300 shadow-xl">
            <button
              onClick={() => setBaseMap('terrain')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                baseMap === 'terrain' ? 'bg-red-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Topographic
            </button>
            <button
              onClick={() => setBaseMap('osm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                baseMap === 'osm' ? 'bg-red-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Street Map
            </button>
            <button
              onClick={() => setBaseMap('satellite')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                baseMap === 'satellite' ? 'bg-red-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBaseMap('dark')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                baseMap === 'dark' ? 'bg-red-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Dark Mode
            </button>
          </div>
        </div>

        {/* Floating Bottom Left Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-slate-300 shadow-2xl max-w-xs text-xs text-slate-900">
          <div className="font-black text-slate-900 mb-2 flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <span className="font-heading">Nilgiris Layer Control</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500">TNDMA 2026</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-bold">
            <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950">
              <input
                type="checkbox"
                checked={layerVisibility.redZones}
                onChange={() => toggleLayer('redZones')}
                className="rounded text-red-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                Red Zones
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950">
              <input
                type="checkbox"
                checked={layerVisibility.deformation}
                onChange={() => toggleLayer('deformation')}
                className="rounded text-amber-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                PSInSAR Points
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950">
              <input
                type="checkbox"
                checked={layerVisibility.relocationSites}
                onChange={() => toggleLayer('relocationSites')}
                className="rounded text-emerald-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Relocation Sites
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950">
              <input
                type="checkbox"
                checked={layerVisibility.villages}
                onChange={() => toggleLayer('villages')}
                className="rounded text-yellow-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                Habitations
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950">
              <input
                type="checkbox"
                checked={layerVisibility.infrastructure}
                onChange={() => toggleLayer('infrastructure')}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Infrastructure
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-950">
              <input
                type="checkbox"
                checked={layerVisibility.evacuationRoute}
                onChange={() => toggleLayer('evacuationRoute')}
                className="rounded text-sky-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-sky-500 rounded" />
                Safe Route
              </span>
            </label>
          </div>

          {/* Risk Level Color Bar */}
          <div className="mt-2.5 pt-2 border-t border-slate-200">
            <div className="text-[10px] text-slate-600 font-bold mb-1 font-mono uppercase">Risk Classification:</div>
            <div className="flex items-center justify-between text-[10px] font-mono font-black">
              <span className="flex items-center gap-1 text-emerald-700"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Low</span>
              <span className="flex items-center gap-1 text-yellow-700"><span className="w-2.5 h-2.5 rounded bg-yellow-400" /> Moderate</span>
              <span className="flex items-center gap-1 text-amber-700"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> High</span>
              <span className="flex items-center gap-1 text-red-700"><span className="w-2.5 h-2.5 rounded bg-red-600" /> Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Inspector & Decision Side Panel */}
      <div className="w-96 lg:w-[430px] h-full bg-white border-l-2 border-slate-300 flex flex-col justify-between shadow-2xl z-20 overflow-y-auto text-slate-900">
        {selectedZone ? (
          <div className="p-5 flex flex-col gap-4">
            {/* Header with Close and Risk Badge */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">{selectedZone.code}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm ${
                    selectedZone.risk_level === 'CRITICAL' ? 'bg-red-600 animate-pulse' :
                    selectedZone.risk_level === 'HIGH' ? 'bg-amber-600' :
                    selectedZone.risk_level === 'MODERATE' ? 'bg-yellow-600' : 'bg-emerald-600'
                  }`}>
                    {selectedZone.risk_level}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-950 mt-1 leading-snug">{selectedZone.name}</h3>
              </div>
              <button 
                onClick={() => onSelectZone(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 shadow-sm">
                <div className="text-[10px] text-red-800 uppercase font-mono font-black">Overall Hazard Risk</div>
                <div className="text-2xl font-black text-red-600 mt-0.5">{selectedZone.risk_score} <span className="text-xs font-semibold text-slate-600">/ 100</span></div>
                <div className="text-[10px] text-red-800 font-bold mt-0.5">Susceptibility: {Math.round((selectedZone.susceptibility_score || 0.91) * 100)}%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-sm">
                <div className="text-[10px] text-amber-800 uppercase font-mono font-black">Ground Deformation</div>
                <div className="text-2xl font-black text-amber-700 mt-0.5">{selectedZone.deformation_rate > 0 ? `+${selectedZone.deformation_rate}` : selectedZone.deformation_rate} <span className="text-xs font-semibold text-slate-600">mm/yr</span></div>
                <div className="text-[10px] text-red-700 font-black mt-0.5">⚠️ Accelerating Subsidence</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-700 uppercase font-mono font-black">Population at Risk</div>
                <div className="text-2xl font-black text-slate-950 mt-0.5">{selectedZone.population?.toLocaleString()}</div>
                <div className="text-[10px] text-slate-600 font-medium mt-0.5">{selectedZone.buildings} Structures / Bldgs</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-yellow-50 border-2 border-yellow-200 shadow-sm">
                <div className="text-[10px] text-yellow-800 uppercase font-mono font-black">Vulnerability Index</div>
                <div className="text-2xl font-black text-amber-700 mt-0.5">{selectedZone.vulnerability_score || 88}/100</div>
                <div className="text-[10px] text-red-700 font-bold mt-0.5">High Socio-Economic Risk</div>
              </div>
            </div>

            {/* Environmental Factors Detail List */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs">
              <div className="text-[11px] font-black text-slate-950 uppercase tracking-wider mb-2.5 flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span>Western Ghats Conditioning Factors</span>
                <span className="text-[10px] font-mono font-bold text-amber-700">WoE Weighted</span>
              </div>
              <div className="space-y-2 text-slate-800 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-600">Terrain Slope Angle:</span>
                  <strong className="text-slate-950 font-black">{selectedZone.slope}° (Steep Ghat Scarp)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Monsoon Rainfall Exposure:</span>
                  <strong className="text-amber-800 font-bold">{selectedZone.rainfall} mm/season</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Distance to River / Ravine:</span>
                  <strong className="text-slate-950 font-bold">{selectedZone.distance_to_river} meters</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Lithology / Geology:</span>
                  <strong className="text-slate-950 text-right max-w-[190px] truncate">{selectedZone.geology || 'Precambrian Charnockite / Gneiss'}</strong>
                </div>
              </div>
            </div>

            {/* Recommended Action Box */}
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-xs shadow-sm">
              <div className="text-[10px] font-mono font-black text-red-800 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                TNDMA Recommended Action Directive
              </div>
              <p className="mt-1.5 font-bold text-red-950 leading-relaxed">
                "{selectedZone.recommended_action || 'Priority pre-disaster relocation'}"
              </p>
            </div>

            {/* Key Action 1: Explain with SHAP Modal */}
            <button
              onClick={() => onOpenShap(selectedZone)}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs border-2 border-slate-300 flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Why Critical?</span> <span className="text-amber-700 font-mono font-bold">(TreeSHAP Explainability)</span>
            </button>

            {/* Key Action 2: Trigger Proactive Relocation Matching */}
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-md">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  Proactive Relocation Decision
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  AHP + MCDA
                </span>
              </div>

              {!matchedSite ? (
                <button
                  onClick={handleFindRelocation}
                  disabled={loadingMatch}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/40"
                >
                  {loadingMatch ? (
                    <span>Evaluating 15 Candidate Sites & Route...</span>
                  ) : (
                    <>
                      <span className="text-sm font-black">Find Safe Relocation Site</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white border-2 border-emerald-300 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-900 text-sm">{matchedSite.site_code}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                        Suitability: {matchedSite.suitability_score}/100
                      </span>
                    </div>
                    <div className="font-bold text-slate-950 text-sm mt-1">{matchedSite.site_name}</div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[11px] text-slate-700">
                      <div>Safety Index: <strong className="text-emerald-700">{matchedSite.safety_score}/100</strong></div>
                      <div>ECC Capacity: <strong className="text-emerald-700 font-bold">{matchedSite.ecc?.toLocaleString()}</strong></div>
                      <div>Distance: <strong className="text-slate-950">{matchedSite.distance_km} km</strong></div>
                      <div>Transit Time: <strong className="text-amber-800 font-bold">~{matchedSite.estimated_travel_time_mins} mins</strong></div>
                    </div>
                    <div className="mt-2.5 p-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-[11px] text-emerald-900 font-bold flex items-center gap-1.5">
                      <span>✅ Capacity Surplus: +{matchedSite.capacity_surplus} persons (ADEQUATE)</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onOpenRelocationView(selectedZone.code)}
                      className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border-2 border-slate-300 transition-colors cursor-pointer"
                    >
                      Compare Sites
                    </button>
                    <button
                      onClick={() => onOpenReport(selectedZone.code)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-95 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer border border-white/40"
                    >
                      <FileText className="w-4 h-4 text-white" />
                      <span>Decision Report</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-600">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-md">
              <Mountain className="w-8 h-8 opacity-90" />
            </div>
            <h4 className="font-heading font-black text-slate-950 text-lg">Nilgiris Ghats Hazard Explorer</h4>
            <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed font-medium">
              Click on any hazard polygon or PSInSAR point across the Nilgiris Western Ghats to inspect ground deformation, TreeSHAP attributions, and compute automated safe relocation.
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={() => handleQuickLocate('RZ-014')}
                className="w-full py-2.5 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-900 font-bold text-xs border-2 border-red-300 flex items-center justify-between transition-colors shadow-sm cursor-pointer"
              >
                <span>Target 1: ZONE-RZ-014 (Coonoor Ghats)</span>
                <ChevronRight className="w-4 h-4 text-red-600" />
              </button>
              <button
                onClick={() => handleQuickLocate('RZ-002')}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center justify-between transition-colors shadow-sm cursor-pointer"
              >
                <span>Target 2: ZONE-RZ-002 (Kotagiri Kattery)</span>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </button>
              <button
                onClick={() => handleQuickLocate('SITE-07')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center justify-between transition-colors shadow-sm cursor-pointer"
              >
                <span>Safe Site: SITE-07 (Mettupalayam)</span>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 border-t-2 border-slate-200 bg-slate-50 text-[10px] font-mono font-bold text-slate-600 flex items-center justify-between">
          <span>Nilgiris Western Ghats Sentinel-1 SAR</span>
          <span>EPSG:4326 WGS84</span>
        </div>
      </div>
    </div>
  );
}
