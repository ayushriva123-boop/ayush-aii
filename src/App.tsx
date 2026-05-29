import React, { useState } from "react";
import { Sparkles, Camera, Shield, Eye, Heart, Palette, Activity, Sliders } from "lucide-react";
import CameraFeed from "./components/CameraFeed";
import RecommendationCard from "./components/RecommendationCard";
import { FaceAnalysis, ScanInterval } from "./types";

export default function App() {
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [faces, setFaces] = useState<FaceAnalysis[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [autoScan, setAutoScan] = useState<boolean>(false);
  const [scanInterval, setScanInterval] = useState<ScanInterval>(3000);
  const [calibrationMode, setCalibrationMode] = useState<"standard" | "youthful" | "teens_gen_z">("youthful");
  const [error, setError] = useState<string | null>(null);

  // Handle capture payload from either webcam stream or dragged files
  const handleCapture = async (base64Image: string) => {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image, calibrationMode }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP Service error (Status: ${response.status})`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const detectedFaces = data.faces || [];
      setFaces(detectedFaces);
      setSelectedFaceIndex(0); // Reset selector index to first match
    } catch (err: any) {
      console.error("Frame analysis failure:", err);
      setError(err.message || "An unyielding error occurred while communicating with the AI analyze engine.");
    } finally {
      setAnalyzing(false);
    }
  };

  const activeFace = faces[selectedFaceIndex] || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-cyan-900/40 select-none">
      {/* Top Header Panel */}
      <header className="border-b border-zinc-900 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 rounded-xl shadow-inner animate-pulse">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-lg font-sans font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                Ayush <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">AI Detector</span>
              </h1>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Real-time facial metadata & personalized wellness dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-mono uppercase text-zinc-505 tracking-wider">Engine Status</div>
              <div className="text-xs font-semibold text-emerald-400 font-sans flex items-center justify-end gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                OpenAI o3
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dynamic Workspace grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* API Key instruction banner if needed */}
       

        {/* Workspace Splitting Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Capture / Camera stream */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="text-cyan-400 w-4 h-4" />
                <h2 className="font-sans font-semibold text-zinc-200 text-sm uppercase tracking-wider">Visual Scan Input</h2>
              </div>
              {faces.length > 0 && (
                <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-lg">
                  {faces.length} {faces.length === 1 ? "Face" : "Faces"} Logged
                </span>
              )}
            </div>

            <CameraFeed
              onCapture={handleCapture}
              analyzing={analyzing}
              faces={faces}
              cameraActive={cameraActive}
              setCameraActive={setCameraActive}
              autoScan={autoScan}
              setAutoScan={setAutoScan}
              scanInterval={scanInterval}
              setScanInterval={setScanInterval}
            />

            {/* Age Calibration Setup Panel */}
            <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="text-cyan-400 w-4 h-4" />
                  <h3 className="text-xs font-semibold text-zinc-350 uppercase tracking-wider font-sans">Age Calibration Filters</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 border border-zinc-855 px-2.5 py-1 rounded-lg uppercase">
                  {calibrationMode === "teens_gen_z" ? "Gen-Z Tune" : calibrationMode === "youthful" ? "Anti-Shadow Skin Tune" : "Standard Scale"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Webcam shadows, dim lighting, or camera contrast can artificially age faces by introducing deep grain patterns. Choose your context below to calibrate the AI sensor bias:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                <button
                  id="btn-tune-youthful"
                  onClick={() => setCalibrationMode("youthful")}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col gap-1 ${
                    calibrationMode === "youthful"
                      ? "bg-cyan-950/20 border-cyan-500/80 text-zinc-200"
                      : "bg-zinc-950/50 border-zinc-850 hover:border-zinc-800 text-zinc-400"
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Sparkles size={11} className={calibrationMode === "youthful" ? "text-cyan-400" : "text-zinc-500"} />
                    Youthful Tune
                  </span>
                  <span className="text-[9px] text-zinc-500 leading-snug">Calibrates for general room shadows & glare (Optimistic bias)</span>
                </button>

                <button
                  id="btn-tune-young-adult"
                  onClick={() => setCalibrationMode("teens_gen_z")}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col gap-1 ${
                    calibrationMode === "teens_gen_z"
                      ? "bg-cyan-950/20 border-cyan-500/80 text-zinc-200"
                      : "bg-zinc-950/50 border-zinc-850 hover:border-zinc-800 text-zinc-400"
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Heart size={11} className={calibrationMode === "teens_gen_z" ? "text-cyan-400" : "text-zinc-500"} />
                    Teen / Gen-Z Tune
                  </span>
                  <span className="text-[9px] text-zinc-500 leading-snug">Strict youthful age scale (Ensures actual youth score matches)</span>
                </button>

                <button
                  id="btn-tune-standard"
                  onClick={() => setCalibrationMode("standard")}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col gap-1 ${
                    calibrationMode === "standard"
                      ? "bg-cyan-950/20 border-cyan-500/80 text-zinc-200"
                      : "bg-zinc-950/50 border-zinc-850 hover:border-zinc-800 text-zinc-400"
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Eye size={11} className={calibrationMode === "standard" ? "text-cyan-400" : "text-zinc-500"} />
                    Standard scale
                  </span>
                  <span className="text-[9px] text-zinc-500 leading-snug">Direct visual traits without background compensation</span>
                </button>
              </div>
            </div>

            {/* Error messaging inside workspace */}
            {error && (
              <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                  <span>⚠️ Demographics Pipeline Alert</span>
                </div>
                <p className="text-xs text-red-350 leading-relaxed font-sans mt-1">
                  {error}
                </p>
                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                  Ensure the GEMINI_API_KEY secret is populated correctly in your workspace parameters.
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Recommendations / Output stats */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Multiple faces selector toggler */}
            {faces.length > 1 && (
              <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-850 p-4 rounded-2xl">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
                  <Eye size={12} className="text-cyan-400" /> Selective Focus
                </label>
                <div className="flex flex-wrap gap-2">
                  {faces.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedFaceIndex(i)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        selectedFaceIndex === i
                          ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/10 font-bold"
                          : "bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Face {i + 1} ({f.gender}, {f.age}y)
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Activity className="text-cyan-400 w-4 h-4" />
              <h2 className="font-sans font-semibold text-zinc-200 text-sm uppercase tracking-wider">Demographic Profiles & Tips</h2>
            </div>

            <RecommendationCard
              face={activeFace}
              loading={analyzing}
            />
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-550 font-sans">
          <div className="flex items-center gap-4">
            <span className="text-zinc-800">•</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
