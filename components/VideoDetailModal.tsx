'use client';

import React, { useState, useEffect } from 'react';
import { VideoAnalysisResult, SponsorSegment } from '@/lib/storage';
import { X, Clock, Percent, ShieldCheck, Star, ExternalLink, Sparkles, Share2, Check, Youtube, Award, Tag } from 'lucide-react';

interface VideoDetailModalProps {
  video: VideoAnalysisResult | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (videoId: string) => void;
}

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({
  video,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [activeStartTime, setActiveStartTime] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (video && video.sponsors.length > 0) {
      setActiveStartTime(video.sponsors[0].startTime);
    } else {
      setActiveStartTime(0);
    }
  }, [video]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  const handleShare = () => {
    const url = `https://www.youtube.com/watch?v=${video.videoId}&t=${activeStartTime}s`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeSegment = video.sponsors.find(s => s.startTime === activeStartTime) || video.sponsors[0];
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}&t=${activeStartTime}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 pr-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white line-clamp-1">
                {video.title}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-300">{video.channelName}</span>
                <span>•</span>
                <span>{video.publishedAt}</span>
                <span>•</span>
                <span className="text-cyan-400 font-mono">{video.viewCountFormatted}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(video.videoId)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isFavorite
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
                title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Copy YouTube Timestamped Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Executive Direct Action Callout Card */}
          <div className="bg-gradient-to-r from-slate-950 via-purple-950/60 to-slate-950 border border-purple-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sponsor Integration Target
                </span>
                <h4 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>Brand:</span>
                  <span className="text-purple-300 font-mono">
                    {activeSegment ? activeSegment.sponsorName : video.primarySponsorName}
                  </span>
                </h4>
                {activeSegment && (
                  <p className="text-xs text-slate-400 font-mono">
                    Starts at <strong className="text-cyan-300">{activeSegment.startFormatted}</strong> • Category: <span className="text-purple-300">{activeSegment.category}</span>
                  </p>
                )}
              </div>

              {/* Direct YouTube Action Button */}
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-red-600/30 transition-all transform hover:scale-105 shrink-0"
              >
                <Youtube className="w-5 h-5 fill-white" />
                <span>Watch on YouTube @ {activeSegment?.startFormatted || '00:00'}</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            </div>
          </div>

          {/* Detected Sponsor Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Detected Sponsor Breakdown ({video.sponsors.length})
            </h4>

            {video.sponsors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {video.sponsors.map((seg, idx) => {
                  const segYtUrl = `https://www.youtube.com/watch?v=${video.videoId}&t=${seg.startTime}s`;
                  const isCurrentActive = seg.startTime === activeStartTime;

                  return (
                    <div
                      key={seg.id || idx}
                      onClick={() => setActiveStartTime(seg.startTime)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                        isCurrentActive
                          ? 'bg-purple-950/50 border-purple-500 shadow-glow-purple'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-xs">
                            {seg.sponsorName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-extrabold text-base text-white">
                            {seg.sponsorName}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50">
                          {seg.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-medium">Timestamp</span>
                          <span className="font-mono font-bold text-cyan-300">
                            {seg.startFormatted} - {seg.endFormatted}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-medium">Duration</span>
                          <span className="font-mono text-slate-200 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {seg.durationFormatted}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-medium">Share</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            {seg.percentOfVideo}%
                          </span>
                        </div>
                      </div>

                      {seg.descriptionSnippet && (
                        <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                          &quot;{seg.descriptionSnippet}&quot;
                        </p>
                      )}

                      {/* Direct YouTube Action Button */}
                      <a
                        href={segYtUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <Youtube className="w-4 h-4 fill-white" />
                        <span>Watch {seg.sponsorName} @ {seg.startFormatted} on YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                No sponsor segments detected for this video.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
