import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  RotateCcw, 
  Crosshair, 
  MapPin, 
  ShieldCheck, 
  Zap,
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';

export default function CameraViewfinder({ 
  isOpen, 
  onClose, 
  onCapture, 
  gpsCoords, 
  zoneCode, 
  villageName, 
  officer, 
  category = "Ground Truth Evidence" 
}) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [compassHeading, setCompassHeading] = useState(42);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Compass orientation simulation
  useEffect(() => {
    const handleOrientation = (e) => {
      if (e.alpha !== null && !isNaN(e.alpha)) {
        setCompassHeading(Math.round(e.alpha));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  // Start / Stop camera stream on modal open/close or facingMode change
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPreview(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebRTC camera stream is not supported in this browser. Please use native file upload.");
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn("Video play error:", e));
      }
    } catch (err) {
      console.warn("Camera init error:", err);
      setCameraError(err.message || "Unable to access camera device. Check browser permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    if (navigator.vibrate) navigator.vibrate(25);
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleShutter = () => {
    if (!videoRef.current) return;
    if (navigator.vibrate) navigator.vibrate([30, 50]);

    // Trigger visual flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 350);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    
    // Draw current video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Apply Official Government & ZoneGuard Watermark Overlay
    drawOfficialWatermark(ctx, width, height);

    const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPreview(watermarkedDataUrl);
  };

  const drawOfficialWatermark = (ctx, width, height) => {
    const lat = gpsCoords?.lat?.toFixed(6) || "11.353200";
    const lng = gpsCoords?.lng?.toFixed(6) || "76.795400";
    const acc = gpsCoords?.accuracy || "3.2";
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const authCode = `ZG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Top Header Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, width, 56);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ZONEGUARD AI • DISASTER GROUND-TRUTH VERIFIED', 20, 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`CATEGORY: ${category.toUpperCase()}`, width - 20, 36);
    ctx.textAlign = 'left';

    // Bottom Footer Banner
    const bannerHeight = 90;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Accent line
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, height - bannerHeight, width, 3);

    // Left info block
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`GPS: ${lat}°N, ${lng}°E (±${acc}m High-Precision RTK)`, 20, height - 56);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`ZONE: ${zoneCode} • ${villageName || 'Marapallam Sector'} • HDG: ${compassHeading}°`, 20, height - 26);

    // Right info block
    ctx.textAlign = 'right';
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`${timestamp} IST`, width - 20, height - 56);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`OFFICER: ${officer?.name || 'R. Kavitha'} (${officer?.badge_no || 'TNDMA-FO-088'}) • HASH: ${authCode}`, width - 20, height - 26);
    ctx.textAlign = 'left';
  };

  const handleAcceptCapture = () => {
    if (!capturedPreview) return;
    if (navigator.vibrate) navigator.vibrate(30);

    onCapture({
      url: capturedPreview,
      category: category,
      timestamp: new Date().toLocaleString(),
      lat: gpsCoords?.lat || 11.3532,
      lng: gpsCoords?.lng || 76.7954,
      accuracy: gpsCoords?.accuracy || 3.2,
      zone_code: zoneCode,
      village_name: villageName,
      officer_badge: officer?.badge_no || "TNDMA-FO-088"
    });

    onClose();
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col justify-between select-none animate-fade-in">
      {/* Visual Flash Effect */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-[10000] pointer-events-none camera-flash-active" />
      )}

      {/* TOP TACTICAL HUD HEADER */}
      <div className="relative z-50 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
                TACTICAL FIELD CAMERA
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                GNSS HUD ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-300">
              {zoneCode} • {category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Flip Camera Button */}
          {!capturedPreview && (
            <button
              onClick={toggleCameraFacing}
              title="Switch Camera (Front/Back)"
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all btn-touch"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-red-500/30 border border-white/20 hover:border-red-500 text-white flex items-center justify-center cursor-pointer transition-all btn-touch"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CENTER VIEWPORT / VIEWFINDER */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
        {capturedPreview ? (
          /* Captured Photo Preview */
          <div className="relative w-full h-full flex items-center justify-center p-2 animate-scale-in">
            <img 
              src={capturedPreview} 
              alt="Captured Field Evidence" 
              className="max-w-full max-h-full object-contain rounded-2xl border-2 border-emerald-500 shadow-2xl"
            />
            <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
              <ShieldCheck className="w-4 h-4" />
              <span>Evidence Watermarked & Ready</span>
            </div>
          </div>
        ) : (
          /* Live Camera Stream */
          <div className="relative w-full h-full flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center space-y-3 max-w-xs text-white">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">Initializing Live Camera Stream...</h4>
                {cameraError && (
                  <p className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded-xl border border-red-800">
                    {cameraError}
                  </p>
                )}
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Retry Camera Access
                </button>
              </div>
            )}

            {/* Tactical Viewfinder Overlay Graphics */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                {/* 4 Corner Framing Brackets */}
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                </div>

                {/* Center Crosshairs & Focal Target */}
                <div className="self-center flex items-center justify-center relative">
                  <div className="w-24 h-24 rounded-full border border-emerald-400/40 hud-pulse flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="absolute w-36 h-0.5 bg-emerald-400/30" />
                  <div className="absolute h-36 w-0.5 bg-emerald-400/30" />
                </div>

                <div className="flex justify-between">
                  <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                </div>

                {/* Real-time Telemetry Floating HUD */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-emerald-300 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>LAT: {gpsCoords?.lat || 11.3532}°N | LNG: {gpsCoords?.lng || 76.7954}°E</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-teal-400" />
                    <span>HDG: {compassHeading}° | ACC: ±{gpsCoords?.accuracy || 3.2}m</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & SHUTTER BAR */}
      <div className="relative z-50 bg-gradient-to-t from-black via-black/90 to-transparent p-6 flex items-center justify-around text-white">
        {capturedPreview ? (
          /* Post-Capture Actions */
          <div className="w-full max-w-md flex items-center gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer btn-touch"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
            <button
              onClick={handleAcceptCapture}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-emerald-600/40 btn-touch"
            >
              <Check className="w-4 h-4" />
              <span>Save & Attach Evidence</span>
            </button>
          </div>
        ) : (
          /* Live Camera Shutter Button */
          <div className="w-full flex items-center justify-center relative">
            <button
              onClick={handleShutter}
              disabled={!cameraActive}
              aria-label="Capture Watermarked Photo"
              className={`w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center p-1.5 transition-all cursor-pointer btn-touch ${
                cameraActive ? 'hover:scale-105 active:scale-95' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="w-full h-full rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
