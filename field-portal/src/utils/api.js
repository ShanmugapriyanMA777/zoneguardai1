const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000/api'
  : '/api';

async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Field Portal API] Request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  checkBackendHealth: () => fetchApi('/dashboard/stats'),
  getZones: () => fetchApi('/zones'),
  getAlerts: () => fetchApi('/alerts'),
  getFieldSurveys: () => fetchApi('/field-surveys'),
  submitSurvey: (data) => fetchApi('/field-surveys', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  syncSurveys: (surveys) => fetchApi('/field-surveys/sync', {
    method: 'POST',
    body: JSON.stringify({ surveys }),
  })
};
