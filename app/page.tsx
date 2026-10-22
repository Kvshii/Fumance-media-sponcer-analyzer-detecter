'use client';

import React, { useState, useEffect } from 'react';
import { InputForm } from '@/components/InputForm';
import { PastSponsorsList } from '@/components/PastSponsorsList';
import { VideoCard } from '@/components/VideoCard';
import { VideoDetailModal } from '@/components/VideoDetailModal';
import { AnalyticsSummary } from '@/components/AnalyticsSummary';
import {
  VideoAnalysisResult,
  AnalysisRunHistory,
  saveAnalysisRun,
  getFavorites,
  toggleFavoriteVideo
} from '@/lib/storage';
import { Sparkles, ShieldCheck, Flame, AlertCircle, LayoutGrid, Award } from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<AnalysisRunHistory | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysisResult | null>(null);
  const [activeView, setActiveView] = useState<'sponsors' | 'videos'>('sponsors');
  const [filterMode, setFilterMode] = useState<'all' | 'sponsored' | 'clean'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    const handleStorageChange = () => setFavorites(getFavorites());
    window.addEventListener('fumance_storage_change', handleStorageChange);
    return () => window.removeEventListener('fumance_storage_change', handleStorageChange);
  }, []);

  const handleAnalyze = async (query: string, mode: 'channel' | 'video', videoCount: number) => {
    // Clear previous run to prevent any data mixing
    setCurrentRun(null);
    setSelectedVideo(null);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode, videoCount }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze YouTube sponsor data.');
      }

      const run: AnalysisRunHistory = data.run;
      setCurrentRun(run);
      saveAnalysisRun(run);

      // Default to sponsors view if channel, videos view if single video
      if (run.mode === 'video') {
        setActiveView('videos');
      } else {
        setActiveView('sponsors');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err?.message || 'Failed to analyze YouTube input.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFav = (videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleFavoriteVideo(videoId);
    setFavorites(getFavorites());
  };

  // Frontend Defensive Validation & Filter
  const filteredVideos = currentRun?.videos.filter((v) => {
    // Reject any video not belonging to requested channel ID
    if (currentRun.mode === 'channel' && currentRun.requestedChannelId && v.channelId && v.channelId !== currentRun.requestedChannelId) {
      return false;
    }
    if (filterMode === 'sponsored') return v.hasSponsor;
    if (filterMode === 'clean') return !v.hasSponsor;
    return true;
  }) || [];

  return (
    <div className="space-y-12">
      {/* Hero Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-semibold shadow-glow-purple">
          <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Fumance Media • YouTube Sponsor Intelligence</span>
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          YouTube Past Sponsors <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">
            & Brand Detector
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Uncover brand partnerships, promo codes, repeat sponsor frequency, and exact video timestamp evidence across YouTube channels and individual uploads.
        </p>
      </div>

      {/* Main Form Box */}
      <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />

      {/* Error Alert */}
      {error && (
        <div className="max-w-4xl mx-auto p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-400 hover:text-rose-200 font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-40 bg-slate-900 rounded-3xl border border-slate-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-900 rounded-3xl border border-slate-800" />
            ))}
          </div>
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-900 rounded-3xl border border-slate-800" />
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {!isLoading && currentRun && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* View Mode Switcher (Sponsors vs Video Breakdown) */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center bg-[#070a12] p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveView('sponsors')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  activeView === 'sponsors'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4 text-cyan-400" />
                <span>Past Sponsors ({currentRun.sponsors?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('videos')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  activeView === 'videos'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-cyan-300" />
                <span>Video Breakdown ({currentRun.videos.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Mode: <strong className="text-white uppercase">{currentRun.mode}</strong> • Scanned on {new Date(currentRun.timestamp).toLocaleTimeString()}
            </div>
          </div>

          {/* VIEW 1: HotSlicer Past Sponsors View */}
          {activeView === 'sponsors' && (
            <PastSponsorsList
              channel={currentRun.channel}
              sponsors={currentRun.sponsors || []}
              videosAnalyzedCount={currentRun.analyzedVideosCount}
              confirmedCount={currentRun.confirmedSponsorsCount || 0}
              topSponsorName={currentRun.topSponsorName || 'None'}
              notice={currentRun.notice}
            />
          )}

          {/* VIEW 2: Video-by-Video Breakdown View */}
          {activeView === 'videos' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <AnalyticsSummary
                run={currentRun}
                filterMode={filterMode}
                onFilterChange={setFilterMode}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    Verified Channel Uploads ({filteredVideos.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Showing {filteredVideos.length} of {currentRun.videos.length} verified videos
                  </span>
                </div>

                {filteredVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        onSelect={setSelectedVideo}
                        isFavorite={favorites.includes(video.videoId)}
                        onToggleFavorite={handleToggleFav}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
                    <p className="text-base font-semibold">
                      {filterMode === 'sponsored' ? 'No sponsored videos found for this channel.' : 'No verified videos match the selected filter.'}
                    </p>
                    <button
                      onClick={() => setFilterMode('all')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs"
                    >
                      Show All Verified Videos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State Welcome Callout */}
      {!isLoading && !currentRun && (
        <div className="max-w-4xl mx-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-purple-950/80 border border-purple-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Ready for Sponsor Analysis</h3>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Select a mode above, enter a YouTube handle (e.g. <code className="text-cyan-300">@MKBHD</code>) or video URL, and click <strong className="text-white">Analyze Past Sponsors</strong> to retrieve real-time verified telemetry.
          </p>
        </div>
      )}

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        isFavorite={selectedVideo ? favorites.includes(selectedVideo.videoId) : false}
        onToggleFavorite={(videoId) => handleToggleFav(videoId)}
      />
    </div>
  );
}
