const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`API call failed for ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  getStats: () => fetchApi('/dashboard/stats'),
  getSummary: () => fetchApi('/dashboard/summary'),
  getLayers: () => fetchApi('/hazards/layers'),
  getHazardFactors: () => fetchApi('/hazards/factors'),
  getZones: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/zones${q ? `?${q}` : ''}`);
  },
  getTamilNadu3dGis: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/zones/tamilnadu-3d${q ? `?${q}` : ''}`);
  },
  evaluateCustomCriteria: (data) => fetchApi('/zones/evaluate-criteria', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getZone: (code) => fetchApi(`/zones/${code}`),
  getZoneShap: (code) => fetchApi(`/zones/${code}/shap`),
  recalculateZone: (code, data) => fetchApi(`/zones/${code}/recalculate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getDeformationPoints: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/deformation/points${q ? `?${q}` : ''}`);
  },
  getPointDetails: (pointCode) => fetchApi(`/deformation/points/${pointCode}`),
  getAnomalies: () => fetchApi('/deformation/anomalies'),
  getSentinelScenes: () => fetchApi('/sentinel/scenes'),
  getCdseAuthStatus: () => fetchApi('/sentinel/auth-status'),
  getSatelliteFusion: (lat = 11.3530, lng = 76.7950) => fetchApi(`/sentinel/telemetry/satellite-fusion?lat=${lat}&lng=${lng}`),
  getCartosatDem: (lat = 11.3530, lng = 76.7950) => fetchApi(`/sentinel/dem/cartosat?lat=${lat}&lng=${lng}`),
  getLandsatLulc: (lat = 11.3530, lng = 76.7950) => fetchApi(`/sentinel/lulc/landsat?lat=${lat}&lng=${lng}`),
  searchSentinel: (params) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/sentinel/search?${q}`);
  },
  triggerSentinelProcess: (data) => fetchApi('/sentinel/psinsar/process', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMLMetrics: () => fetchApi('/ml/metrics'),
  getWoeTable: () => fetchApi('/ml/woe'),
  getRelocationSites: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/relocation/sites${q ? `?${q}` : ''}`);
  },
  getSiteDetails: (code) => fetchApi(`/relocation/sites/${code}`),
  getRecommendation: (zoneCode) => fetchApi(`/relocation/recommend/${zoneCode}`),
  getDefaultAHP: () => fetchApi('/relocation/ahp/default-matrix'),
  getAHPMatrix: () => fetchApi('/relocation/ahp/default-matrix'),
  calculateAHP: (matrix) => fetchApi('/relocation/ahp/calculate', {
    method: 'POST',
    body: JSON.stringify({ matrix }),
  }),
  getSiteCapacity: (siteCode, targetPop = 0) => fetchApi(`/carrying-capacity/${siteCode}?target_population=${targetPop}`),
  simulateCapacity: (data) => fetchApi('/carrying-capacity/simulate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  calculateCarryingCapacity: (data) => fetchApi('/carrying-capacity/simulate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getFieldSurveys: () => fetchApi('/field-surveys'),
  submitSurvey: (data) => fetchApi('/field-surveys', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  syncSurveys: (surveys) => fetchApi('/field-surveys/sync', {
    method: 'POST',
    body: JSON.stringify({ surveys }),
  }),
  getAlerts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi(`/alerts${q ? `?${q}` : ''}`);
  },
  dismissAlert: (id) => fetchApi(`/alerts/${id}/dismiss`, { method: 'POST' }),
  getDecisionReport: (zoneCode) => fetchApi(`/reports/decision/${zoneCode}`),
  switchRole: (role) => fetchApi('/auth/switch-role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  }),
  resetSeedData: () => fetchApi('/data-import/seed-reset', { method: 'POST' }),
  validateData: (data) => fetchApi('/data-import/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
};
