import React, { useRef, useState, useEffect } from "react";
import { Camera, VideoOff, RefreshCw, Upload, Sparkles, Sliders, Play, Square } from "lucide-react";
import { FaceAnalysis, ScanInterval } from "../types";

interface CameraFeedProps {
  onCapture: (base64Image: string) => void;
  analyzing: boolean;
  faces: FaceAnalysis[];
  cameraActive: boolean;
  setCameraActive: (active: boolean) => void;
  autoScan: boolean;
  setAutoScan: (auto: boolean) => void;
  scanInterval: ScanInterval;
  setScanInterval: (interval: ScanInterval) => void;
}

export default function CameraFeed({
  onCapture,
  analyzing,
  faces,
  cameraActive,
  setCameraActive,
  autoScan,
  setAutoScan,
  scanInterval,
  setScanInterval,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // Load available camera devices
  useEffect(() => {
    async function getDevices() {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter((device) => device.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn("Could not list video devices, continuing with defaults:", err);
      }
    }
    getDevices();
  }, [selectedDeviceId]);

  // Handle active camera streaming
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCam() {
      if (!cameraActive) return;
      setErrorMsg("");
      setUploadPreview(null); // Clear upload preview when choosing camera

      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Camera connection error:", err);
        setErrorMsg(
          "Camera access was blocked or is unavailable. Please check permissions, or use the drag-and-drop uploader fallback below."
        );
        setCameraActive(false);
      }
    }

    startCam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive, selectedDeviceId]);

  // Auto-scan cycle handle
  useEffect(() => {
    if (!autoScan || !cameraActive || analyzing) return;

    const timer = setInterval(() => {
      captureSnapshot();
    }, scanInterval);

    return () => clearInterval(timer);
  }, [autoScan, cameraActive, analyzing, scanInterval]);

  // Capture current frame as base64 and feed it upstream
  const captureSnapshot = () => {
    if (cameraActive && videoRef.current) {
      const video = videoRef.current;
      if (video.readyState < 2) return; // Not enough data yet

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onCapture(dataUrl);
        } catch (err) {
          console.error("Frame capturing failed data extraction:", err);
        }
      }
    } else if (uploadPreview) {
      onCapture(uploadPreview);
    }
  };

  // Drag & Drop / File selection handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = event.target.result as string;
        setUploadPreview(base64);
        setCameraActive(false); // Stop live cam once file uploaded
        setErrorMsg("");
        // Instantly trigger analysis on uploaded snapshot
        onCapture(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Target Monitor Box */}
      <div 
        ref={containerRef}
        className="relative aspect-video rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl transition-all select-none"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {/* Futuristic Tech Grid background */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(63,63,70,0.15)_1px,transparent_1px)] [background-size:24px_24px] z-0" />

        {/* Live Video Element */}
        {cameraActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover z-10 block transform -scale-x-100" // Mirror camera
          />
        )}

        {/* Static Upload Preview Element */}
        {!cameraActive && uploadPreview && (
          <img
            src={uploadPreview}
            alt="Uploaded Preview"
            className="w-full h-full object-contain z-10 block"
          />
        )}

        {/* Empty State / Not Active state */}
        {!cameraActive && !uploadPreview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
            <div className="p-4 bg-zinc-900/80 rounded-full border border-zinc-800 text-zinc-400 mb-4 animate-pulse">
              <Camera size={40} />
            </div>
            <h3 className="font-sans font-medium text-lg text-zinc-200">Camera Feed Offline</h3>
            <p className="font-sans text-sm text-zinc-500 max-w-sm mt-1 mb-6">
              Grant permissions and start scanning live, or drag and drop a selfie here.
            </p>
            <button
              id="btn-start-camera"
              onClick={() => setCameraActive(true)}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-xl transition duration-200 shadow-lg shadow-cyan-900/20 flex items-center gap-2 cursor-pointer"
            >
              <Camera size={16} /> Activate Scanner Camera
            </button>
          </div>
        )}

        {/* Scanning Target Lines Overlay HUD */}
        {(cameraActive || uploadPreview) && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Corner Bracket Borders decoration */}
            <div className="absolute left-6 top-6 w-8 h-8 border-l-2 border-t-2 border-zinc-650 opacity-50" />
            <div className="absolute right-6 top-6 w-8 h-8 border-r-2 border-t-2 border-zinc-650 opacity-50" />
            <div className="absolute left-6 bottom-6 w-8 h-8 border-l-2 border-b-2 border-zinc-650 opacity-50" />
            <div className="absolute right-6 bottom-6 w-8 h-8 border-r-2 border-b-2 border-zinc-650 opacity-50" />

            {/* Glowing Scan Bar Line Animation when active */}
            {analyzing && (
              <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[bounce_2s_infinite]" />
            )}

            {/* Grid layout title indicator */}
            <div className="absolute left-4 top-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-2 text-[10px] font-mono tracking-wider text-zinc-405 uppercase">
              <span className={`h-1.5 w-1.5 rounded-full ${analyzing ? 'bg-cyan-400 animate-ping' : cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {analyzing ? "AI Analyzing Frame..." : cameraActive ? "Camera: Live Stream" : "Source: Static Snapshot"}
            </div>
          </div>
        )}

        {/* Dynamic Relative HTML Box Overlays (drawn from analysis output) */}
        {(cameraActive || uploadPreview) && faces && faces.map((face, index) => {
          const { ymin, xmin, ymax, xmax } = face.box;

          // Note: If live camera is active, it is mirrored (-scale-x-100), so we mirror the X boundaries coordinate!
          // We convert relative coordinates 0..1 to percentage limits
          const leftPercent = cameraActive ? (1 - xmax) * 100 : xmin * 100;
          const rightPercent = cameraActive ? (1 - xmin) * 100 : xmax * 100;
          const widthPercent = rightPercent - leftPercent;

          const topPercent = ymin * 100;
          const bottomPercent = ymax * 100;
          const heightPercent = bottomPercent - topPercent;

          return (
            <div
              key={index}
              className="absolute border-2 border-cyan-400 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.25)] flex flex-col items-start z-30 group transition-all duration-300"
              style={{
                top: `${topPercent}%`,
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
              }}
            >
              {/* Target bracket corners */}
              <div className="absolute -left-1 -top-1 w-3 h-3 border-l-2 border-t-2 border-cyan-300" />
              <div className="absolute -right-1 -top-1 w-3 h-3 border-r-2 border-t-2 border-cyan-300" />
              <div className="absolute -left-1 -bottom-1 w-3 h-3 border-l-2 border-b-2 border-cyan-300" />
              <div className="absolute -right-1 -bottom-1 w-3 h-3 border-r-2 border-b-2 border-cyan-300" />

              {/* Tag bubble pointing above or below */}
              <div className="absolute bottom-full left-0 mb-2 whitespace-nowrap bg-black/85 backdrop-blur-md border border-cyan-400 text-white rounded-md px-2 py-1 text-xs font-medium font-sans flex items-center gap-1.5 shadow-xl animate-fade-in pointer-events-auto select-none">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="font-semibold text-cyan-205">{face.gender}</span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-200">Age: <span className="text-cyan-300 font-bold">{face.age}</span></span>
                {face.mood && (
                  <>
                    <span className="text-zinc-400">|</span>
                    <span className="text-zinc-400 font-normal italic">{face.mood}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Drag Over Active Overlay State */}
        {dragActive && (
          <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-sm border-2 border-dashed border-cyan-500 flex flex-col items-center justify-center text-cyan-200 z-40 p-6 pointer-events-none">
            <Upload size={48} className="animate-bounce mb-3 text-cyan-400" />
            <h4 className="font-sans font-medium text-lg">Release to Analyze Selfie</h4>
            <p className="text-sm text-cyan-400/70">JPEG/PNG formats will process instantly</p>
          </div>
        )}
      </div>

      {/* Control Actions & Custom settings bar */}
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between shadow-lg">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Main Action buttons */}
          {cameraActive ? (
            <button
              id="btn-disable-camera"
              onClick={() => setCameraActive(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <VideoOff size={14} /> Close Camera
            </button>
          ) : (
            <button
              id="btn-activate-scanner"
              onClick={() => setCameraActive(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:opacity-90 font-medium text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Camera size={14} /> Start Real-time Monitor
            </button>
          )}

          {/* Trigger capture manually */}
          <button
            id="btn-trigger-snapshot"
            onClick={captureSnapshot}
            disabled={analyzing || (!cameraActive && !uploadPreview)}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 border border-cyan-400/20 text-zinc-950 font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} />
            {analyzing ? "Analyzing..." : "Capture & Analyze"}
          </button>
        </div>

        {/* Selectable variables */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-zinc-400">
          {/* Active Device Dropdown switcher */}
          {cameraActive && devices.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="camera-select" className="text-zinc-500">Video Device:</label>
              <select
                id="camera-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-black border border-zinc-800 rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-cyan-500"
              >
                {devices.map((device, i) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timing auto interval config */}
          <div className="flex items-center gap-3 bg-zinc-950/70 py-1.5 px-3 rounded-xl border border-zinc-850">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                id="check-auto-scan"
                type="checkbox"
                checked={autoScan}
                onChange={(e) => setAutoScan(e.target.checked)}
                disabled={!cameraActive}
                className="rounded border-zinc-800 text-cyan-500 focus:ring-cyan-500 accent-cyan-500 h-3.5 w-3.5"
              />
              <span className={`font-medium ${!cameraActive && 'opacity-40 text-zinc-500'}`}>Auto-Update Scanner</span>
            </label>

            {autoScan && cameraActive && (
              <select
                id="select-scan-frequency"
                value={scanInterval}
                onChange={(e) => setScanInterval(Number(e.target.value) as ScanInterval)}
                className="bg-zinc-900 font-mono text-[10px] border border-zinc-800 rounded px-1.5 py-0.5 text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value={2000}>2s rate</option>
                <option value={3000}>3s rate</option>
                <option value={5000}>5s rate</option>
                <option value={10000}>10s rate</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Embedded File Uploader drop container fallback area */}
      {!cameraActive && !uploadPreview && (
        <label 
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-2xl cursor-pointer transition"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="text-zinc-500 w-8 h-8 mb-2" />
            <p className="text-xs text-zinc-400 font-medium">Drag-and-drop a portrait here</p>
            <p className="text-[10px] text-zinc-500 mt-1">Accepts PNG, JPEG up to 10MB</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      {/* Display error notifications */}
      {errorMsg && (
        <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-xl flex items-start gap-2 h-auto">
          <span className="font-bold flex-shrink-0">⚠️ Notice:</span>
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
