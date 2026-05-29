import React, { useState } from "react";
import { Sparkles, Heart, Activity, User, HelpCircle, Palette, CheckCircle, Flame } from "lucide-react";
import { FaceAnalysis } from "../types";

interface RecommendationCardProps {
  face: FaceAnalysis | null;
  loading: boolean;
}

export default function RecommendationCard({ face, loading }: RecommendationCardProps) {
  const [completedTips, setCompletedTips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"skincare" | "style" | "lifestyle">("skincare");

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center shadow-xl animate-pulse">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-cyan-800 border-t-cyan-400 rounded-full animate-spin mb-4" />
          <Sparkles className="absolute text-cyan-400 animate-bounce" size={24} />
        </div>
        <h3 className="font-sans font-medium text-lg text-zinc-300 mt-4">Running Demographics Scan</h3>
        <p className="font-sans text-xs text-zinc-500 max-w-xs mt-2">
          Gemini 3.5 is calculating age thresholds, structure, and synthesizing custom style & health tips...
        </p>
      </div>
    );
  }

  if (!face) {
    return (
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center shadow-xl">
        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 text-zinc-650 mb-4">
          <Sparkles size={32} />
        </div>
        <h3 className="font-sans font-medium text-base text-zinc-300">Scan Awaiting Frame Input</h3>
        <p className="font-sans text-xs text-zinc-500 max-w-xs mt-2">
          Capture a webcam snapshot or drag an image into the analyzer slot to load the demographic recommendations dashboard.
        </p>
      </div>
    );
  }

  const { age, gender, confidence, mood, recommendations } = face;

  const toggleTip = (tip: string) => {
    setCompletedTips((prev) =>
      prev.includes(tip) ? prev.filter((t) => t !== tip) : [...prev, tip]
    );
  };

  const getCategorizedIcon = (type: "skincare" | "style" | "lifestyle") => {
    switch (type) {
      case "skincare":
        return <Heart className="text-pink-400 w-5 h-5" />;
      case "style":
        return <Palette className="text-indigo-400 w-5 h-5" />;
      case "lifestyle":
        return <Activity className="text-emerald-400 w-5 h-5" />;
    }
  };

  const currentTips = recommendations[activeTab] || [];

  return (
    <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col gap-6 shadow-xl transition-all duration-300 hover:border-zinc-800">
      {/* Demographic Segment Profile */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-cyan-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-zinc-100 tracking-tight text-base">Inferred Profile</h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Scan Match Score: {(confidence * 100).toFixed(0)}% Match</p>
            </div>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-850 rounded-xl px-3 py-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Real-Time</span>
          </div>
        </div>

        {/* Info Grid stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Age box */}
          <div className="bg-zinc-950/40 border border-zinc-850/60 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Est. Age</span>
            <span className="text-2xl font-bold text-zinc-100 font-sans block mt-0.5">{age} <span className="text-xs font-normal text-zinc-500">yrs</span></span>
          </div>

          {/* Gender box */}
          <div className="bg-zinc-950/40 border border-zinc-850/60 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Gender</span>
            <span className="text-base font-bold text-cyan-410 font-sans block truncate mt-1">{gender}</span>
          </div>

          {/* Mood box */}
          <div className="bg-zinc-950/40 border border-zinc-850/60 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Mood/Expression</span>
            <span className="text-base font-bold text-amber-411 font-sans block truncate mt-1">{mood || "Neutral"}</span>
          </div>

          {/* Confidence meter */}
          <div className="bg-zinc-950/40 border border-zinc-850/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Scan Quality</span>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 h-full rounded-full" 
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-zinc-300">{(confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Advice Dashboard */}
      <div className="flex flex-col gap-4 bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-cyan-400 w-4 h-4 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-300 font-sans uppercase tracking-wider">Demographic Recommendations</span>
          </div>

          {/* Tab switches */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 self-start sm:self-auto">
            <button
              id="tab-skincare"
              onClick={() => setActiveTab("skincare")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "skincare"
                  ? "bg-gradient-to-r from-pink-950/40 to-pink-900/10 text-pink-300 border border-pink-900/30"
                  : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-850/50"
              }`}
            >
              <Heart size={12} /> Skincare
            </button>
            <button
              id="tab-style"
              onClick={() => setActiveTab("style")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "style"
                  ? "bg-gradient-to-r from-indigo-950/40 to-indigo-900/10 text-indigo-300 border border-indigo-900/30"
                  : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-850/50"
              }`}
            >
              <Palette size={12} /> Style
            </button>
            <button
              id="tab-lifestyle"
              onClick={() => setActiveTab("lifestyle")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "lifestyle"
                  ? "bg-gradient-to-r from-emerald-950/40 to-emerald-900/10 text-emerald-300 border border-emerald-900/30"
                  : "text-zinc-400 hover:text-zinc-250 hover:bg-zinc-850/50"
              }`}
            >
              <Activity size={12} /> Wellness
            </button>
          </div>
        </div>

        {/* Detailed recommendations checklist */}
        <div className="flex flex-col gap-3 min-h-[200px]">
          {currentTips.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 py-8">
              <HelpCircle size={32} className="opacity-40 mb-2" />
              <p className="text-xs">No tailored items found for this scan.</p>
            </div>
          ) : (
            currentTips.map((tip, index) => {
              const completed = completedTips.includes(tip);
              return (
                <div
                  key={index}
                  onClick={() => toggleTip(tip)}
                  className={`border p-4 rounded-xl flex items-start gap-3 cursor-pointer transition duration-300 group ${
                    completed
                      ? "bg-zinc-950/60 border-zinc-850 text-zinc-500 opacity-70"
                      : "bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-850 hover:border-zinc-800 text-zinc-200"
                  }`}
                >
                  <button
                    id={`checkbox-tip-${index}`}
                    className={`flex-shrink-0 mt-0.5 rounded-md border p-0.5 transition ${
                      completed
                        ? "bg-cyan-950/40 border-cyan-800 text-cyan-400"
                        : "border-zinc-700 bg-zinc-950 group-hover:border-zinc-500 text-transparent"
                    }`}
                  >
                    <CheckCircle size={14} className={completed ? "opacity-100" : "opacity-0"} />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategorizedIcon(activeTab)}
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tight">Tip {index + 1}</span>
                      {!completed && (
                        <span className="text-[9px] bg-zinc-950/90 text-cyan-400 px-1.5 py-0.5 rounded font-mono border border-zinc-850 uppercase ml-auto">Active</span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed font-sans ${completed ? "line-through text-zinc-500" : "text-zinc-350"}`}>
                      {tip}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Checklist Completion Stats */}
        {currentTips.length > 0 && (
          <div className="mt-2 border-t border-zinc-855 pt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>Progress Metric</span>
            <span className="font-mono text-zinc-400 font-bold bg-zinc-950/80 px-2 py-1 rounded border border-zinc-850">
              {currentTips.filter(t => completedTips.includes(t)).length} of {currentTips.length} complete
            </span>
          </div>
        )}
      </div>

      {/* Wellness Disclaimer */}
      <span className="text-[9px] text-zinc-600 block leading-tight font-sans italic text-center max-w-md mx-auto">
        Disclaimer: Age and demographic parameters are server predictions analyzed on visual indicators. Advice is synthesized matching dynamic user traits and does not constitute official professional dermatological or styling healthcare consultation.
      </span>
    </div>
  );
}
