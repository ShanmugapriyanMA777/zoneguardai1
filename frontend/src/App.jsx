import React, { useState, useEffect, Component } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import GisCommandCenter from './components/GisCommandCenter';
import RedZoneExplorer from './components/RedZoneExplorer';
import DeformationExplorer from './components/DeformationExplorer';
import CarryingCapacityStudio from './components/CarryingCapacityStudio';
import RelocationPlanner from './components/RelocationPlanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FieldOfficerMobileApp from './components/FieldOfficerMobileApp';
import ShapModal from './components/ShapModal';
import DecisionReportModal from './components/DecisionReportModal';
import AlertsModal from './components/AlertsModal';
import { api } from './utils/api';

// Error Boundary Component to prevent white/black screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ZoneGuard Component Error Caught:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentTab !== this.props.currentTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border-2 border-red-300 shadow-2xl text-center space-y-4 text-slate-900">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-black font-heading text-slate-950">View Rendering Notice</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            An issue occurred while rendering this map or analytics layer. Click below to return to Home or reload.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onResetTab) this.props.onResetTab('landing');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Go to Home Overview
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Reload Decision Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Navigation & Role State
  const [currentTab, setCurrentTab] = useState('landing'); // 'landing', 'command-center', 'deformation', 'capacity', 'relocation', 'analytics', 'field-app', 'methodology', 'data-mgmt'
  const [currentRole, setCurrentRole] = useState('ADMIN'); // 'ADMIN', 'FIELD_OFFICER', 'ANALYST'

  // Data State
  const [stats, setStats] = useState(null);
  const [layersData, setLayersData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  // Modals
  const [shapModalOpen, setShapModalOpen] = useState(false);
  const [shapData, setShapData] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [statsRes, layersRes, alertsRes] = await Promise.all([
        api.getStats().catch(() => null),
        api.getLayers().catch(() => null),
        api.getAlerts().catch(() => [])
      ]);
      setStats(statsRes);
      setLayersData(layersRes);
      setAlerts(alertsRes || []);
    } catch (e) {
      console.error("Initial load error:", e);
    }
  };

  // Open SHAP Explainability Modal
  const handleOpenShap = async (zoneParam) => {
    try {
      const code = typeof zoneParam === 'string' ? zoneParam : zoneParam?.code || 'ZONE-RZ-014';
      const matchedZone = typeof zoneParam === 'object' && zoneParam?.name 
        ? zoneParam 
        : layersData?.red_zones?.features?.find(f => f.properties.code === code)?.properties || { code, name: code };
      setSelectedZone(matchedZone);

      const data = await api.getZoneShap(code);
      setShapData(data);
      setShapModalOpen(true);
    } catch (e) {
      console.error("SHAP load error:", e);
      const code = typeof zoneParam === 'string' ? zoneParam : zoneParam?.code || 'ZONE-RZ-014';
      setShapData(null);
      setSelectedZone({ code });
      setShapModalOpen(true);
    }
  };

  // Open Decision Report Modal
  const handleOpenReport = async (zoneCode) => {
    try {
      const rep = await api.getDecisionReport(zoneCode || 'ZONE-RZ-014');
      setReportData(rep);
      setReportModalOpen(true);
    } catch (e) {
      console.error("Report load error:", e);
    }
  };

  // Handle Dismiss Alert
  const handleDismissAlert = async (id) => {
    try {
      await api.dismissAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Reset Data
  const handleResetData = async () => {
    await api.resetSeedData();
    await loadInitialData();
  };

  // Switch role and update view if needed
  const handleRoleChange = async (newRole) => {
    setCurrentRole(newRole);
    if (newRole === 'FIELD_OFFICER') {
      setCurrentTab('field-app');
    } else if (newRole === 'ANALYST') {
      setCurrentTab('relocation');
    } else {
      if (currentTab === 'field-app') setCurrentTab('command-center');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentRole={currentRole}
        setCurrentRole={handleRoleChange}
        alertCount={alerts.length}
        onResetData={handleResetData}
        onOpenAlerts={() => setAlertsModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        <ErrorBoundary currentTab={currentTab} onResetTab={setCurrentTab}>
          {currentTab === 'landing' && (
            <LandingPage
              onLaunch={() => setCurrentTab('command-center')}
              onExploreRedZones={() => setCurrentTab('red-zones')}
              stats={stats}
            />
          )}

          {currentTab === 'command-center' && (
            <GisCommandCenter
              layersData={layersData}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onOpenShap={handleOpenShap}
              onOpenReport={handleOpenReport}
              onOpenRelocationView={(zCode) => setCurrentTab('relocation')}
            />
          )}

          {currentTab === 'red-zones' && (
            <RedZoneExplorer
              onOpenShap={handleOpenShap}
              onOpenReport={handleOpenReport}
              onOpenRelocationView={(zCode) => setCurrentTab('relocation')}
            />
          )}

          {currentTab === 'deformation' && (
            <DeformationExplorer />
          )}

          {currentTab === 'capacity' && (
            <CarryingCapacityStudio
              initialSiteCode="SITE-07"
              targetPop={selectedZone?.population || 2840}
            />
          )}

          {currentTab === 'relocation' && (
            <RelocationPlanner
              onSelectSiteForReport={(siteCode) => handleOpenReport(selectedZone?.code || 'ZONE-RZ-014')}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {currentTab === 'field-app' && (
            <FieldOfficerMobileApp
              onSurveySubmitted={loadInitialData}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* SHAP Modal */}
      {shapModalOpen && (
        <ShapModal
          zone={selectedZone}
          shapData={shapData}
          onClose={() => setShapModalOpen(false)}
          onFindRelocation={() => {
            setShapModalOpen(false);
            setCurrentTab('command-center');
          }}
        />
      )}

      {/* Decision Report Modal */}
      {reportModalOpen && (
        <DecisionReportModal
          reportData={reportData}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {/* Active Alerts Modal */}
      {alertsModalOpen && (
        <AlertsModal
          alerts={alerts}
          onClose={() => setAlertsModalOpen(false)}
          onDismiss={handleDismissAlert}
          onSelectZone={(zCode) => {
            setCurrentTab('command-center');
            const zone = layersData?.red_zones?.features?.find(f => f.properties.code === zCode)?.properties;
            if (zone) setSelectedZone(zone);
          }}
        />
      )}
    </div>
  );
}
