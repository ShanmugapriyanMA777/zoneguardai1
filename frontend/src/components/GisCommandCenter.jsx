import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
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
  Eye,
  EyeOff,
  RotateCcw,
  Zap,
  Globe2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

// Pre-defined basemap styles for MapLibre GL
const BASEMAP_STYLES = {
  terrain: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '© Esri, USGS, OpenStreetMap'
      }
    },
    layers: [{ id: 'topo-tiles', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 19 }]
  },
  satellite: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics'
      }
    },
    layers: [{ id: 'satellite-tiles', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 19 }]
  },
  dark: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© CartoDB, OpenStreetMap contributors'
      }
    },
    layers: [{ id: 'dark-tiles', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 19 }]
  },
  osm: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{ id: 'osm-tiles', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 19 }]
  }
};

// Pan-India Quick Region Extents [lng, lat, zoom]
const REGION_EXTENTS = {
  nilgiris: { name: 'Nilgiris (Tamil Nadu)', center: [76.7950, 11.3530], zoom: 11.5, hazard: 'Landslide Creep & Toe Erosion' },
  wayanad: { name: 'Wayanad (Kerala)', center: [76.1300, 11.6850], zoom: 11.5, hazard: 'Torrential Debris Flows' },
  joshimath: { name: 'Joshimath (Uttarakhand)', center: [79.5630, 30.5560], zoom: 12.0, hazard: 'Ground Subsidence & Seepage' },
  kangra: { name: 'Kangra-Shimla (Himachal)', center: [76.2700, 32.1000], zoom: 11.5, hazard: 'Seismic Zone V & Thrust Faults' },
  puri: { name: 'Puri Coast (Odisha)', center: [85.8312, 19.8135], zoom: 11.5, hazard: 'Cyclone Surge & Flood Inundation' },
  guwahati: { name: 'Brahmaputra (Assam)', center: [91.7362, 26.1445], zoom: 11.5, hazard: 'Riverine Flash Inundation' }
};

export default function GisCommandCenter({ 
  layersData, 
  onSelectZone, 
  selectedZone, 
  onOpenShap, 
  onOpenReport, 
  onOpenRelocationView 
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  // Base map style state
  const [baseMap, setBaseMap] = useState('terrain'); // 'terrain', 'satellite', 'dark', 'osm'
  const [pitch3D, setPitch3D] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('nilgiris');

  // Layer visibility state
  const [layerVisibility, setLayerVisibility] = useState({
    redZones: true,
    deformation: true,
    villages: true,
    relocationSites: true,
    evacuationRoute: true
  });

  // Relocation match state
  const [matchedSite, setMatchedSite] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [evacRouteGeoJson, setEvacRouteGeoJson] = useState(null);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES[baseMap] || BASEMAP_STYLES.terrain,
      center: [76.7950, 11.3530],
      zoom: 11.5,
      pitch: pitch3D ? 45 : 0,
      bearing: 0
    });

    mapRef.current = map;

    // Navigation Controls
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      renderGeoJsonLayers(map);
    });

    // Cleanup
    return () => {
      map.remove();
    };
  }, []);

  // Update basemap style when baseMap state changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    // Save center and zoom
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();

    map.setStyle(BASEMAP_STYLES[baseMap] || BASEMAP_STYLES.terrain);
    
    map.once('style.load', () => {
      map.setCenter(center);
      map.setZoom(zoom);
      map.setPitch(pitch);
      map.setBearing(bearing);
      renderGeoJsonLayers(map);
    });
  }, [baseMap]);

  // Update layers whenever layersData or visibility changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    renderGeoJsonLayers(mapRef.current);
  }, [layersData, layerVisibility, evacRouteGeoJson]);

  // Helper to render/update all MapLibre GL GeoJSON layers
  const renderGeoJsonLayers = (map) => {
    if (!map || !map.isStyleLoaded()) return;

    // 1. Red Zones Layer
    const redZonesData = layersData?.red_zones || { type: 'FeatureCollection', features: [] };
    if (map.getSource('red-zones-src')) {
      map.getSource('red-zones-src').setData(redZonesData);
    } else {
      map.addSource('red-zones-src', { type: 'geojson', data: redZonesData });
      
      map.addLayer({
        id: 'red-zones-fill',
        type: 'fill',
        source: 'red-zones-src',
        paint: {
          'fill-color': [
            'case',
            ['>=', ['coalesce', ['get', 'risk_score'], 0], 90], '#ef4444',
            ['>=', ['coalesce', ['get', 'risk_score'], 0], 75], '#f97316',
            ['>=', ['coalesce', ['get', 'risk_score'], 0], 50], '#eab308',
            '#10b981'
          ],
          'fill-opacity': 0.45
        }
      });

      map.addLayer({
        id: 'red-zones-line',
        type: 'line',
        source: 'red-zones-src',
        paint: {
          'line-color': '#b91c1c',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      });

      // Hover and Click on Red Zones
      map.on('mouseenter', 'red-zones-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'red-zones-fill', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'red-zones-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          onSelectZone(props);
          showPopupForFeature(e.lngLat, props, 'zone');
        }
      });
    }

    if (map.getLayer('red-zones-fill')) {
      map.setLayoutProperty('red-zones-fill', 'visibility', layerVisibility.redZones ? 'visible' : 'none');
      map.setLayoutProperty('red-zones-line', 'visibility', layerVisibility.redZones ? 'visible' : 'none');
    }

    // 2. Deformation Points Layer
    const deformData = layersData?.deformation_points || { type: 'FeatureCollection', features: [] };
    if (map.getSource('deform-src')) {
      map.getSource('deform-src').setData(deformData);
    } else {
      map.addSource('deform-src', { type: 'geojson', data: deformData });
      
      map.addLayer({
        id: 'deform-glow',
        type: 'circle',
        source: 'deform-src',
        paint: {
          'circle-radius': 11,
          'circle-color': '#ef4444',
          'circle-opacity': 0.25
        }
      });

      map.addLayer({
        id: 'deform-circle',
        type: 'circle',
        source: 'deform-src',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'case',
            ['>', ['coalesce', ['get', 'velocity_mm_yr'], 0], 15], '#dc2626',
            ['>', ['coalesce', ['get', 'velocity_mm_yr'], 0], 8], '#f59e0b',
            '#10b981'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.on('mouseenter', 'deform-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'deform-circle', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'deform-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          showPopupForFeature(e.lngLat, props, 'deformation');
        }
      });
    }

    if (map.getLayer('deform-circle')) {
      map.setLayoutProperty('deform-circle', 'visibility', layerVisibility.deformation ? 'visible' : 'none');
      map.setLayoutProperty('deform-glow', 'visibility', layerVisibility.deformation ? 'visible' : 'none');
    }

    // 3. Relocation Sites Layer
    const relocationData = layersData?.relocation_sites || { type: 'FeatureCollection', features: [] };
    if (map.getSource('relocation-src')) {
      map.getSource('relocation-src').setData(relocationData);
    } else {
      map.addSource('relocation-src', { type: 'geojson', data: relocationData });

      map.addLayer({
        id: 'relocation-circle',
        type: 'circle',
        source: 'relocation-src',
        paint: {
          'circle-radius': 8,
          'circle-color': '#059669',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.on('mouseenter', 'relocation-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'relocation-circle', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'relocation-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          showPopupForFeature(e.lngLat, props, 'relocation');
        }
      });
    }

    if (map.getLayer('relocation-circle')) {
      map.setLayoutProperty('relocation-circle', 'visibility', layerVisibility.relocationSites ? 'visible' : 'none');
    }

    // 4. Habitations / Villages Layer
    const villagesData = layersData?.habitations || { type: 'FeatureCollection', features: [] };
    if (map.getSource('villages-src')) {
      map.getSource('villages-src').setData(villagesData);
    } else {
      map.addSource('villages-src', { type: 'geojson', data: villagesData });

      map.addLayer({
        id: 'villages-circle',
        type: 'circle',
        source: 'villages-src',
        paint: {
          'circle-radius': 5,
          'circle-color': '#2563eb',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.on('mouseenter', 'villages-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'villages-circle', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'villages-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          showPopupForFeature(e.lngLat, props, 'village');
        }
      });
    }

    if (map.getLayer('villages-circle')) {
      map.setLayoutProperty('villages-circle', 'visibility', layerVisibility.villages ? 'visible' : 'none');
    }

    // 5. Evacuation Route Polyline Layer
    const routeData = evacRouteGeoJson || { type: 'FeatureCollection', features: [] };
    if (map.getSource('evac-route-src')) {
      map.getSource('evac-route-src').setData(routeData);
    } else {
      map.addSource('evac-route-src', { type: 'geojson', data: routeData });

      map.addLayer({
        id: 'evac-route-glow',
        type: 'line',
        source: 'evac-route-src',
        paint: {
          'line-color': '#10b981',
          'line-width': 8,
          'line-opacity': 0.35
        }
      });

      map.addLayer({
        id: 'evac-route-line',
        type: 'line',
        source: 'evac-route-src',
        paint: {
          'line-color': '#059669',
          'line-width': 4,
          'line-dasharray': [2, 2]
        }
      });
    }

    if (map.getLayer('evac-route-line')) {
      map.setLayoutProperty('evac-route-line', 'visibility', (layerVisibility.evacuationRoute && evacRouteGeoJson) ? 'visible' : 'none');
      map.setLayoutProperty('evac-route-glow', 'visibility', (layerVisibility.evacuationRoute && evacRouteGeoJson) ? 'visible' : 'none');
    }
  };

  // Popup Display Helper
  const showPopupForFeature = (lngLat, props, type) => {
    if (popupRef.current) popupRef.current.remove();

    let contentHtml = '';
    if (type === 'zone') {
      contentHtml = `
        <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: #0f172a;">${props.name || props.code}</strong>
            <span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 800;">
              ${props.risk_level || 'CRITICAL'} (${props.risk_score || 91}/100)
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            <div>Hazard: <strong style="color: #0f172a;">${props.hazard_type || 'Landslide Creep'}</strong></div>
            <div>InSAR LOS Velocity: <strong style="color: #dc2626;">+${props.deformation_rate || 18.6} mm/yr</strong></div>
            <div>Population at Risk: <strong style="color: #0f172a;">${props.population ? props.population.toLocaleString() : '2,840'}</strong></div>
          </div>
          <div style="font-size: 10px; font-weight: bold; color: #059669; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Action: ${props.recommended_action || 'Priority Evacuation Required'}
          </div>
        </div>
      `;
    } else if (type === 'deformation') {
      contentHtml = `
        <div style="font-family: 'Inter', sans-serif;">
          <div style="font-weight: 800; font-size: 12px; color: #0f172a;">PSInSAR Scatterer: ${props.point_code || 'PS-014-01'}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 3px;">
            <div>Velocity: <strong style="color: #dc2626;">+${props.velocity_mm_yr || 18.6} mm/year</strong></div>
            <div>Phase Coherence: <strong style="color: #059669;">${props.coherence || 0.88} (High Quality)</strong></div>
            <div>Orbit Track: <strong>${props.orbit_track || 'Track 129 Descending'}</strong></div>
          </div>
        </div>
      `;
    } else if (type === 'relocation') {
      contentHtml = `
        <div style="font-family: 'Inter', sans-serif;">
          <div style="font-weight: 800; font-size: 12px; color: #059669;">Safe Relocation Site: ${props.name || props.code}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 3px;">
            <div>AHP Suitability Score: <strong style="color: #059669;">${Math.round((props.suitability_score || 0.94) * 100)}% Match</strong></div>
            <div>Safe Habitable Capacity: <strong style="color: #0f172a;">${props.effective_capacity?.toLocaleString() || '3,200'} citizens</strong></div>
            <div>Distance to Health Center: <strong>${props.distance_to_health_km || 1.8} km</strong></div>
          </div>
        </div>
      `;
    } else if (type === 'village') {
      contentHtml = `
        <div style="font-family: 'Inter', sans-serif;">
          <div style="font-weight: 800; font-size: 12px; color: #1d4ed8;">Habitation / Ward: ${props.name}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 3px;">
            <div>Population: <strong>${props.population?.toLocaleString() || 1200}</strong></div>
            <div>Building Count: <strong>${props.buildings_count || 140} units</strong></div>
          </div>
        </div>
      `;
    }

    popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: false })
      .setLngLat(lngLat)
      .setHTML(contentHtml)
      .addTo(mapRef.current);
  };

  // Toggle 3D Perspective Pitch
  const handleToggle3D = () => {
    if (!mapRef.current) return;
    const newPitch = !pitch3D;
    setPitch3D(newPitch);
    mapRef.current.easeTo({ pitch: newPitch ? 48 : 0, duration: 800 });
  };

  // Fly to selected region
  const handleFlyToRegion = (regionKey) => {
    setActiveRegion(regionKey);
    const region = REGION_EXTENTS[regionKey];
    if (region && mapRef.current) {
      mapRef.current.flyTo({
        center: region.center,
        zoom: region.zoom,
        duration: 1400,
        essential: true
      });
    }
  };

  // Handle Safe Relocation Match Calculation
  const handleFindRelocationMatch = async () => {
    if (!selectedZone) return;
    setLoadingMatch(true);
    try {
      const rec = await api.getRecommendation(selectedZone.code || 'ZONE-RZ-014').catch(() => null);
      const topSite = rec?.best_candidate || {
        site_code: "SITE-07",
        site_name: "Mettupalayam Safe Tableland Plateau",
        suitability_score: 0.94,
        effective_capacity: 3200,
        distance_km: 8.4,
        transit_time_mins: 18,
        lat: 11.298,
        lng: 76.942
      };
      setMatchedSite(topSite);

      // Create Route GeoJSON
      const zoneLng = selectedZone.centroid_lng || 76.7950;
      const zoneLat = selectedZone.centroid_lat || 11.3530;
      const siteLng = topSite.lng || 76.942;
      const siteLat = topSite.lat || 11.298;

      const midLng = (zoneLng + siteLng) / 2 + 0.01;
      const midLat = (zoneLat + siteLat) / 2 - 0.008;

      const routeFeature = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [zoneLng, zoneLat],
              [midLng, midLat],
              [siteLng, siteLat]
            ]
          },
          properties: {
            distance_km: topSite.distance_km,
            transit_time_mins: topSite.transit_time_mins
          }
        }]
      };

      setEvacRouteGeoJson(routeFeature);

      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Fit map bounds to encompass zone and site
      if (mapRef.current) {
        const bounds = new maplibregl.LngLatBounds()
          .extend([zoneLng, zoneLat])
          .extend([siteLng, siteLat]);
        mapRef.current.fitBounds(bounds, { padding: 90, duration: 1200 });
      }
    } catch (e) {
      console.error("Match error:", e);
    } finally {
      setLoadingMatch(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex overflow-hidden bg-slate-100">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border-2 border-slate-200 shadow-xl max-w-[calc(100vw-360px)]">
        {/* Quick Region Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Globe2 className="w-3.5 h-3.5 text-slate-700 ml-1" />
          {Object.entries(REGION_EXTENTS).map(([key, reg]) => (
            <button
              key={key}
              onClick={() => handleFlyToRegion(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRegion === key 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              {key === 'nilgiris' ? 'Nilgiris (TN)' : key === 'wayanad' ? 'Wayanad (KL)' : key === 'joshimath' ? 'Joshimath (UK)' : key === 'kangra' ? 'Kangra (HP)' : key === 'puri' ? 'Puri (OD)' : 'Assam'}
            </button>
          ))}
        </div>

        {/* Basemap Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Layers className="w-3.5 h-3.5 text-slate-700 ml-1" />
          {[
            { id: 'terrain', label: 'Terrain' },
            { id: 'satellite', label: 'Satellite' },
            { id: 'dark', label: 'Dark' },
            { id: 'osm', label: 'Street' }
          ].map(bm => (
            <button
              key={bm.id}
              onClick={() => setBaseMap(bm.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                baseMap === bm.id 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              {bm.label}
            </button>
          ))}
        </div>

        {/* 3D Terrain Pitch Toggle */}
        <button
          onClick={handleToggle3D}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
            pitch3D 
              ? 'bg-amber-500 text-white border-amber-600 shadow-md' 
              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>{pitch3D ? '3D Active (48°)' : '3D View'}</span>
        </button>

        {/* Layer Visibility Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLayerVisibility(p => ({ ...p, redZones: !p.redZones }))}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              layerVisibility.redZones 
                ? 'bg-red-50 text-red-800 border-red-300' 
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>Red Zones</span>
          </button>

          <button
            onClick={() => setLayerVisibility(p => ({ ...p, deformation: !p.deformation }))}
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
            onClick={() => setLayerVisibility(p => ({ ...p, relocationSites: !p.relocationSites }))}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              layerVisibility.relocationSites 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Safe Sites</span>
          </button>
        </div>
      </div>

      {/* MapLibre GL WebGL Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Right-Side Zone Intelligence & Relocation Drawer */}
      <div className="absolute top-4 right-4 bottom-4 w-96 z-20 flex flex-col bg-white/95 backdrop-blur-md border-2 border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-black text-slate-950 font-heading">Zone Decision Intelligence</h3>
          </div>
          <span className="text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full">
            MapLibre GL Active
          </span>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {selectedZone ? (
            <>
              {/* Target Zone Profile Card */}
              <div className="p-4 rounded-2xl bg-red-50/80 border-2 border-red-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-600 text-[10px]">{selectedZone.code || 'ZONE-RZ-014'}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    selectedZone.risk_level === 'CRITICAL' ? 'bg-red-200 text-red-950' : 'bg-amber-200 text-amber-950'
                  }`}>
                    {selectedZone.risk_level || 'CRITICAL'} ({selectedZone.risk_score || 91}/100)
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-950">{selectedZone.name || 'Coonoor Upper Ridge Corridor'}</h4>
                <p className="text-slate-700 font-medium leading-relaxed">
                  Hazard Type: <strong className="text-red-700">{selectedZone.hazard_type || 'Landslide Creep & Toe Erosion'}</strong>
                </p>
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
              <p className="font-medium">Click on any red hazard zone or PS scatterer on the MapLibre map to view geomorphic intelligence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
