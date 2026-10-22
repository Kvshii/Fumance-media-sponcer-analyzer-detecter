'use client';

import React from 'react';
import { VideoAnalysisResult } from '@/lib/storage';
import { ShieldAlert, Clock, Percent, Star, ExternalLink, Youtube } from 'lucide-react';

interface VideoCardProps {
  video: VideoAnalysisResult;
  onSelect: (video: VideoAnalysisResult) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (videoId: string, e: React.MouseEvent) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const mainSponsor = video.sponsors.length > 0 ? video.sponsors[0] : null;
  const youtubeUrl = mainSponsor 
    ? `https://www.youtube.com/watch?v=${video.videoId}&t=${mainSponsor.startTime}s`
    : `https://www.youtube.com/watch?v=${video.videoId}`;

  return (
    <div 
      onClick={() => onSelect(video)}
      className="group relative glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5"
    >
      {/* Top Header Row: Channel & Favorite Star */}
      <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2 text-slate-400 min-w-0 pr-2">
          <span className="font-extrabold text-slate-200 truncate hover:text-cyan-400 transition-colors">
            {video.channelName}
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-500 shrink-0">{video.publishedAt}</span>
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => onToggleFavorite(video.videoId, e)}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              isFavorite
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-400 shadow-sm'
                : 'bg-[#070a12] border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
            }`}
            title={isFavorite ? 'Remove Favorite' : 'Save Favorite'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Main Brand & Video Title */}
      <div className="space-y-3.5">
        {/* Brand Banner Pill */}
        {video.hasSponsor && mainSponsor ? (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-[#070a12] to-purple-950/50 border border-indigo-800/60 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-lg">
                {mainSponsor.sponsorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest block">
                  Detected Sponsor
                </span>
                <h4 className="font-black text-base text-white truncate">
                  {mainSponsor.sponsorName}
                </h4>
              </div>
            </div>

            <span className="shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 shadow-sm">
              {mainSponsor.category}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#070a12] border border-slate-800/80 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
            <span>No sponsor integration detected</span>
          </div>
        )}

        {/* Video Title */}
        <h3 className="font-extrabold text-sm text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
          {video.title}
        </h3>
      </div>

      {/* Sponsor Metrics Container */}
      {video.hasSponsor && mainSponsor && (
        <div className="bg-[#070a12]/90 border border-slate-800/90 rounded-2xl p-4 space-y-3.5 text-xs shadow-inner">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Timestamp Range
              </span>
              <span className="font-mono font-extrabold text-cyan-300 text-xs">
                {mainSponsor.startFormatted} - {mainSponsor.endFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Sponsor Duration
              </span>
              <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {mainSponsor.durationFormatted}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-900">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                Sponsor Share of Video:
              </span>
              <span className="font-mono font-black text-cyan-400">
                {mainSponsor.percentOfVideo}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, mainSponsor.percentOfVideo * 3)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {mainSponsor ? (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all transform hover:scale-[1.02] group/btn"
          >
            <Youtube className="w-4 h-4 fill-white" />
            <span>Watch @ {mainSponsor.startFormatted} on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-90 group-hover/btn:translate-x-0.5 transition-transform" />
          </a>
        ) : (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Youtube className="w-4 h-4 text-red-500 fill-current" />
            <span>Watch Video on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        )}
      </div>
    </div>
  );
};
