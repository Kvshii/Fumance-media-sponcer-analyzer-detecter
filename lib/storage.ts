export interface SponsorSegment {
  id: string;
  sponsorName: string;
  category: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  startFormatted: string; // e.g. "01:45"
  endFormatted: string;   // e.g. "03:12"
  durationSeconds: number;
  durationFormatted: string; // e.g. "1 min 27 sec"
  percentOfVideo: number;    // e.g. 12.5
  descriptionSnippet?: string;
}

export interface VideoAnalysisResult {
  videoId: string;
  title: string;
  channelName: string;
  channelId?: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCountFormatted?: string;
  videoDurationSeconds: number;
  videoDurationFormatted: string;
  hasSponsor: boolean;
  sponsors: SponsorSegment[];
  totalSponsorDurationSeconds: number;
  totalSponsorPercent: number;
  primarySponsorName: string;
  analyzedAt: string;
  isFavorite?: boolean;
}

export interface PastSponsorVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  timestampUrl?: string;
  timestampFormatted?: string;
  hasTimestamp: boolean;
  evidenceSnippet?: string;
  matchedLinks: string[];
  discountCode?: string;
}

export interface PastSponsor {
  id: string;
  brandName: string;
  domain: string;
  websiteUrl: string;
  videoCount: number;
  percentageOfAnalyzed: number;
  confidence: 'CONFIRMED' | 'PROBABLE' | 'POTENTIAL';
  confidenceScore: number; // 0 - 100
  category: string;
  discountCodes: string[];
  detectionMethods: string[];
  evidenceSnippets: string[];
  videos: PastSponsorVideo[];
}

export interface ChannelInfo {
  channelId: string;
  channelTitle: string;
  channelHandle: string;
  channelAvatar: string;
  channelUrl: string;
  customUrl?: string;
}

export interface AnalysisRunHistory {
  id: string;
  timestamp: string;
  query: string;
  mode: 'channel' | 'video';
  requestedChannelId?: string;
  videoCountRequested: number;
  analyzedVideosCount: number;
  sponsoredVideosCount: number;
  topSponsorName: string;
  totalSponsorTimeFormatted: string;
  videos: VideoAnalysisResult[];
  channel?: ChannelInfo;
  sponsors?: PastSponsor[];
  confirmedSponsorsCount?: number;
  sponsorsFoundCount?: number;
  notice?: string;
  dataSource?: 'YOUTUBE_API_V3' | 'WEB_FALLBACK';
}

const STORAGE_KEYS = {
  HISTORY: 'fumance_analysis_history_v2',
  FAVORITES: 'fumance_favorite_videos',
};

const notifyChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fumance_storage_change'));
  }
};

export const getHistory = (): AnalysisRunHistory[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed: AnalysisRunHistory[] = JSON.parse(raw);
    
    // Fail-closed defensive filtering: ensure every video matches requested channelId if present
    const sanitized = parsed.map(run => {
      if (run.mode === 'channel' && run.requestedChannelId) {
        const validVideos = run.videos.filter(v => !v.channelId || v.channelId === run.requestedChannelId);
        return {
          ...run,
          videos: validVideos,
          analyzedVideosCount: validVideos.length,
          sponsoredVideosCount: validVideos.filter(v => v.hasSponsor).length,
        };
      }
      return run;
    });

    return sanitized;
  } catch (err) {
    console.error('Failed to parse history from localStorage', err);
    return [];
  }
};

export const saveAnalysisRun = (run: AnalysisRunHistory): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getHistory();
    // Prepend new run and keep last 50
    const updated = [run, ...current.filter(item => item.id !== run.id)];
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated.slice(0, 50)));
    notifyChange();
  } catch (err) {
    console.error('Failed to save analysis run', err);
  }
};

export const deleteHistoryItem = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getHistory();
    const updated = current.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    notifyChange();
  } catch (err) {
    console.error('Failed to delete history item', err);
  }
};

export const clearHistory = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    notifyChange();
  } catch (err) {
    console.error('Failed to clear history', err);
  }
};

export const getFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const toggleFavoriteVideo = (videoId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const currentFavs = getFavorites();
    const isFav = currentFavs.includes(videoId);
    let updated: string[];
    if (isFav) {
      updated = currentFavs.filter(id => id !== videoId);
    } else {
      updated = [...currentFavs, videoId];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    notifyChange();
    return !isFav;
  } catch (err) {
    console.error('Failed to toggle favorite', err);
    return false;
  }
};
