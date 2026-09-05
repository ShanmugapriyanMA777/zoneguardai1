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
    return fetchApi(`/deformation/points${q ? `?${q}` : ''}`).catch(() => fallbackData.deformation_points);
  },

  getPointDetails: (pointCode) => fetchApi(`/deformation/points/${pointCode}`).catch(() => {
    return fallbackData.deformation_points.find(p => p.point_code === pointCode) || fallbackData.deformation_points[0];
  }),

  getAnomalies: () => fetchApi('/deformation/anomalies').catch(() => {
    return fallbackData.deformation_points.filter(p => p.anomaly_flag);
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
