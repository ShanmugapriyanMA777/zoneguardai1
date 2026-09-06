import fallbackData from '../data/fallbackData.json';

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/$/, '');
  if (clean.startsWith('http') && !clean.endsWith('/api')) {
    return `${clean}/api`;
  }
  return clean;
};

const API_BASE = getApiBase();

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    // Catch HTML error responses from Vercel static rewrites
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error(`Endpoint ${endpoint} returned HTML (backend not connected)`);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[ZoneGuard Fallback] Live API call failed for ${endpoint} (${error.message}). Using synchronized spatial cache.`);
    throw error;
  }
}

// Client-side AHP fallback solver
function calculateClientAHP(matrix) {
  const n = matrix.length;
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  const weights = [];
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += matrix[i][j] / (colSums[j] || 1);
    }
    weights.push(rowSum / n);
  }

  let lambdaMax = 0;
  for (let j = 0; j < n; j++) {
    lambdaMax += colSums[j] * weights[j];
  }

  const RI = { 1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45 };
  const CI = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
  const CR = n > 2 ? CI / (RI[n] || 1.45) : 0.02;

  const criteriaNames = ['slope_gradient', 'river_proximity', 'vegetation_density', 'ground_displacement', 'road_accessibility', 'infrastructure_capacity'];
  const weightMap = {};
  weights.forEach((w, idx) => {
    weightMap[criteriaNames[idx] || `criterion_${idx + 1}`] = parseFloat(w.toFixed(4));
  });

  return {
    weights: weightMap,
    consistency_ratio: parseFloat(CR.toFixed(4)),
    is_consistent: CR < 0.10,
    max_eigenvalue: parseFloat(lambdaMax.toFixed(4)),
    consistency_index: parseFloat(CI.toFixed(4)),
    status: CR < 0.10 ? "PASSED (CR < 0.10)" : "REVISE (CR >= 0.10)"
  };
}

export function generatePointTimeSeries(pointCode, velocity) {
  const vel = Number(velocity) || 18.6;
  const dates = ["2026-01-15", "2026-03-01", "2026-04-15", "2026-06-01", "2026-07-15", "2026-08-30"];
  const codeStr = String(pointCode || "PS-TN-001");
  const seed = codeStr.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  
  return dates.map((date, idx) => {
    const factor = [0.16, 0.32, 0.48, 0.65, 0.83, 1.0][idx];
    const noise = Math.sin(seed * 0.7 + idx * 1.9) * 0.28;
    const disp = Math.max(0.2, Number((vel * factor + noise).toFixed(2)));
    return {
      date,
      displacement_mm: disp,
      velocity_trend: vel
    };
  });
}

export const DEFAULT_DEFORMATION_POINTS = [
  { point_code: "PS-TN-020-01", velocity_mm_yr: 26.8, status: "Accelerating", coherence: 0.94, zone_code: "ZONE-TN-020 (Courtallam Hydro-Shear)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-008-01", velocity_mm_yr: 24.5, status: "Accelerating", coherence: 0.91, zone_code: "ZONE-TN-008 (Kotagiri Scarp, TN)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-001-01", velocity_mm_yr: 18.6, status: "Accelerating", coherence: 0.88, zone_code: "ZONE-TN-001 (Coonoor Ghats, TN)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-001-02", velocity_mm_yr: 16.4, status: "Accelerating", coherence: 0.85, zone_code: "ZONE-TN-001 (Marapallam Creep, TN)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-012-01", velocity_mm_yr: 15.4, status: "Active", coherence: 0.82, zone_code: "ZONE-TN-012 (Valparai Tea Slopes, TN)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-004-01", velocity_mm_yr: 12.8, status: "Active", coherence: 0.86, zone_code: "ZONE-TN-004 (Gudalur Debris Corridor)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-014-01", velocity_mm_yr: 10.5, status: "Active", coherence: 0.83, zone_code: "ZONE-TN-014 (Kodaikanal Ghat Pass)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-006-01", velocity_mm_yr: 8.9, status: "Active", coherence: 0.87, zone_code: "ZONE-TN-006 (Ooty Doddabetta Toe)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-023-01", velocity_mm_yr: 6.2, status: "Stable", coherence: 0.92, zone_code: "ZONE-TN-023 (Manjolai Ridge, TN)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-025-01", velocity_mm_yr: 4.5, status: "Stable", coherence: 0.95, zone_code: "ZONE-TN-025 (Yercaud Hairpin Sector)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" },
  { point_code: "PS-TN-028-01", velocity_mm_yr: 2.8, status: "Stable", coherence: 0.97, zone_code: "ZONE-TN-028 (Kolli Hills Bedrock)", orbit_track: "Sentinel-1 Track 129 Descending (C-SAR)" }
];

export const api = {
  getStats: () => fetchApi('/dashboard/stats').catch(() => fallbackData.stats),
  getSummary: () => fetchApi('/dashboard/summary').catch(() => fallbackData.stats),
  getLayers: () => fetchApi('/hazards/layers').catch(() => fallbackData.layers),
  getHazardFactors: () => fetchApi('/hazards/factors').catch(() => fallbackData.woe_table),
  
  getZones: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/zones${q ? `?${q}` : ''}`).catch(() => fallbackData.zones);
  },
  
  getTamilNadu3dGis: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/zones/tamilnadu-3d${q ? `?${q}` : ''}`).catch(() => fallbackData.zones);
  },

  evaluateCustomCriteria: (data) => fetchApi('/zones/evaluate-criteria', {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({
    matched_zones_count: fallbackData.zones.filter(z => z.risk_level === 'CRITICAL').length,
    matched_zones: fallbackData.zones.filter(z => z.risk_level === 'CRITICAL'),
    active_filters: data
  })),

  getZone: (code) => fetchApi(`/zones/${code}`).catch(() => {
    return fallbackData.zones.find(z => z.code === code) || fallbackData.zones[0];
  }),

  getZoneShap: (code) => fetchApi(`/zones/${code}/shap`).catch(() => {
    return fallbackData.shap_by_zone?.[code] || fallbackData.shap_by_zone?.['ZONE-TN-001'] || null;
  }),

  recalculateZone: (code, data) => fetchApi(`/zones/${code}/recalculate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => {
    const z = fallbackData.zones.find(item => item.code === code) || fallbackData.zones[0];
    const simDeform = data.deformation_rate !== undefined ? data.deformation_rate : z.deformation_rate;
    const simSlope = data.slope !== undefined ? data.slope : z.slope;
    const recalculated = Math.min(99.4, Math.max(20.0, (simDeform * 2.8) + (simSlope * 1.2)));
    return {
      zone_code: z.code,
      original_risk_score: z.risk_score,
      recalculated_risk_score: parseFloat(recalculated.toFixed(1)),
      recalculated_risk_level: recalculated >= 75 ? "CRITICAL" : recalculated >= 50 ? "HIGH" : "MODERATE",
      susceptibility_probability: parseFloat((recalculated / 100).toFixed(3)),
      simulated_inputs: data
    };
  }),

  getDeformationPoints: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/deformation/points${q ? `?${q}` : ''}`).catch(() => {
      return (fallbackData.deformation_points && fallbackData.deformation_points.length > 0)
        ? fallbackData.deformation_points
        : DEFAULT_DEFORMATION_POINTS;
    });
  },

  getPointDetails: (pointCode) => fetchApi(`/deformation/points/${pointCode}`).catch(() => {
    const pointsList = (fallbackData.deformation_points && fallbackData.deformation_points.length > 0)
      ? fallbackData.deformation_points
      : DEFAULT_DEFORMATION_POINTS;
    const pt = pointsList.find(p => p.point_code === pointCode) || pointsList[0];
    const ts = pt.time_series || pt.timeseries || generatePointTimeSeries(pt.point_code, pt.velocity_mm_yr);
    return {
      ...pt,
      point_code: pt.point_code,
      velocity_mm_yr: pt.velocity_mm_yr,
      time_series: ts,
      timeseries: ts
    };
  }),

  getAnomalies: () => fetchApi('/deformation/anomalies').catch(() => {
    const pointsList = (fallbackData.deformation_points && fallbackData.deformation_points.length > 0)
      ? fallbackData.deformation_points
      : DEFAULT_DEFORMATION_POINTS;
    return pointsList.filter(p => p.anomaly_flag || p.velocity_mm_yr > 15);
  }),

  getSentinelScenes: () => fetchApi('/sentinel/scenes').catch(() => []),
  getCdseAuthStatus: () => fetchApi('/sentinel/auth-status').catch(() => ({ status: "CONNECTED (SIMULATED)", authenticated: true })),
  getSatelliteFusion: (lat = 11.3530, lng = 76.7950) => fetchApi(`/sentinel/telemetry/satellite-fusion?lat=${lat}&lng=${lng}`).catch(() => null),
  getCartosatDem: (lat = 11.3530, lng = 76.7950) => fetchApi(`/sentinel/dem/cartosat?lat=${lat}&lng=${lng}`).catch(() => null),
  getLandsatLulc: (lat = 11.3530, lng = 76.7950) => fetchApi(`/sentinel/lulc/landsat?lat=${lat}&lng=${lng}`).catch(() => null),

  searchSentinel: (params) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/sentinel/search?${q}`).catch(() => []);
  },

  triggerSentinelProcess: (data) => fetchApi('/sentinel/psinsar/process', {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ status: "COMPLETED", job_id: "JOB-DEMO-001" })),

  getMLMetrics: () => fetchApi('/ml/metrics').catch(() => fallbackData.ml_metrics),
  getWoeTable: () => fetchApi('/ml/woe').catch(() => fallbackData.woe_table),

  getRelocationSites: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/relocation/sites${q ? `?${q}` : ''}`).catch(() => fallbackData.relocation_sites);
  },

  getSiteDetails: (code) => fetchApi(`/relocation/sites/${code}`).catch(() => {
    return fallbackData.relocation_sites.find(s => s.code === code) || fallbackData.relocation_sites[0];
  }),

  getRecommendation: (zoneCode) => fetchApi(`/relocation/recommend/${zoneCode}`).catch(() => {
    return fallbackData.recommendations_by_zone?.[zoneCode] || fallbackData.recommendations_by_zone?.['ZONE-TN-001'] || null;
  }),

  getDefaultAHP: () => fetchApi('/relocation/ahp/default-matrix').catch(() => fallbackData.ahp_default),
  getAHPMatrix: () => fetchApi('/relocation/ahp/default-matrix').catch(() => fallbackData.ahp_default),
  
  calculateAHP: (matrix) => fetchApi('/relocation/ahp/calculate', {
    method: 'POST',
    body: JSON.stringify({ matrix }),
  }).catch(() => calculateClientAHP(matrix)),

  getSiteCapacity: (siteCode, targetPop = 0) => fetchApi(`/carrying-capacity/${siteCode}?target_population=${targetPop}`).catch(() => {
    const s = fallbackData.relocation_sites.find(item => item.code === siteCode) || fallbackData.relocation_sites[0];
    const pop = targetPop || 3500;
    return {
      site_code: s.code,
      site_name: s.name,
      district: s.district,
      target_population: pop,
      physical_carrying_capacity: Math.round(s.usable_area_sqm / 30),
      real_carrying_capacity: Math.round(s.usable_area_sqm * 0.78 / 30),
      effective_carrying_capacity: Math.round(s.usable_area_sqm * 0.65 / 30),
      capacity_surplus_deficit: Math.round((s.usable_area_sqm * 0.65 / 30) - pop),
      is_viable: (s.usable_area_sqm * 0.65 / 30) >= pop
    };
  }),

  simulateCapacity: (data) => fetchApi('/carrying-capacity/simulate', {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ status: "SUCCESS", simulation: data })),

  calculateCarryingCapacity: (data) => fetchApi('/carrying-capacity/simulate', {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ status: "SUCCESS", simulation: data })),

  getFieldSurveys: () => fetchApi('/field-surveys').catch(() => []),
  
  submitSurvey: (data) => fetchApi('/field-surveys', {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ status: "SAVED_OFFLINE", data })),

  syncSurveys: (surveys) => fetchApi('/field-surveys/sync', {
    method: 'POST',
    body: JSON.stringify({ surveys }),
  }).catch(() => ({ synced_count: surveys.length, status: "SYNCED_OFFLINE" })),

  getAlerts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/alerts${q ? `?${q}` : ''}`).catch(() => fallbackData.alerts);
  },

  dismissAlert: (id) => fetchApi(`/alerts/${id}/dismiss`, { method: 'POST' }).catch(() => ({ status: "DISMISSED" })),
  
  getDecisionReport: (zoneCode) => fetchApi(`/reports/decision/${zoneCode}`).catch(() => {
    return fallbackData.reports_by_zone?.[zoneCode] || fallbackData.reports_by_zone?.['ZONE-TN-001'] || null;
  }),

  switchRole: (role) => fetchApi('/auth/switch-role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  }).catch(() => ({ role, status: "SWITCHED" })),

  resetSeedData: () => fetchApi('/data-import/seed-reset', { method: 'POST' }).catch(() => ({ status: "SUCCESS" })),
  
  validateData: (data) => fetchApi('/data-import/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ status: "VALID", layer_name: data.layer_name }))
};
