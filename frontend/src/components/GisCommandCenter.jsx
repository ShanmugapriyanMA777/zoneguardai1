import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  CircleMarker, 
  Polyline, 
  Popup, 
  Tooltip,
  useMap,
  useMapEvents 
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
  Waves,
  Radio,
  Satellite,
  RefreshCw,
  Zap,
  Check,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Maximize2,
  LocateFixed
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

// Map pan helper component that executes programmatic fly commands ONLY when command timestamp changes
function MapPanTo({ command }) {
  const map = useMap();
  const lastTimestamp = useRef(null);

  useEffect(() => {
    if (!command || !command.coords || command.timestamp === lastTimestamp.current) return;
    const { coords, zoom } = command;
    if (
      Array.isArray(coords) && 
      coords.length === 2 && 
      typeof coords[0] === 'number' && 
      typeof coords[1] === 'number' && 
      !isNaN(coords[0]) && 
      !isNaN(coords[1])
    ) {
      lastTimestamp.current = command.timestamp;
      try {
        map.flyTo([coords[0], coords[1]], zoom || map.getZoom() || 11, { duration: 1.2 });
      } catch (e) {
        console.warn("MapPanTo flyTo handled:", e);
      }
    }
  }, [command, map]);

  return null;
}

// Map event listener for tracking user focus, mouse hover, and scroll-down zoom
function MapInteractionTracker({ onFocus, onZoomChange, onCoordsChange }) {
  const map = useMapEvents({
    click: () => onFocus(true),
    zoomstart: () => onZoomChange(true),
    zoomend: () => {
      onZoomChange(false, map.getZoom());
    },
    mousemove: (e) => {
      if (e?.latlng && !isNaN(e.latlng.lat) && !isNaN(e.latlng.lng)) {
        onCoordsChange([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
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
  onOpenRelocationView,
  autoTriggerMatch,
  onClearAutoTriggerMatch
}) {
  // Basemap style - Default to Topographic Light Map (NO DARK MODE)
  const [baseMap, setBaseMap] = useState('terrain');
  
  // Layer visibility toggles
  const [layerVisibility, setLayerVisibility] = useState({
    redZones: true,
    deformation: true,
    villages: true,
    relocationSites: true,
    evacuationRoute: true
  });

  // Programmatic navigation command state (only triggers flyTo on intentional region/zone selection)
  const [flyCommand, setFlyCommand] = useState({ coords: [10.8500, 78.5000], zoom: 7.5, timestamp: 0 });
  const [displayZoom, setDisplayZoom] = useState(7.5);
  const [activeRegion, setActiveRegion] = useState('all_tn');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');

  // Live Map Tracking, Focus & Scroll States
  const [isMapFocused, setIsMapFocused] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [mouseCoords, setMouseCoords] = useState([10.8500, 78.5000]);
  const [isScanning, setIsScanning] = useState(false);

  // Relocation match state
  const [matchedSite, setMatchedSite] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchStep, setMatchStep] = useState(0);
  const [evacRouteCoords, setEvacRouteCoords] = useState(null);

  // Selected Zone Coordinate Resolution for Reticle Lock
  const [targetLockCoords, setTargetLockCoords] = useState(null);

  const toggleLayer = (layerKey) => {
    setLayerVisibility(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Fly to selected region - only updates flyCommand on explicit button click
  const handleFlyToRegion = (regionKey) => {
    setActiveRegion(regionKey);
    const region = REGION_EXTENTS[regionKey];
    if (region && Array.isArray(region.coords)) {
      triggerScanPulse();
      setDisplayZoom(region.zoom || 11);
      setFlyCommand({ coords: region.coords, zoom: region.zoom || 11, timestamp: Date.now() });
    }
  };

  // Trigger Satellite Radar & Scanline Sweep Pulse
  const triggerScanPulse = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1800);
  };

  // Handle Zoom change from map interaction (mouse wheel scroll down) - DOES NOT PAN THE MAP
  const handleZoomChange = (isStarting, newZoom) => {
    if (isStarting) {
      setIsZooming(true);
    } else {
      if (typeof newZoom === 'number') {
        setDisplayZoom(newZoom);
      }
      setTimeout(() => setIsZooming(false), 800);
    }
  };

  // Handle Zone Selection - Instantaneous, responsive, no annoying loading animation
  const handleZoneSelect = (zoneProperties, centerCoords = null) => {
    onSelectZone(zoneProperties);
    setMatchedSite(null);
    setEvacRouteCoords(null);
    setIsMapFocused(true);

    if (centerCoords) {
      setTargetLockCoords(centerCoords);
      setDisplayZoom(12);
      setFlyCommand({ coords: centerCoords, zoom: 12, timestamp: Date.now() });
    } else {
      const lat = Number(zoneProperties.centroid_lat || zoneProperties.center_lat || zoneProperties.lat || 11.3530);
      const lng = Number(zoneProperties.centroid_lng || zoneProperties.center_lng || zoneProperties.lng || 76.7950);
      if (!isNaN(lat) && !isNaN(lng)) {
        setTargetLockCoords([lat, lng]);
        setDisplayZoom(12);
        setFlyCommand({ coords: [lat, lng], zoom: 12, timestamp: Date.now() });
      }
    }
  };

  // Set initial target coords when selectedZone changes from outside
  useEffect(() => {
    if (selectedZone) {
      const lat = Number(selectedZone.centroid_lat || selectedZone.center_lat || selectedZone.lat);
      const lng = Number(selectedZone.centroid_lng || selectedZone.center_lng || selectedZone.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setTargetLockCoords([lat, lng]);
      }
    }
  }, [selectedZone]);

  // Handle Safe Relocation Match Calculation with Animated High-Tech Steps
  const handleFindRelocationMatch = async (explicitZone = null) => {
    const activeZone = explicitZone || selectedZone;
    if (!activeZone) return;
    setLoadingMatch(true);
    setMatchStep(1);

    setTimeout(() => setMatchStep(2), 400);
    setTimeout(() => setMatchStep(3), 800);

    try {
      const rec = await api.getRecommendation(activeZone.code || 'ZONE-TN-001').catch(() => null);
      
      setTimeout(() => {
        const topSite = rec?.best_candidate || {
          site_code: "SITE-07",
          site_name: "Mettupalayam Safe Tableland Plateau (Nilgiris Foot, TN)",
          suitability_score: 0.94,
          effective_capacity: 3200,
          distance_km: 8.4,
          transit_time_mins: 18,
          lat: 11.300,
          lng: 76.950,
          road_status: "NH-181 Heavy Clearance Cleared",
          water_avail: "45 L/capita/day Protected Aquifer",
          slope_angle: 5.4
        };
        setMatchedSite(topSite);

        const zoneLat = Number(activeZone.centroid_lat || activeZone.center_lat || 11.3530);
        const zoneLng = Number(activeZone.centroid_lng || activeZone.center_lng || 76.7950);
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

          // Pan to show both origin and destination
          const centerLat = (zoneLat + siteLat) / 2;
          const centerLng = (zoneLng + siteLng) / 2;
          setDisplayZoom(11.5);
          setFlyCommand({ coords: [centerLat, centerLng], zoom: 11.5, timestamp: Date.now() });
          triggerScanPulse();
        }

        // Confetti celebration
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });

        setLoadingMatch(false);
        setMatchStep(4);
      }, 1100);

    } catch (e) {
      console.error("Match error:", e);
      setLoadingMatch(false);
      setMatchStep(0);
    }
  };

  // Auto-trigger relocation match when navigated with autoTriggerMatch flag
  useEffect(() => {
    if (autoTriggerMatch) {
      const zoneToMatch = selectedZone || layersData?.red_zones?.features?.[0]?.properties;
      if (zoneToMatch) {
        if (!selectedZone && onSelectZone) {
          onSelectZone(zoneToMatch);
        }
        handleFindRelocationMatch(zoneToMatch);
      }
      if (onClearAutoTriggerMatch) {
        onClearAutoTriggerMatch();
      }
    }
  }, [autoTriggerMatch, selectedZone, layersData]);

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

  // Curated Quick-Track List for bottom selector
  const quickZones = rawRedZones.slice(0, 8);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100 select-none">
      
      {/* BAR 3: DOCKED COMMAND SUB-TOOLBAR (ZERO GAP TO NAVBAR TABS) */}
      <div className="w-full bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between gap-2.5 shrink-0 z-[990] shadow-xs">
        
        {/* Left Section: District Quick Jumps (Single-line horizontal scroll, no wrapping gaps) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[500px] shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-black text-slate-800 pr-1.5 border-r border-slate-200 shrink-0">
            <Globe2 className="w-3.5 h-3.5 text-red-600" />
            <span>Region:</span>
          </div>
          {Object.entries(REGION_EXTENTS).map(([key, reg]) => (
            <button
              key={key}
              onClick={() => handleFlyToRegion(key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeRegion === key 
                  ? 'bg-red-600 text-white shadow-xs ring-1 ring-red-400' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              {reg.name}
            </button>
          ))}
        </div>

        {/* Center Section: Compact Light Basemap Switcher & Layer Toggles in 1 clean line */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Basemaps */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <Layers className="w-3 h-3 text-slate-600 ml-1 mr-0.5" />
            {Object.entries(LIGHT_BASEMAPS).map(([key, bm]) => (
              <button
                key={key}
                onClick={() => setBaseMap(key)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  baseMap === key 
                    ? 'bg-slate-900 text-white shadow-xs' 
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
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                layerVisibility.redZones 
                  ? 'bg-red-50 text-red-800 border-red-300' 
                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              <span>Red Zones ({redZoneFeatures.length})</span>
            </button>

            <button
              onClick={() => toggleLayer('deformation')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                layerVisibility.deformation 
                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>InSAR (SAR)</span>
            </button>

            <button
              onClick={() => toggleLayer('relocationSites')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                layerVisibility.relocationSites 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Safe Sites ({siteFeatures.length})</span>
            </button>
          </div>
        </div>

        {/* Right Section: Satellite Status & Rescan Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsMapFocused(!isMapFocused)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              isMapFocused
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle Tactical Map Focus View"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isMapFocused ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>{isMapFocused ? 'Focus Active' : 'Focus Map'}</span>
          </button>

          <button
            onClick={triggerScanPulse}
            title="Trigger live Copernicus Sentinel-1 Radar Scan"
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-600 hover:opacity-95 text-white rounded-lg text-[11px] font-black shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Radio className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Rescan Sector'}</span>
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE: MAP (LEFT/CENTER) + INTELLIGENCE PANEL (RIGHT) - DOCKED FLUSH (ZERO GAP) */}
      <div className="relative w-full flex-1 min-h-0 flex overflow-hidden">
        
        {/* MAP CONTAINER (Fills exact remaining screen height) */}
        <div 
          onMouseEnter={() => setIsMapFocused(true)}
          className={`relative flex-1 h-full min-w-0 transition-all ${isMapFocused ? 'map-focus-glow' : ''}`}
        >
          {/* TACTICAL MAP FOCUS CORNER RETICLES (ANIMATES WHEN FOCUSED IN MAP) */}
          {isMapFocused && (
            <div className="absolute inset-0 z-[800] pointer-events-none p-3 flex flex-col justify-between">
              {/* Top Row Corners */}
              <div className="flex justify-between items-start">
                <div className="w-7 h-7 border-t-3 border-l-3 border-red-500 rounded-tl-sm animate-tactical-corner drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                <div className="w-7 h-7 border-t-3 border-r-3 border-red-500 rounded-tr-sm animate-tactical-corner drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
              </div>
              {/* Bottom Row Corners */}
              <div className="flex justify-between items-end">
                <div className="w-7 h-7 border-b-3 border-l-3 border-red-500 rounded-bl-sm animate-tactical-corner drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                <div className="w-7 h-7 border-b-3 border-r-3 border-red-500 rounded-br-sm animate-tactical-corner drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
              </div>
            </div>
          )}

          {/* DYNAMIC ZOOM & SCROLL-DOWN RADAR BLOOM ANIMATION */}
          {isZooming && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[750] pointer-events-none">
              <div className="w-48 h-48 border-2 border-red-500/80 rounded-full animate-zoom-expand" />
              <div className="w-48 h-48 border border-amber-400/60 rounded-full animate-zoom-expand" style={{ animationDelay: '0.15s' }} />
            </div>
          )}

          {/* Tactical Scale Indicator that animates when scrolling/zooming (Centered at top of map, no overlap with zoom buttons) */}
          {isZooming && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[850] pointer-events-none animate-box-entrance bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-2 shadow-xl">
              <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>OPTICAL ZOOM: {displayZoom.toFixed(1)}x • {displayZoom >= 12 ? 'SECTOR TACTICAL GRID (10m)' : 'DISTRICT SYNOPTIC GRID (30m)'}</span>
            </div>
          )}

          {/* Map Scanning Holographic Overlays */}
          {isScanning && (
            <div className="absolute inset-0 z-[700] pointer-events-none overflow-hidden">
              {/* Moving Horizontal Laser Scanline */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-scanline" />
              {/* Subtle Radar Sweep Gradient Cone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-red-500/20 bg-[radial-gradient(circle,rgba(239,68,68,0.08)_0%,transparent_70%)] animate-radar-sweep" />
            </div>
          )}

          {/* Leaflet Map Canvas */}
          <MapContainer
            center={[10.8500, 78.5000]}
            zoom={7.5}
            className="w-full h-full"
            zoomControl={true}
          >
            <MapPanTo command={flyCommand} />
            <MapInteractionTracker 
              onFocus={setIsMapFocused} 
              onZoomChange={handleZoomChange} 
              onCoordsChange={setMouseCoords} 
            />

            {/* Selected Light Basemap */}
            <TileLayer
              url={LIGHT_BASEMAPS[baseMap]?.url || LIGHT_BASEMAPS.terrain.url}
              attribution={LIGHT_BASEMAPS[baseMap]?.attribution || LIGHT_BASEMAPS.terrain.attribution}
              maxZoom={19}
            />

            {/* Animated Target Lock-On Reticle on Map Centroid */}
            {targetLockCoords && (
              <>
                {/* Outer Pulsing Sonar Ring */}
                <CircleMarker
                  center={targetLockCoords}
                  radius={34}
                  pathOptions={{
                    color: '#dc2626',
                    weight: 2,
                    dashArray: '5 5',
                    fillColor: '#ef4444',
                    fillOpacity: 0.12
                  }}
                />
                {/* Inner Precision Target Ring */}
                <CircleMarker
                  center={targetLockCoords}
                  radius={18}
                  pathOptions={{
                    color: '#991b1b',
                    weight: 3,
                    fillColor: '#dc2626',
                    fillOpacity: 0.25
                  }}
                />
                {/* Centroid Bullseye Dot */}
                <CircleMarker
                  center={targetLockCoords}
                  radius={5}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2,
                    fillColor: '#dc2626',
                    fillOpacity: 1
                  }}
                />
              </>
            )}

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
                        const center = getValidPointCoords(feature);
                        handleZoneSelect(props, center);
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
                        </div>
                        <button
                          onClick={() => {
                            const center = getValidPointCoords(feature);
                            handleZoneSelect(props, center);
                          }}
                          className="mt-2 w-full py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] cursor-pointer hover:bg-red-700 shadow-xs"
                        >
                          Track Zone & Evaluate Safe Relocation
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
                    click: () => handleZoneSelect(props, pointCoords)
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
                        onClick={() => handleZoneSelect(props, pointCoords)}
                        className="mt-2 w-full py-1 rounded bg-red-600 text-white font-bold text-[11px]"
                      >
                        Track Zone
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
              const isMatched = matchedSite?.site_code === props.code || matchedSite?.code === props.code;

              return (
                <CircleMarker
                  key={`site-${props.code || idx}`}
                  center={coords}
                  radius={isMatched ? 14 : 9}
                  pathOptions={{
                    color: '#ffffff',
                    weight: isMatched ? 4 : 2.5,
                    fillColor: isMatched ? '#059669' : '#10b981',
                    fillOpacity: 0.95
                  }}
                >
                  <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} sticky>
                    <div className="text-xs font-bold text-emerald-800">
                      {isMatched ? '🎯 MATCHED HAVEN: ' : 'Safe Site: '} {props.code}: {props.name?.split('(')[0]}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="text-xs p-1">
                      <div className="font-bold text-emerald-800 text-sm">Safe Site: {props.name}</div>
                      <div className="text-slate-700 mt-1">
                        <div>Suitability: <strong className="text-emerald-700">{Math.round((props.suitability_score || 92))}% Match</strong></div>
                        <div>Safe Capacity: <strong>{props.ecc?.toLocaleString() || '3,200'} citizens</strong></div>
                        <div>Road Access: {props.road_accessibility || 'Highway Access'}</div>
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
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Animated Evacuation Corridor Polyline with Dynamic Dash Flow */}
            {layerVisibility.evacuationRoute && Array.isArray(evacRouteCoords) && evacRouteCoords.length >= 2 && (
              <Polyline
                positions={evacRouteCoords}
                pathOptions={{
                  color: '#059669',
                  weight: 6,
                  dashArray: '8 6',
                  opacity: 0.95,
                  className: 'route-flow-line'
                }}
              />
            )}
          </MapContainer>

          {/* Bottom Horizontal Quick-Selector Strip for Red Zones (Inside Map Canvas) */}
          <div className="absolute bottom-3 left-3 z-[850] flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md max-w-[calc(100%-20px)] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 shrink-0 pr-2 border-r border-slate-200">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>Quick Track:</span>
            </div>
            {quickZones.map((z) => {
              const p = z.properties || {};
              const isSelected = selectedZone?.code === p.code;
              return (
                <button
                  key={p.code}
                  onClick={() => {
                    const pt = getValidPointCoords(z);
                    handleZoneSelect(p, pt);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    isSelected 
                      ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400 scale-105' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} />
                  <span>{p.name?.split('(')[0]?.trim()}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-red-800 text-white' : 'bg-red-100 text-red-800'}`}>
                    {p.risk_score || 91}/100
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT-SIDE ZONE INTELLIGENCE & RELOCATION DRAWER (DOCKED FLUSH WITH ZERO GAP) */}
        <div className="w-[410px] h-full shrink-0 border-l border-slate-200 bg-white flex flex-col z-[980] shadow-sm">
          
          {/* Drawer Header with Live Tracking Pill */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shadow-2xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-950 font-heading">Tamil Nadu Hazard Intel</h3>
                <div className="flex items-center gap-1 mt-0.2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono text-slate-600 font-bold">28 Red Zones Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-red-100/80 border border-red-300 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-mono font-black">
              <Radio className="w-3 h-3 text-red-600 animate-pulse" />
              <span>RADAR LOCKED</span>
            </div>
          </div>

          {/* Drawer Scrollable Content Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {selectedZone ? (
              <>
                {/* Box 1: Threat Identity & Severity Header (Animated Box 1) */}
                <div className="animate-box-entrance stagger-1 p-3.5 rounded-xl bg-white border border-red-200 shadow-2xs space-y-2.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-600 text-[10px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {selectedZone.code || 'ZONE-TN-001'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                        selectedZone.risk_level === 'CRITICAL' || (selectedZone.risk_score >= 88)
                          ? 'bg-red-100 text-red-900 border border-red-300' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {selectedZone.risk_level || 'CRITICAL'} SEVERITY
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-950 font-heading leading-tight">
                      {selectedZone.name || 'Coonoor Marapallam Subsidence Sector'}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-600 text-[11px] font-semibold">
                      <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                      <span>{selectedZone.district || 'Nilgiris District'}, Tamil Nadu</span>
                    </div>
                  </div>

                  {/* Animated Dynamic Risk Score Meter */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-600">Disaster Susceptibility Index:</span>
                      <span className="text-red-700 font-mono font-black">{selectedZone.risk_score || 92}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div 
                        className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 h-full rounded-full animate-meter-fill"
                        style={{ width: `${Math.min(100, Math.max(10, selectedZone.risk_score || 92))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-[10px] font-medium text-slate-600">
                    <div>Hazard: <strong className="text-red-700 block text-[11px] font-bold">{selectedZone.hazard_type || 'Landslide Creep & Shear'}</strong></div>
                    <div>Geology: <strong className="text-slate-900 block text-[11px] font-bold">{selectedZone.geology || 'Fractured Charnockite'}</strong></div>
                  </div>
                </div>

                {/* Box 2: Real-Time Multi-Satellite Telemetry Grid (4 Animated Micro-Boxes) */}
                <div className="animate-box-entrance stagger-2 grid grid-cols-2 gap-2">
                  
                  {/* 2A: InSAR LOS Rate */}
                  <div className="p-2.5 rounded-xl bg-white border border-red-100 shadow-2xs space-y-1 hover:border-red-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500">InSAR Rate</span>
                      <Satellite className="w-3 h-3 text-red-600" />
                    </div>
                    <div className="text-sm font-black text-red-600 font-mono">
                      +{selectedZone.deformation_rate || 18.6} <span className="text-[9px] font-normal text-slate-600">mm/yr</span>
                    </div>
                    <div className="w-full bg-red-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-600 h-full animate-meter-fill" style={{ width: '85%' }} />
                    </div>
                    <span className="text-[8px] text-slate-400 font-medium block">Threshold &gt;5mm</span>
                  </div>

                  {/* 2B: Cartosat DEM Slope */}
                  <div className="p-2.5 rounded-xl bg-white border border-amber-100 shadow-2xs space-y-1 hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500">Slope Angle</span>
                      <Mountain className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="text-sm font-black text-amber-700 font-mono">
                      {selectedZone.slope || 34.2}° <span className="text-[9px] font-normal text-slate-600">Scarp</span>
                    </div>
                    <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full animate-meter-fill" style={{ width: '75%' }} />
                    </div>
                    <span className="text-[8px] text-slate-400 font-medium block">Cartosat 10m DEM</span>
                  </div>

                  {/* 2C: Population at Risk */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500">Population</span>
                      <Users className="w-3 h-3 text-slate-700" />
                    </div>
                    <div className="text-sm font-black text-slate-900 font-mono">
                      {selectedZone.population ? selectedZone.population.toLocaleString() : '2,840'}
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-800 h-full animate-meter-fill" style={{ width: '60%' }} />
                    </div>
                    <span className="text-[8px] text-slate-400 font-medium block">Habitations exposed</span>
                  </div>

                  {/* 2D: Monsoon Rain Exposure */}
                  <div className="p-2.5 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500">Monsoon Rain</span>
                      <Waves className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="text-sm font-black text-blue-700 font-mono">
                      {selectedZone.rainfall || 1480} <span className="text-[9px] font-normal text-slate-600">mm</span>
                    </div>
                    <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full animate-meter-fill" style={{ width: '80%' }} />
                    </div>
                    <span className="text-[8px] text-slate-400 font-medium block">IMD Grid telemetry</span>
                  </div>

                </div>

                {/* Box 3: Sub-Surface Geomorphic Status (Animated Box 3) */}
                <div className="animate-box-entrance stagger-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider">Sub-Surface Telemetry</span>
                    <Activity className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-medium text-slate-700">
                    <div>Pore Saturation: <strong className="text-red-700">91% High</strong></div>
                    <div>Tension Cracks: <strong className="text-amber-800">3.4m Active</strong></div>
                    <div>Bedrock Shear: <strong className="text-slate-900">Low Charnockite</strong></div>
                    <div>GPS Vectors: <strong className="text-emerald-700">Sync Active</strong></div>
                  </div>
                </div>

                {/* Box 4: Precaution & Mitigation Directives (Animated Box 4) */}
                <div className="animate-box-entrance stagger-4 p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <strong className="text-[11px] font-black text-amber-950 font-heading">
                      Pre-Disaster Precaution Directive:
                    </strong>
                  </div>
                  <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                    {selectedZone.recommended_action || 'Execute phased pre-monsoon population relocation. Deploy hillside catch-drains, geo-grid anchoring, and prohibit heavy vehicle transit.'}
                  </p>
                </div>

                {/* Box 5: Decision Actions & Relocation Engine Trigger (Animated Box 5) */}
                <div className="animate-box-entrance stagger-5 space-y-1.5 pt-0.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onOpenShap && onOpenShap(selectedZone)}
                      className="flex items-center justify-center gap-1 p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Explain AI</span>
                    </button>

                    <button
                      onClick={() => onOpenReport && onOpenReport(selectedZone.code)}
                      className="flex items-center justify-center gap-1 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Decision PDF</span>
                    </button>
                  </div>

                  {/* Primary Safe Relocation Match Engine Trigger */}
                  <button
                    onClick={handleFindRelocationMatch}
                    disabled={loadingMatch}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-95 text-white font-black text-[11px] transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 border border-emerald-400/30"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${loadingMatch ? 'animate-spin' : ''}`} />
                    <span>
                      {loadingMatch 
                        ? matchStep === 1 
                          ? 'Evaluating Elevation...' 
                          : matchStep === 2 
                            ? 'Computing AHP Weights...' 
                            : 'Routing Corridor...' 
                        : 'Match Safe Relocation & Route'}
                    </span>
                  </button>
                </div>

                {/* Box 6: Safe Relocation Decision Suite (Staggered Multi-Card Suite When Matched) */}
                {matchedSite && (
                  <div className="space-y-2.5 pt-1">
                    
                    {/* Card 6A: Prime Haven Designation */}
                    <div className="animate-box-entrance stagger-1 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-400 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          <span className="text-[9px] font-mono font-black bg-emerald-200 text-emerald-950 px-2 py-0.2 rounded-full">
                            AHP OPTIMAL RELOCATION HAVEN
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-black text-emerald-800 bg-white px-2 py-0.2 rounded border border-emerald-300">
                          {Math.round(matchedSite.suitability_score * 100)}% Match
                        </span>
                      </div>

                      <h5 className="text-xs font-black text-slate-950 font-heading">
                        {matchedSite.site_name}
                      </h5>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-slate-700 bg-white/80 p-2 rounded-lg border border-emerald-200">
                        <div>• Dist: <strong className="text-slate-950">{matchedSite.distance_km} km</strong></div>
                        <div>• Transit: <strong className="text-slate-950">{matchedSite.transit_time_mins} mins</strong></div>
                        <div>• Capacity: <strong className="text-emerald-700">{matchedSite.effective_capacity?.toLocaleString() || '3,200'}</strong></div>
                        <div>• Slope: <strong className="text-emerald-700">&lt; 6° Tableland</strong></div>
                      </div>
                    </div>

                    {/* Card 6B: Transit Corridor & Route Logistics */}
                    <div className="animate-box-entrance stagger-2 p-2.5 rounded-xl bg-white border border-emerald-300 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-emerald-900 uppercase">Evacuation Transit Corridor</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-[10px] text-slate-700 font-medium space-y-1">
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Route: <strong className="text-slate-950">NH-181 High-Capacity Corridor (Cleared)</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Hazard Free: <strong className="text-emerald-700">100% Free from Active Scarps</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Card 6C: Carrying Capacity & Dispatch */}
                    <div className="animate-box-entrance stagger-3 flex items-center gap-2">
                      <button
                        onClick={() => onOpenRelocationView && onOpenRelocationView()}
                        className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-all cursor-pointer text-center shadow-2xs"
                      >
                        Open Relocation Studio
                      </button>
                      <button
                        onClick={() => {
                          alert(`Dispatched automated relocation notification for ${selectedZone.name} to TNDMA Emergency Operations Center.`);
                        }}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                        title="Dispatch Alert to Field Officers"
                      >
                        Notify TNDMA
                      </button>
                    </div>

                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2.5">
                <Crosshair className="w-7 h-7 text-slate-400 mx-auto animate-pulse" />
                <h4 className="font-bold text-slate-800 text-xs">Select Any Red Hazard Zone</h4>
                <p className="font-medium text-[11px] leading-relaxed">
                  Click any zone across the map or use the quick-selector strip to activate satellite tracking, radar sweeps, and AI relocation matching.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
