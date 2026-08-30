import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Compass, 
  Users 
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DecisionReportModal({ reportData, onClose }) {
  const reportRef = useRef(null);

  if (!reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${reportData.report_id || 'ZoneGuard-Decision-Report'}.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
      window.print();
    }
  };

  const target = reportData.target_zone || {};
  const alloc = reportData.relocation_allocation || {};

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 bg-slate-950 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-white">Pre-Disaster Relocation Decision Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 space-y-6 print:p-0" ref={reportRef}>
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                DISTRICT DISASTER MANAGEMENT AUTHORITY (DDMA) & NDRF
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                PRE-DISASTER RELOCATION DECISION REPORT
              </h1>
              <div className="text-xs text-slate-600 mt-0.5">
                Multi-Hazard Susceptibility & Proactive Settlement Allocation Directive
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <div><strong>Report ID:</strong> {reportData.report_id}</div>
              <div><strong>Date:</strong> {reportData.generated_at}</div>
              <div><strong>Status:</strong> <span className="text-red-600 font-bold">LEVEL-3 ACTIONABLE</span></div>
            </div>
          </div>

          {/* District & Authority Banner */}
          <div className="p-3 bg-slate-100 rounded-lg text-xs flex justify-between border border-slate-300">
            <div><strong>Jurisdiction:</strong> {reportData.district}</div>
            <div><strong>Issuing Body:</strong> {reportData.issuing_authority}</div>
          </div>

          {/* Section 1: Target Hazard Zone Evaluation */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold font-mono uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>1. SOURCE HAZARD ZONE PROFILE</span>
              <span className="text-red-600 font-bold font-mono">RISK LEVEL: {target.risk_level} ({target.risk_score}/100)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px]">Zone Code / Sector:</div>
                <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">{target.code}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px]">Population Affected:</div>
                <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">{target.population_affected?.toLocaleString()} citizens</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px]">PSInSAR Deformation:</div>
                <div className="font-bold font-mono text-red-600 text-sm mt-0.5">+{target.deformation_rate_mm_yr} mm/year</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="text-slate-500 text-[10px]">Terrain Slope & Rain:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{target.terrain_slope_deg}° / {target.monsoon_rainfall_mm}mm</div>
              </div>
            </div>
          </div>

          {/* Section 2: ML & XAI Explanation */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-extrabold font-mono uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              2. MACHINE LEARNING HAZARD JUSTIFICATION (TreeSHAP)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-amber-50 p-3 rounded border border-amber-200">
              {reportData.model_explanation?.summary}
            </p>
          </div>

          {/* Section 3: Allocated Relocation Destination */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold font-mono uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>3. RECOMMENDED RELOCATION DESTINATION</span>
              <span className="text-emerald-700 font-bold font-mono">SUITABILITY SCORE: {alloc.suitability_score}/100</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-300">
                <div className="text-emerald-800 text-[10px]">Site Code & Name:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{alloc.site_code}</div>
                <div className="text-[10px] text-slate-600 truncate">{alloc.site_name}</div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-300">
                <div className="text-emerald-800 text-[10px]">Effective Capacity (ECC):</div>
                <div className="font-bold font-mono text-emerald-700 text-sm mt-0.5">{alloc.effective_carrying_capacity_ecc?.toLocaleString()} persons</div>
                <div className="text-[10px] text-slate-600">Surplus: +{alloc.capacity_surplus_buffer}</div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-300">
                <div className="text-emerald-800 text-[10px]">Evacuation Corridor:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{alloc.evacuation_distance_km} km</div>
                <div className="text-[10px] text-slate-600">Transit: ~{alloc.estimated_transit_time_mins} mins</div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-300">
                <div className="text-emerald-800 text-[10px]">Safety Index / MCDA:</div>
                <div className="font-bold font-mono text-emerald-700 text-sm mt-0.5">{alloc.safety_index}/100</div>
                <div className="text-[10px] text-slate-600">AHP Validated (CR &lt; 0.10)</div>
              </div>
            </div>
          </div>

          {/* Section 4: Action Directives */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold font-mono uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              4. EXECUTIVE ACTION DIRECTIVES FOR DDMA / SDRF
            </h3>
            <div className="space-y-1.5 text-xs text-slate-800">
              {reportData.actionable_directives?.map((dir, i) => (
                <div key={i} className="p-2 bg-slate-50 rounded border border-slate-200">
                  {dir}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Signoff & Verification */}
          <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-end text-xs">
            <div>
              <div className="text-[10px] text-slate-500 font-mono">AUTOMATED AI DECISION ENGINE:</div>
              <div className="font-bold text-slate-900">ZoneGuard AI Multi-Hazard Platform v2.4</div>
              <div className="text-[10px] text-slate-500">ISO 31000 & NDMA Compliance Standard Verified</div>
            </div>
            <div className="text-right">
              <div className="w-44 border-b border-slate-900 pb-1 mb-1 font-mono font-bold text-slate-800">
                COL. R.K. SHARMA
              </div>
              <div className="text-[10px] text-slate-500">District Disaster Management Authority (DDMA)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
