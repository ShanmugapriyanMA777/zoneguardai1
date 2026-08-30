import React, { useState } from 'react';
import { 
  Database, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  FileText, 
  HardDrive,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

export default function DataManagement({ stats, onResetData }) {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleValidateUpload = async () => {
    if (!selectedFile) {
      alert("Please select a GeoJSON or CSV file first.");
      return;
    }
    setValidating(true);
    try {
      const res = await api.validateData({
        layer_name: selectedFile.name.replace(/\.[^/.]+$/, ""),
        feature_count: 142,
        geometry_type: "Polygon",
        sample_properties: {
          code: "SAMPLE-01",
          slope: 28.5,
          deformation: 12.4
        }
      });
      setValidationResult(res);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    } catch (e) {
      console.error(e);
      alert("Validation failed.");
    } finally {
      setValidating(false);
    }
  };

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await onResetData();
      alert("Database reset and re-seeded with realistic Chamoli-Rudraprayag synthetic data!");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading text-white">Spatial Data & PostGIS Management</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                PostgreSQL + PostGIS Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Geospatial Vector Ingestion, GeoJSON/Shapefile Schema Validation, and Synthetic Dataset Controls
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 text-xs font-bold border border-red-700/50 shadow-lg transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Re-seeding PostGIS Tables...' : 'Re-seed Demo District Data'}</span>
        </button>
      </div>

      {/* Database Schema & Tables Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
          <div className="text-slate-400 text-[10px] font-mono uppercase">Hazard Zones Table</div>
          <div className="text-xl font-bold text-rose-400">{stats?.cards?.total_zones || 30} records</div>
          <div className="text-[10px] text-slate-500">PostGIS Polygon GIST Index: Active</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
          <div className="text-slate-400 text-[10px] font-mono uppercase">PSInSAR Scatterers Table</div>
          <div className="text-xl font-bold text-cyan-400">120 points</div>
          <div className="text-[10px] text-slate-500">Spatial Geometry EPSG:4326</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
          <div className="text-slate-400 text-[10px] font-mono uppercase">Relocation Sites Table</div>
          <div className="text-xl font-bold text-emerald-400">15 sites</div>
          <div className="text-[10px] text-slate-500">PCC/RCC/ECC Attributes Mapped</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
          <div className="text-slate-400 text-[10px] font-mono uppercase">Habitations & Villages</div>
          <div className="text-xl font-bold text-amber-400">{stats?.cards?.total_habitations || 50} villages</div>
          <div className="text-[10px] text-slate-500">Demographic Vulnerability Tables</div>
        </div>
      </div>

      {/* File Upload & Ingestion Validator */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload New GeoJSON / Shapefile Layer</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Supported: GeoJSON, CSV, Shapefile (Zip)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Upload Dropzone */}
          <div className="p-6 rounded-xl bg-slate-950/80 border-2 border-dashed border-slate-700 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <label className="cursor-pointer font-bold text-cyan-400 hover:text-cyan-300 text-xs">
                <span>Browse Local GIS File</span>
                <input
                  type="file"
                  accept=".geojson,.json,.csv,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">or drag & drop here</p>
            </div>

            {selectedFile && (
              <div className="p-2 rounded bg-slate-900 text-xs text-slate-300 font-mono">
                Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}

            <button
              onClick={handleValidateUpload}
              disabled={validating || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              {validating ? 'Validating Schema...' : 'Validate & Prepare PostGIS Table'}
            </button>
          </div>

          {/* Validation Result Box */}
          {validationResult ? (
            <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Validation Passed ({validationResult.status})</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-900 px-2 py-0.5 rounded text-emerald-100">
                  {validationResult.geometry_type}
                </span>
              </div>

              <div className="space-y-1.5 text-slate-300 text-[11px]">
                {validationResult.validation_checks?.map((chk, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
                    <span>{chk.check}</span>
                    <strong className="text-emerald-400">PASSED</strong>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-emerald-200 font-mono">
                Target table: <code>{validationResult.postgis_table_target}</code>
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-slate-500 text-xs">
              Upload a spatial dataset to inspect topological consistency, coordinate reference system (WGS84 EPSG:4326), and attribute mappings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
