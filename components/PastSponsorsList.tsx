'use client';

import React, { useState, useMemo } from 'react';
import { PastSponsor, ChannelInfo, PastSponsorVideo } from '@/lib/storage';
import {
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Youtube,
  Award,
  Film,
  ShieldCheck,
  Sparkles,
  Tag,
  ArrowUpDown
} from 'lucide-react';

interface PastSponsorsListProps {
  channel?: ChannelInfo;
  sponsors: PastSponsor[];
  videosAnalyzedCount: number;
  confirmedCount: number;
  topSponsorName: string;
  notice?: string;
  onOpenVideo?: (v: PastSponsorVideo) => void;
}

export const PastSponsorsList: React.FC<PastSponsorsListProps> = ({
  channel,
  sponsors,
  videosAnalyzedCount,
  confirmedCount,
  topSponsorName,
  notice,
  onOpenVideo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfidence, setFilterConfidence] = useState<'ALL' | 'CONFIRMED' | 'PROBABLE'>('ALL');
  const [sortBy, setSortBy] = useState<'FREQUENT' | 'CONFIDENCE' | 'ALPHA'>('FREQUENT');
  const [expandedSponsorIds, setExpandedSponsorIds] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSponsorIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter & Sort logic
  const filteredSponsors = useMemo(() => {
    let list = [...sponsors];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        sp =>
          sp.brandName.toLowerCase().includes(q) ||
          sp.domain.toLowerCase().includes(q) ||
          sp.category.toLowerCase().includes(q) ||
          sp.discountCodes.some(c => c.toLowerCase().includes(q))
      );
    }

    // Confidence filter
    if (filterConfidence === 'CONFIRMED') {
      list = list.filter(sp => sp.confidence === 'CONFIRMED');
    } else if (filterConfidence === 'PROBABLE') {
      list = list.filter(sp => sp.confidence === 'CONFIRMED' || sp.confidence === 'PROBABLE');
    }

    // Sort order
    if (sortBy === 'FREQUENT') {
      list.sort((a, b) => b.videoCount - a.videoCount || b.confidenceScore - a.confidenceScore);
    } else if (sortBy === 'CONFIDENCE') {
      list.sort((a, b) => b.confidenceScore - a.confidenceScore || b.videoCount - a.videoCount);
    } else if (sortBy === 'ALPHA') {
      list.sort((a, b) => a.brandName.localeCompare(b.brandName));
    }

    return list;
  }, [sponsors, searchQuery, filterConfidence, sortBy]);

  const probableCount = sponsors.filter(s => s.confidence === 'PROBABLE').length;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Channel Header Banner */}
      {channel && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-[#070a12] via-indigo-950/60 to-[#070a12] border border-indigo-800/70 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10 min-w-0">
            <img
              src={channel.channelAvatar || 'https://i.ytimg.com/vi/default/hqdefault.jpg'}
              alt={channel.channelTitle}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-cyan-400/80 object-cover shadow-xl shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">
                  Target Channel
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">{channel.channelHandle}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white truncate">
                {channel.channelTitle}
              </h2>
              <a
                href={channel.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
              >
                <Youtube className="w-4 h-4 text-rose-500 fill-current" />
                <span>Visit YouTube Channel</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800 shrink-0">
            <span>Channel ID:</span>
            <span className="text-white font-bold">{channel.channelId}</span>
          </div>
        </div>
      )}

      {/* Informational Notice Banner if present */}
      {notice && (
        <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-700/60 text-cyan-200 text-xs flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* HotSlicer Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Analyzed Videos */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Videos Analyzed
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{videosAnalyzedCount}</div>
          <div className="text-xs text-slate-400">Recent uploads scanned</div>
        </div>

        {/* Metric 2: Discovered Sponsors */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Total Sponsors
            </span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-400 font-mono">{sponsors.length}</div>
          <div className="text-xs text-slate-400">Unique brand integrations</div>
        </div>

        {/* Metric 3: Confirmed Partnerships */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Confirmed Partners
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{confirmedCount}</div>
          <div className="text-xs text-slate-400">High-confidence sponsors</div>
        </div>

        {/* Metric 4: Top Brand Partner */}
        <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-2 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Top Brand
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 truncate font-mono">
            {topSponsorName}
          </div>
          <div className="text-xs text-slate-400">Most frequent sponsor</div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-[#070a12]/95 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search by brand name */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sponsor by brand name, domain, or promo code..."
              className="w-full pl-12 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-400 font-semibold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setFilterConfidence('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                filterConfidence === 'ALL'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({sponsors.length})
            </button>
            <button
              onClick={() => setFilterConfidence('CONFIRMED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                filterConfidence === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Confirmed ({confirmedCount})
            </button>
            <button
              onClick={() => setFilterConfidence('PROBABLE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                filterConfidence === 'PROBABLE'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Probable+ ({confirmedCount + probableCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-2xl border border-slate-800 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-bold">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-white font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="FREQUENT" className="bg-slate-900 text-white">Most Frequent</option>
              <option value="CONFIDENCE" className="bg-slate-900 text-white">Highest Confidence</option>
              <option value="ALPHA" className="bg-slate-900 text-white">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Past Sponsor Cards List */}
      <div className="space-y-4">
        {filteredSponsors.length > 0 ? (
          filteredSponsors.map(sponsor => {
            const isExpanded = !!expandedSponsorIds[sponsor.id];

            return (
              <div
                key={sponsor.id}
                className="glass-panel rounded-3xl border border-slate-800/90 hover:border-indigo-500/50 transition-all p-6 sm:p-7 shadow-xl space-y-5"
              >
                {/* Sponsor Top Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Brand Avatar */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-base sm:text-lg shadow-lg shrink-0">
                      {sponsor.brandName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                          {sponsor.brandName}
                        </h3>

                        {/* Category Tag */}
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                          {sponsor.category}
                        </span>

                        {/* Confidence Badge */}
                        {sponsor.confidence === 'CONFIRMED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Confirmed Sponsor
                          </span>
                        )}
                        {sponsor.confidence === 'PROBABLE' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                            <AlertCircle className="w-3 h-3 text-cyan-400" />
                            Probable Sponsor
                          </span>
                        )}
                        {sponsor.confidence === 'POTENTIAL' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-700/60">
                            <HelpCircle className="w-3 h-3 text-purple-400" />
                            Potential Sponsor
                          </span>
                        )}
                      </div>

                      {/* Domain / Website URL */}
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-mono transition-colors"
                      >
                        <span>{sponsor.domain}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Frequency & Video Share Badge */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="text-sm sm:text-base font-black text-white font-mono flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                        {sponsor.videoCount} {sponsor.videoCount === 1 ? 'Video' : 'Videos'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {sponsor.percentageOfAnalyzed}% of analyzed uploads
                    </span>
                  </div>
                </div>

                {/* Promo Codes & Detection Methods */}
                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-900">
                  {sponsor.discountCodes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        Promo Code:
                      </span>
                      {sponsor.discountCodes.map(code => (
                        <button
                          key={code}
                          onClick={() => copyToClipboard(code)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 border border-amber-600/70 hover:border-amber-400 text-amber-300 font-mono font-black text-xs rounded-xl transition-all shadow-sm group"
                          title="Click to copy promo code"
                        >
                          <span>{code}</span>
                          {copiedCode === code ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-amber-400 opacity-70 group-hover:opacity-100" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Detection Evidence tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {sponsor.detectionMethods.map(method => (
                      <span
                        key={method}
                        className="text-[10px] font-medium px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Evidence Quote Snippet */}
                {sponsor.evidenceSnippets.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#070a12] border border-slate-800/80 text-xs text-slate-300 italic font-medium leading-relaxed">
                    &ldquo;{sponsor.evidenceSnippets[0]}&rdquo;
                  </div>
                )}

                {/* Accordion Toggle: Video Evidence List */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(sponsor.id)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-cyan-400" />
                      <span>
                        {isExpanded ? 'Hide' : 'View'} {sponsor.videos.length}{' '}
                        {sponsor.videos.length === 1 ? 'Video featuring' : 'Videos featuring'}{' '}
                        {sponsor.brandName}
                      </span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded Video List */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 pl-2 sm:pl-4 border-l-2 border-indigo-500/40">
                      {sponsor.videos.map(v => (
                        <div
                          key={v.videoId}
                          className="p-4 rounded-2xl bg-[#070a12] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={v.thumbnailUrl}
                              alt={v.title}
                              className="w-20 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
                            />
                            <div className="min-w-0 space-y-1">
                              <h4 className="text-sm font-bold text-white truncate hover:text-cyan-300 transition-colors">
                                {v.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <span>Published: {v.publishedAt}</span>
                                {v.hasTimestamp && (
                                  <>
                                    <span>•</span>
                                    <span className="text-cyan-400 font-bold">
                                      Timestamp: @ {v.timestampFormatted}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Direct Watch Button with Timestamp */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <a
                              href={v.timestampUrl || v.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-transform hover:scale-105"
                            >
                              <Youtube className="w-4 h-4 fill-white" />
                              <span>
                                {v.hasTimestamp
                                  ? `Watch @ ${v.timestampFormatted}`
                                  : 'Watch on YouTube'}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty state when no sponsors match filters or channel has no sponsors */
          <div className="p-12 text-center bg-[#070a12]/80 border border-slate-800 rounded-3xl text-slate-400 space-y-4 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-slate-500" />
            </div>
            <h4 className="text-xl font-bold text-white">
              {searchQuery
                ? 'No matching sponsor partnerships found'
                : 'No sponsor partnerships detected'}
            </h4>
            <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              {searchQuery
                ? `No sponsors matching "${searchQuery}" in this channel's analyzed uploads.`
                : `Across the ${videosAnalyzedCount} recent uploads analyzed for this channel, no sponsored integrations, commercial sponsor links, or sponsor disclosures were detected.`}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Clear Search Query
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
