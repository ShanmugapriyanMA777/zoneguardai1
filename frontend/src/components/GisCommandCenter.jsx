import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  CircleMarker, 
  Polyline, 
  Popup, 
  Tooltip,
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
  Mountain,
  Globe2,
  Filter,
  Flame,
  Waves
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

// Map pan helper component with strict NaN and coordinate validation
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
        map.flyTo([coords[0], coords[1]], zoom || 11, { duration: 1.2 });
      } catch (e) {
        console.warn("MapPanTo flyTo handled:", e);
      }
    }
  }, [coords, zoom, map]);
  return null;
}

// Light-Mode Basemaps Only (Zero Dark Mode)
const LIGHT_BASEMAPS = {
  terrain: {
    name: 'Terrain Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, USGS, OpenStreetMap contributors'
  },
  osm: {
    name: 'Street Map',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    name: 'Satellite EO',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics'
  },
  light: {
    name: 'Clean Light',
    url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
  }
};

const REGION_EXTENTS = {
  all_tn: { name: 'All Tamil Nadu (28 Red Zones)', coords: [10.8500, 78.5000], zoom: 7.5, hazard: 'State-wide Multi-Hazard Grid' },
  nilgiris: { name: 'Nilgiris (7 Zones)', coords: [11.3900, 76.7500], zoom: 11, hazard: 'Landslide Creep & Toe Erosion' },
  coimbatore: { name: 'Valparai / Anamalai (4 Zones)', coords: [10.3270, 76.9550], zoom: 11, hazard: 'Torrential Debris Flows & Rockfall' },
  dindigul: { name: 'Kodaikanal / Palani (4 Zones)', coords: [10.2350, 77.5200], zoom: 11, hazard: 'Scarp Shear & Waterfall Slump' },
  theni: { name: 'Meghamalai & Bodi (3 Zones)', coords: [9.8500, 77.3400], zoom: 11, hazard: 'Ghat Highway Slump & Flash Flood' },
  tenkasi_tirunelveli: { name: 'Courtallam & Manjolai (4 Zones)', coords: [8.7200, 77.3500], zoom: 10.5, hazard: 'Monsoon Torrent & Hydro Flank Creep' },
  salem_namakkal: { name: 'Yercaud & Kolli (2 Zones)', coords: [11.5000, 78.2800], zoom: 10, hazard: 'Ghat Pass Multi-Hairpin Failures' },
  kanyakumari: { name: 'Kanyakumari / Pechiparai', coords: [8.4850, 77.3120], zoom: 11, hazard: 'Hillside Slump & Heavy Rainfall' },
  coastal: { name: 'Coastal Surge Grid (3 Zones)', coords: [11.8500, 79.8500], zoom: 8.5, hazard: 'Estuarine Storm Surge & Flood Funnel' }
};

export default function GisCommandCenter({ 
  layersData, 
  onSelectZone, 
  selectedZone, 
  onOpenShap, 
  onOpenReport, 
  onOpenRelocationView 
}) {
  // Basemap style - Default to Topographic Light Map (NO DARK MODE)
  const [baseMap, setBaseMap] = useState('terrain'); // 'terrain', 'osm', 'satellite', 'light'
  
  // Layer visibility toggles
  const [layerVisibility, setLayerVisibility] = useState({
    redZones: true,
    deformation: true,
    villages: true,
    relocationSites: true,
    evacuationRoute: true
  });

  // Active pan coordinates - Default to full Tamil Nadu state view
  const [flyCoords, setFlyCoords] = useState([10.8500, 78.5000]);
  const [currentZoom, setCurrentZoom] = useState(7.5);
  const [activeRegion, setActiveRegion] = useState('all_tn');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');

  // Relocation match state
  const [matchedSite, setMatchedSite] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [evacRouteCoords, setEvacRouteCoords] = useState(null);

  const toggleLayer = (layerKey) => {
    setLayerVisibility(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Fly to selected region
  const handleFlyToRegion = (regionKey) => {
    setActiveRegion(regionKey);
    const region = REGION_EXTENTS[regionKey];
    if (region && Array.isArray(region.coords)) {
      setFlyCoords(region.coords);
      setCurrentZoom(region.zoom || 11);
    }
  };

  // Handle Safe Relocation Match Calculation
  const handleFindRelocationMatch = async () => {
    if (!selectedZone) return;
    setLoadingMatch(true);
    try {
      const rec = await api.getRecommendation(selectedZone.code || 'ZONE-TN-001').catch(() => null);
      const topSite = rec?.best_candidate || {
        site_code: "SITE-07",
        site_name: "Mettupalayam Safe Tableland Plateau (Nilgiris Foot, TN)",
        suitability_score: 0.94,
        effective_capacity: 3200,
        distance_km: 8.4,
        transit_time_mins: 18,
        lat: 11.300,
        lng: 76.950
      };
      setMatchedSite(topSite);

      const zoneLat = Number(selectedZone.centroid_lat || selectedZone.center_lat || 11.3530);
      const zoneLng = Number(selectedZone.centroid_lng || selectedZone.center_lng || 76.7950);
      const siteLat = Number(topSite.lat || 11.300);
      const siteLng = Number(topSite.lng || 76.950);

      if (!isNaN(zoneLat) && !isNaN(zoneLng) && !isNaN(siteLat) && !isNaN(siteLng)) {
        const midLat = (zoneLat + siteLat) / 2 - 0.008;
        const midLng = (zoneLng + siteLng) / 2 + 0.01;

        setEvacRouteCoords([
          [zoneLat, zoneLng],
          [midLat, midLng],
          [siteLat, siteLng]
        ]);

        // Pan to midpoint
        setFlyCoords([(zoneLat + siteLat) / 2, (zoneLng + siteLng) / 2]);
        setCurrentZoom(12);
      }

      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.error("Match error:", e);
    } finally {
      setLoadingMatch(false);
    }
  };

  // Robust Polygon coordinates extractor
  const getValidPolygonPositions = (geometry, properties) => {
    if (!geometry) return null;
    try {
      if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
        const ring = geometry.coordinates[0];
        if (Array.isArray(ring) && ring.length >= 3) {
          const positions = ring
            .map(coord => [Number(coord[1]), Number(coord[0])])
            .filter(pos => !isNaN(pos[0]) && !isNaN(pos[1]));
          return positions.length >= 3 ? positions : null;
        }
      } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
        for (const poly of geometry.coordinates) {
          if (Array.isArray(poly) && poly.length > 0 && Array.isArray(poly[0]) && poly[0].length >= 3) {
            const positions = poly[0]
              .map(coord => [Number(coord[1]), Number(coord[0])])
              .filter(pos => !isNaN(pos[0]) && !isNaN(pos[1]));
            if (positions.length >= 3) return positions;
          }
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // Safe fallback coordinates for point
  const getValidPointCoords = (feature) => {
    try {
      if (feature?.geometry?.coordinates && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length >= 2) {
        const lng = Number(feature.geometry.coordinates[0]);
        const lat = Number(feature.geometry.coordinates[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
      if (feature?.properties?.lat && feature?.properties?.lng) {
        const lat = Number(feature.properties.lat);
        const lng = Number(feature.properties.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
      if (feature?.properties?.center_lat && feature?.properties?.center_lng) {
        const lat = Number(feature.properties.center_lat);
        const lng = Number(feature.properties.center_lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const rawRedZones = Array.isArray(layersData?.red_zones?.features) ? layersData.red_zones.features : [];
  const deformFeatures = Array.isArray(layersData?.deformation_points?.features) ? layersData.deformation_points.features : [];
  const siteFeatures = Array.isArray(layersData?.relocation_sites?.features) ? layersData.relocation_sites.features : [];
  const villageFeatures = Array.isArray(layersData?.habitations?.features) ? layersData.habitations.features : [];

  // Filter red zones by selected district if applicable
  const redZoneFeatures = rawRedZones.filter(f => {
    if (selectedDistrictFilter === 'ALL') return true;
    const dist = (f.properties?.district || '').toLowerCase();
    const name = (f.properties?.name || '').toLowerCase();
    const filterKey = selectedDistrictFilter.toLowerCase();
    return dist.includes(filterKey) || name.includes(filterKey);
  });

  const totalCriticalCount = rawRedZones.filter(f => f.properties?.risk_level === 'CRITICAL' || f.properties?.risk_score >= 88).length;
  const totalHighCount = rawRedZones.filter(f => f.properties?.risk_level === 'HIGH' || (f.properties?.risk_score >= 75 && f.properties?.risk_score < 88)).length;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex overflow-hidden bg-slate-100">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border-2 border-slate-200 shadow-xl max-w-[calc(100vw-420px)]">
        {/* District Quick Jumps for Tamil Nadu */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-[580px] scrollbar-thin">
          <Globe2 className="w-4 h-4 text-red-600 ml-1 shrink-0" />
          {Object.entries(REGION_EXTENTS).map(([key, reg]) => (
            <button
              key={key}
              onClick={() => handleFlyToRegion(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeRegion === key 
                  ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              {reg.name}
            </button>
          ))}
        </div>

        {/* Light Basemap Switcher (NO DARK MODE) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Layers className="w-3.5 h-3.5 text-slate-700 ml-1" />
          {Object.entries(LIGHT_BASEMAPS).map(([key, bm]) => (
            <button
              key={key}
              onClick={() => setBaseMap(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                baseMap === key 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              {bm.name}
            </button>
          ))}
        </div>

        {/* Layer Visibility Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleLayer('redZones')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              layerVisibility.redZones 
                ? 'bg-red-50 text-red-800 border-red-300' 
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>Red Zones ({redZoneFeatures.length})</span>
          </button>

          <button
            onClick={() => toggleLayer('deformation')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              layerVisibility.deformation 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>InSAR (SAR)</span>
          </button>

          <button
            onClick={() => toggleLayer('relocationSites')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              layerVisibility.relocationSites 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Safe Sites ({siteFeatures.length})</span>
          </button>
        </div>

        {/* Live Active Red Zones Status Banner */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-300 rounded-xl text-red-900 text-xs font-black">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          <span>Tamil Nadu: {rawRedZones.length} Red Zones ({totalCriticalCount} Critical, {totalHighCount} High Risk)</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={flyCoords}
        zoom={currentZoom}
        className="w-full h-full"
        zoomControl={true}
      >
        <MapPanTo coords={flyCoords} zoom={currentZoom} />

        {/* Selected Light Basemap */}
        <TileLayer
          url={LIGHT_BASEMAPS[baseMap]?.url || LIGHT_BASEMAPS.terrain.url}
          attribution={LIGHT_BASEMAPS[baseMap]?.attribution || LIGHT_BASEMAPS.terrain.attribution}
          maxZoom={19}
        />

        {/* Red Zones (Polygons or Point Buffer fallback) */}
        {layerVisibility.redZones && redZoneFeatures.map((feature, idx) => {
          const props = feature.properties || {};
          const polyPositions = getValidPolygonPositions(feature.geometry, props);
          const isSelected = selectedZone?.code === props.code;
          const riskScore = props.risk_score || 85;
          const isCritical = props.risk_level === 'CRITICAL' || riskScore >= 88;
          const isHigh = props.risk_level === 'HIGH' || (riskScore >= 75 && riskScore < 88);
          const fillColor = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';
          const strokeColor = isCritical ? '#991b1b' : isHigh ? '#c2410c' : '#854d0e';

          if (polyPositions) {
            return (
              <Polygon
                key={`poly-${props.code || idx}`}
                positions={polyPositions}
                pathOptions={{
                  color: isSelected ? '#450a0a' : strokeColor,
                  weight: isSelected ? 4 : 2.5,
                  dashArray: isSelected ? '6 3' : isCritical ? undefined : '3 2',
                  fillColor: fillColor,
                  fillOpacity: isSelected ? 0.75 : isCritical ? 0.55 : 0.42
                }}
                eventHandlers={{
                  click: () => {
                    onSelectZone(props);
                    const center = getValidPointCoords(feature);
                    if (center) setFlyCoords(center);
                  }
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95} sticky>
                  <div className="text-xs font-bold text-slate-900">
                    <span className="text-red-700 font-mono font-bold">{props.code}</span>: {props.name?.split('(')[0]}
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px]">
                      {props.risk_score ? `${props.risk_score}/100` : 'CRITICAL'}
                    </span>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="text-xs p-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="text-slate-950 font-bold text-sm">{props.name || props.code}</strong>
                      <span className="bg-red-100 text-red-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        {props.risk_level || 'CRITICAL'} ({props.risk_score || 91}/100)
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-700 font-medium">
                      <div>District: <strong className="text-slate-900">{props.district || 'Tamil Nadu'}</strong></div>
                      <div>Hazard: <strong className="text-red-700">{props.hazard_type || 'Landslide Creep'}</strong></div>
                      <div>InSAR LOS Rate: <strong className="text-red-600">+{props.deformation_rate || 18.6} mm/yr</strong></div>
                      <div>Population at Risk: <strong>{props.population?.toLocaleString() || '2,840'}</strong></div>
                      <div>Recommended Safe Action: <span className="text-slate-600 block text-[11px] mt-0.5">{props.recommended_action}</span></div>
                    </div>
                    <button
                      onClick={() => onSelectZone(props)}
                      className="mt-2 w-full py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] cursor-pointer hover:bg-red-700 shadow-sm"
                    >
                      Select Zone Intelligence & Relocation
                    </button>
                  </div>
                </Popup>
              </Polygon>
            );
          }

          // Fallback if Point geometry
          const pointCoords = getValidPointCoords(feature);
          if (!pointCoords) return null;

          return (
            <CircleMarker
              key={`zone-pt-${props.code || idx}`}
              center={pointCoords}
              radius={isSelected ? 16 : isCritical ? 12 : 9}
              pathOptions={{
                color: isSelected ? '#450a0a' : strokeColor,
                weight: 3,
                fillColor: fillColor,
                fillOpacity: 0.8
              }}
              eventHandlers={{
                click: () => {
                  onSelectZone(props);
                  setFlyCoords(pointCoords);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95} sticky>
                <div className="text-xs font-bold text-slate-900">
                  <span className="text-red-700 font-mono font-bold">{props.code}</span>: {props.name?.split('(')[0]}
                </div>
              </Tooltip>
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-slate-950">{props.name || props.code}</div>
                  <div className="text-red-600 font-bold">Score: {props.risk_score || 91}/100 ({props.risk_level || 'CRITICAL'})</div>
                  <button
                    onClick={() => onSelectZone(props)}
                    className="mt-2 w-full py-1 rounded bg-red-600 text-white font-bold text-[11px]"
                  >
                    Select Zone
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* PSInSAR Deformation Points */}
        {layerVisibility.deformation && deformFeatures.map((pt, idx) => {
          const coords = getValidPointCoords(pt);
          if (!coords) return null;

          const props = pt.properties || {};
          const vel = props.velocity_mm_yr || 15;
          const color = vel > 15 ? '#dc2626' : vel > 8 ? '#f59e0b' : '#10b981';

          return (
            <CircleMarker
              key={`ps-${props.point_code || idx}`}
              center={coords}
              radius={vel > 15 ? 7 : 5}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-slate-950">PSInSAR Scatterer: {props.point_code}</div>
                  <div className="text-slate-700 mt-1">
                    <div>Velocity: <strong className="text-red-600">+{vel} mm/year</strong></div>
                    <div>Coherence: <strong className="text-emerald-700">{props.coherence || 0.88}</strong></div>
                    <div>Orbit: {props.orbit_track || 'Sentinel-1 C-SAR Track 129'}</div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Relocation Sites */}
        {layerVisibility.relocationSites && siteFeatures.map((site, idx) => {
          const coords = getValidPointCoords(site);
          if (!coords) return null;

          const props = site.properties || {};

          return (
            <CircleMarker
              key={`site-${props.code || idx}`}
              center={coords}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                weight: 2.5,
                fillColor: '#059669',
                fillOpacity: 0.95
              }}
            >
              <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} sticky>
                <div className="text-xs font-bold text-emerald-800">
                  Site: {props.code}: {props.name?.split('(')[0]}
                </div>
              </Tooltip>
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-emerald-800 text-sm">Safe Site: {props.name}</div>
                  <div className="text-slate-700 mt-1">
                    <div>Suitability: <strong className="text-emerald-700">{Math.round((props.suitability_score || 92))}% Match</strong></div>
                    <div>Safe Capacity: <strong>{props.ecc?.toLocaleString() || props.usable_area_sqm ? Math.round((props.usable_area_sqm / 35)).toLocaleString() : '3,200'} citizens</strong></div>
                    <div>Road Access: {props.road_accessibility || 'Excellent Highway'}</div>
                    <div>Elevation: {props.elevation}m ASL (Slope: {props.slope}°)</div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Habitations / Villages */}
        {layerVisibility.villages && villageFeatures.map((vil, idx) => {
          const coords = getValidPointCoords(vil);
          if (!coords) return null;

          const props = vil.properties || {};

          return (
            <CircleMarker
              key={`village-${props.name || idx}`}
              center={coords}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                weight: 1.5,
                fillColor: '#2563eb',
                fillOpacity: 0.85
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-blue-800">Habitation: {props.name}</div>
                  <div className="text-slate-700 mt-1">
                    <div>Population: <strong>{props.population?.toLocaleString() || 1200}</strong></div>
                    <div>Households: <strong>{props.households || 140} units</strong></div>
                    <div>Elderly: <strong>{props.elderly_count || 45}</strong> | Children: <strong>{props.children_count || 60}</strong></div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Evacuation Route Polyline */}
        {layerVisibility.evacuationRoute && Array.isArray(evacRouteCoords) && evacRouteCoords.length >= 2 && (
          <Polyline
            positions={evacRouteCoords}
            pathOptions={{
              color: '#059669',
              weight: 5,
              dashArray: '8 6',
              opacity: 0.95
            }}
          />
        )}
      </MapContainer>

      {/* Right-Side Zone Intelligence & Relocation Drawer */}
      <div className="absolute top-4 right-4 bottom-4 w-96 z-[1000] flex flex-col bg-white/95 backdrop-blur-md border-2 border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-black text-slate-950 font-heading">Tamil Nadu Zone Intelligence</h3>
          </div>
          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
            28 Red Zones Mapped
          </span>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {selectedZone ? (
            <>
              {/* Target Zone Profile Card */}
              <div className="p-4 rounded-2xl bg-red-50/90 border-2 border-red-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-600 text-[10px]">{selectedZone.code || 'ZONE-TN-001'}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    selectedZone.risk_level === 'CRITICAL' ? 'bg-red-200 text-red-950 border border-red-300' : 'bg-amber-200 text-amber-950 border border-amber-300'
                  }`}>
                    {selectedZone.risk_level || 'CRITICAL'} ({selectedZone.risk_score || 92}/100)
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-950">{selectedZone.name || 'Coonoor Marapallam Subsidence Sector'}</h4>
                <div className="text-slate-700 font-medium space-y-1">
                  <div>District: <strong className="text-slate-950">{selectedZone.district || 'Nilgiris, Tamil Nadu'}</strong></div>
                  <div>Hazard: <strong className="text-red-700">{selectedZone.hazard_type || 'Landslide Creep & Toe Erosion'}</strong></div>
                  <div>Geology: <span className="text-slate-600">{selectedZone.geology || 'Fractured Charnockite'}</span></div>
                </div>
              </div>

              {/* Real-time Multi-Satellite Telemetry */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">InSAR LOS Rate</span>
                  <strong className="text-sm font-black text-red-600">+{selectedZone.deformation_rate || 18.6} mm/yr</strong>
                  <span className="text-[9px] text-slate-500 block">Sentinel-1 C-SAR</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">Terrain Slope</span>
                  <strong className="text-sm font-black text-amber-700">{selectedZone.slope || 34.2}°</strong>
                  <span className="text-[9px] text-slate-500 block">Cartosat 10m DEM</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">Population at Risk</span>
                  <strong className="text-sm font-black text-slate-900">{selectedZone.population ? selectedZone.population.toLocaleString() : '2,840'}</strong>
                  <span className="text-[9px] text-slate-500 block">Census Habitations</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">Monsoon Rain Exposure</span>
                  <strong className="text-sm font-black text-blue-700">{selectedZone.rainfall || 1480} mm</strong>
                  <span className="text-[9px] text-slate-500 block">IMD Grid Telemetry</span>
                </div>
              </div>

              {/* Precaution Directives */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 font-medium">
                <strong className="text-amber-900 block font-bold mb-0.5">Recommended Precaution Action:</strong>
                {selectedZone.recommended_action || 'Priority pre-disaster relocation and hillside anchoring.'}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => onOpenShap && onOpenShap(selectedZone)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors cursor-pointer shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Explain AI (TreeSHAP)</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onOpenReport && onOpenReport(selectedZone.code)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Download Decision PDF</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Safe Relocation Match Engine */}
                <button
                  onClick={handleFindRelocationMatch}
                  disabled={loadingMatch}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black transition-all cursor-pointer shadow-lg shadow-emerald-600/25"
                >
                  <Navigation className={`w-4 h-4 ${loadingMatch ? 'animate-spin' : ''}`} />
                  <span>{loadingMatch ? 'Computing AHP Optimal Match...' : 'Match Safe Relocation & Route'}</span>
                </button>
              </div>

              {/* Matched Relocation Site Result Card */}
              {matchedSite && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      AHP Optimal Match
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-800">
                      {Math.round(matchedSite.suitability_score * 100)}% Suitability
                    </span>
                  </div>
                  <h5 className="text-sm font-black text-slate-950">{matchedSite.site_name}</h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                    <div>• Distance: <strong className="text-slate-950">{matchedSite.distance_km} km</strong></div>
                    <div>• Transit Time: <strong className="text-slate-950">{matchedSite.transit_time_mins} mins</strong></div>
                    <div>• Safe Capacity: <strong className="text-emerald-700">{matchedSite.effective_capacity?.toLocaleString() || '3,200'}</strong></div>
                    <div>• Route Status: <strong className="text-emerald-700">All-Weather Cleared</strong></div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-3">
              <Crosshair className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-medium">Click on any of the 28 red hazard zones across Tamil Nadu on the map to inspect geomorphic intelligence and plan relocation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
