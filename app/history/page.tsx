'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VideoCard } from '@/components/VideoCard';
import { VideoDetailModal } from '@/components/VideoDetailModal';
import { 
  getHistory, 
  clearHistory, 
  deleteHistoryItem, 
  getFavorites, 
  toggleFavoriteVideo,
  AnalysisRunHistory, 
  VideoAnalysisResult 
} from '@/lib/storage';
import { 
  History, 
  Trash2, 
  Search, 
  Star, 
  Users, 
  PlayCircle, 
  ArrowLeft, 
  RotateCcw, 
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisRunHistory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'channel' | 'video' | 'favorites'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalysisResult | null>(null);

  const loadData = () => {
    setHistory(getHistory());
    setFavorites(getFavorites());
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('fumance_storage_change', handleStorageChange);
    return () => window.removeEventListener('fumance_storage_change', handleStorageChange);
  }, []);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all saved analysis history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleDeleteRun = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    setHistory(getHistory());
  };

  const handleToggleFav = (videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleFavoriteVideo(videoId);
    setFavorites(getFavorites());
  };

  // Filter history runs
  const filteredRuns = history.filter((run) => {
    if (activeTab === 'channel' && run.mode !== 'channel') return false;
    if (activeTab === 'video' && run.mode !== 'video') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        run.query.toLowerCase().includes(q) ||
        run.topSponsorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Extract all favorite videos across all runs
  const favoriteVideos: VideoAnalysisResult[] = [];
  const addedFavIds = new Set<string>();

  history.forEach((run) => {
    run.videos.forEach((v) => {
      if (favorites.includes(v.videoId) && !addedFavIds.has(v.videoId)) {
        favoriteVideos.push(v);
        addedFavIds.add(v.videoId);
      }
    });
  });

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-purple-400" />
            Saved Analysis History & Favorites
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review past channel scans, single video sponsor reports, and bookmarked video highlights.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 transition-all"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            Clear All History
          </button>
        )}
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Runs ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('channel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'channel'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Channels
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'video'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Single Videos
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'favorites'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            Favorites ({favoriteVideos.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Favorites View Tab */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Bookmarked Favorite Sponsor Highlights ({favoriteVideos.length})
          </h2>

          {favoriteVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteVideos.map((video) => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  onSelect={setSelectedVideo}
                  isFavorite={true}
                  onToggleFavorite={handleToggleFav}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400">
              <p className="text-base font-semibold">No favorite videos bookmarked yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Click the star icon on any video card during analysis to save it here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Runs List View */}
      {activeTab !== 'favorites' && (
        <div className="space-y-6">
          {filteredRuns.length > 0 ? (
            <div className="space-y-6">
              {filteredRuns.map((run) => (
                <div
                  key={run.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 shadow-lg transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          run.mode === 'channel'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        }`}>
                          {run.mode} mode
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(run.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white font-mono">
                        {run.query}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/?query=${encodeURIComponent(run.query)}&mode=${run.mode}`}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Re-Analyze
                      </Link>
                      <button
                        onClick={(e) => handleDeleteRun(run.id, e)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition-colors"
                        title="Delete Run"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 text-xs">
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">Videos Analyzed</span>
                      <span className="font-mono font-bold text-white text-sm">{run.analyzedVideosCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">Sponsored Videos</span>
                      <span className="font-mono font-bold text-cyan-400 text-sm">{run.sponsoredVideosCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">Top Brand</span>
                      <span className="font-semibold text-purple-300 text-sm truncate block">{run.topSponsorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[10px]">Total Sponsor Duration</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">{run.totalSponsorTimeFormatted}</span>
                    </div>
                  </div>

                  {/* Sample Video Thumbnails */}
                  <div className="pt-2">
                    <span className="text-xs text-slate-400 font-semibold mb-3 block">
                      Videos in this Run ({run.videos.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {run.videos.map((video) => (
                        <VideoCard
                          key={video.videoId}
                          video={video}
                          onSelect={setSelectedVideo}
                          isFavorite={favorites.includes(video.videoId)}
                          onToggleFavorite={handleToggleFav}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
              <p className="text-base font-semibold">No analysis history found matching your filters.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold rounded-xl text-xs shadow-lg"
              >
                Start New Analysis <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
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
