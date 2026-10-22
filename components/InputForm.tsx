'use client';

import React, { useState, useEffect } from 'react';
import { Search, PlayCircle, Users, Sparkles, Clipboard, X, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InputFormProps {
  onAnalyze: (query: string, mode: 'channel' | 'video', videoCount: number) => void;
  isLoading: boolean;
}

const PROGRESS_STAGES = [
  { step: 1, text: 'Resolving YouTube channel identity & metadata...', icon: Users },
  { step: 2, text: 'Fetching recent uploads and descriptions...', icon: PlayCircle },
  { step: 3, text: 'Extracting commercial links, promo codes & disclosures...', icon: Sparkles },
  { step: 4, text: 'Cross-verifying SponsorBlock timestamps & brand frequency...', icon: ShieldCheck },
];

export const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading }) => {
  const [mode, setMode] = useState<'channel' | 'video'>('channel');
  const [query, setQuery] = useState('');
  const [videoCount, setVideoCount] = useState<number>(25);
  const [activeStage, setActiveStage] = useState(0);

  // Cycle through progress stages while loading
  useEffect(() => {
    if (!isLoading) {
      setActiveStage(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStage((prev) => (prev < PROGRESS_STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onAnalyze(query.trim(), mode, videoCount);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuery(text);
        if (text.includes('watch?v=') || text.includes('youtu.be/')) {
          setMode('video');
        } else if (text.includes('@') || text.includes('channel/')) {
          setMode('channel');
        }
      }
    } catch (err) {
      console.warn('Clipboard access failed', err);
    }
  };

  const setSampleQuery = (sampleText: string, sampleMode: 'channel' | 'video') => {
    setQuery(sampleText);
    setMode(sampleMode);
  };

  return (
    <div className="w-full max-w-5xl mx-auto glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border-2 border-indigo-500/30">
      {/* Background Radial Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>HotSlicer-Style Brand Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3">
            YouTube Past Sponsors Detector
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-1 font-medium">
            Analyze YouTube channels to reveal past sponsors, brand frequency, promo codes, and video evidence.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#070a12] p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setMode('channel')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              mode === 'channel'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-indigo-600/40 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-300" />
            Channel Mode
          </button>
          <button
            type="button"
            onClick={() => setMode('video')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              mode === 'video'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/40 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <PlayCircle className="w-4 h-4 text-cyan-300" />
            Single Video
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HERO-SIZED URL SEARCH BAR */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-cyan-400">
            <Search className="w-7 h-7" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'channel'
                ? 'Enter YouTube channel URL, handle (e.g. @MKBHD), or Channel ID...'
                : 'Paste YouTube video URL (e.g. https://www.youtube.com/watch?v=...)'
            }
            className="w-full pl-16 pr-36 py-6 sm:py-7 bg-[#070a12]/95 border-2 border-slate-700/80 group-hover:border-cyan-400 focus:border-cyan-400 rounded-3xl text-base sm:text-xl text-white placeholder-slate-400 font-bold focus:outline-none focus:ring-4 focus:ring-cyan-400/25 transition-all shadow-2xl"
            disabled={isLoading}
          />

          <div className="absolute inset-y-0 right-4 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-2.5 text-slate-400 hover:text-white transition-colors"
                title="Clear input"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all border border-slate-700 shadow-md transform hover:scale-105"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4 text-cyan-400" />
              <span>Paste URL</span>
            </button>
          </div>
        </div>

        {/* HotSlicer Video Count Selector: 15, 25, 45, 70 */}
        {mode === 'channel' && (
          <div className="bg-[#070a12]/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span>Recent Videos to Analyze:</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                Select depth of video history scan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[15, 25, 45, 70].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setVideoCount(preset)}
                  className={`py-3.5 px-4 rounded-xl text-sm font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                    videoCount === preset
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 ring-2 ring-cyan-400 scale-[1.02]'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  <span className="text-lg font-mono font-black">{preset}</span>
                  <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90">Videos</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Progress Stage Notification (Active when isLoading) */}
        {isLoading && (
          <div className="p-5 rounded-2xl bg-[#0b101f] border border-cyan-500/40 shadow-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Scanning Channel & Sponsor Signatures...
              </span>
              <span>Stage {activeStage + 1} of {PROGRESS_STAGES.length}</span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full transition-all duration-500"
                style={{ width: `${((activeStage + 1) / PROGRESS_STAGES.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {PROGRESS_STAGES.map((s, idx) => {
                const isCurrent = idx === activeStage;
                const isPassed = idx < activeStage;
                return (
                  <div
                    key={s.step}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 font-bold'
                        : isPassed
                        ? 'text-slate-400'
                        : 'text-slate-600 opacity-60'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] shrink-0 font-mono">
                        {s.step}
                      </span>
                    )}
                    <span className="truncate">{s.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sample Links & Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs text-slate-400 font-bold">Try Sample:</span>
            <button
              type="button"
              onClick={() => setSampleQuery('@MKBHD', 'channel')}
              className="text-cyan-300 hover:text-white font-mono text-xs bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-700/60 font-extrabold transition-colors"
            >
              @MKBHD
            </button>
            <button
              type="button"
              onClick={() => setSampleQuery('@LinusTechTips', 'channel')}
              className="text-purple-300 hover:text-white font-mono text-xs bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-700/60 font-extrabold transition-colors"
            >
              @LinusTechTips
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-base rounded-2xl shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-3 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-white" />
                <span>Analyzing Past Sponsors...</span>
              </>
            ) : (
              <>
                <span>ANALYZE PAST SPONSORS</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
