'use client';

import React from 'react';
import { AnalysisRunHistory } from '@/lib/storage';
import { Award, Film, ShieldCheck, Clock, BarChart3, Sparkles } from 'lucide-react';

interface AnalyticsSummaryProps {
  run: AnalysisRunHistory | null;
  filterMode: 'all' | 'sponsored' | 'clean';
  onFilterChange: (mode: 'all' | 'sponsored' | 'clean') => void;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  run,
  filterMode,
  onFilterChange,
}) => {
  if (!run || !run.videos || run.videos.length === 0) return null;

  const totalVideos = run.videos.length;
  const sponsoredVideosCount = run.sponsoredVideosCount;
  const sponsoredPercentage = totalVideos > 0 ? ((sponsoredVideosCount / totalVideos) * 100).toFixed(1) : '0';

  // Calculate brand frequency dictionary
  const brandFrequency: Record<string, number> = {};
  let totalSponsorSeconds = 0;

  run.videos.forEach((v) => {
    v.sponsors.forEach((s) => {
      brandFrequency[s.sponsorName] = (brandFrequency[s.sponsorName] || 0) + 1;
      totalSponsorSeconds += s.durationSeconds;
    });
  });

  const sortedBrands = Object.entries(brandFrequency).sort((a, b) => b[1] - a[1]);
  const topBrand = sortedBrands.length > 0 ? sortedBrands[0][0] : 'None';
  const topBrandCount = sortedBrands.length > 0 ? sortedBrands[0][1] : 0;

  const avgSponsorSecs = sponsoredVideosCount > 0 ? Math.round(totalSponsorSeconds / sponsoredVideosCount) : 0;
  const avgSponsorFormatted = `${Math.floor(avgSponsorSecs / 60)}m ${avgSponsorSecs % 60}s`;

  return (
    <div className="w-full space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#070a12] via-indigo-950/50 to-[#070a12] border border-indigo-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <span className="text-[11px] uppercase font-black tracking-widest text-cyan-400 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Executive Sponsor Intelligence Report
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Query: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 font-mono">{run.query}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Analyzed {totalVideos} videos • Ran on {new Date(run.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-[#070a12] p-1.5 rounded-2xl border border-slate-800 self-stretch sm:self-auto justify-center shadow-inner relative z-10">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              filterMode === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Videos ({totalVideos})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('sponsored')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              filterMode === 'sponsored'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sponsored ({sponsoredVideosCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('clean')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              filterMode === 'clean'
                ? 'bg-slate-800 text-slate-100 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clean ({totalVideos - sponsoredVideosCount})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Videos */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Videos Analyzed
            </span>
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">{totalVideos}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span className="text-cyan-400 font-bold">{sponsoredPercentage}%</span> contain sponsors
            </div>
          </div>
        </div>

        {/* Card 2: Sponsored Videos */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Sponsored Count
            </span>
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">{sponsoredVideosCount}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              Out of {totalVideos} total videos
            </div>
          </div>
        </div>

        {/* Card 3: Top Brand Partner */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Top Brand Partner
            </span>
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 truncate">{topBrand}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Featured in <span className="text-white font-bold">{topBrandCount}</span> videos
            </div>
          </div>
        </div>

        {/* Card 4: Total Sponsor Duration */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Total Sponsor Time
            </span>
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {run.totalSponsorTimeFormatted}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              Avg ~{avgSponsorFormatted} per video
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
