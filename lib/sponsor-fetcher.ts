import {
  VideoAnalysisResult,
  SponsorSegment,
  PastSponsorVideo,
  PastSponsor,
  ChannelInfo,
  AnalysisRunHistory
} from './storage';

export type { PastSponsorVideo, PastSponsor, ChannelInfo };

export interface ChannelAnalysisResponse {
  channel: ChannelInfo;
  videoCountRequested: number;
  videosAnalyzedCount: number;
  sponsorsFoundCount: number;
  confirmedSponsorsCount: number;
  topSponsorName: string;
  sponsors: PastSponsor[];
  videos: VideoAnalysisResult[];
  notice?: string;
  dataSource: 'YOUTUBE_API_V3' | 'WEB_FALLBACK';
}

export interface ParseInputResult {
  type: 'video' | 'channel';
  id: string; // videoID or channel identifier
  rawInput: string;
}

// In-memory cache to prevent redundant fetches and conserve API quota
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = {
  channel: new Map<string, CacheEntry<ChannelInfo>>(),
  videoList: new Map<string, CacheEntry<VideoAnalysisResult[]>>(),
  videoDetails: new Map<string, CacheEntry<VideoAnalysisResult>>(),
  sponsorBlock: new Map<string, CacheEntry<any[]>>(),
};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    map.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(map: Map<string, CacheEntry<T>>, key: string, data: T): void {
  map.set(key, { data, timestamp: Date.now() });
}

/**
 * Universal YouTube URL & Identifier Parser
 * Supports:
 * - youtube.com/@handle
 * - youtube.com/channel/CHANNEL_ID
 * - youtube.com/c/CHANNEL_NAME
 * - youtube.com/user/USERNAME
 * - youtu.be/VIDEO_ID
 * - youtube.com/watch?v=VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 */
export function parseYouTubeInput(input: string): ParseInputResult {
  const trimmed = input.trim();

  // 1. Direct single video URL patterns
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return { type: 'video', id: watchMatch[1], rawInput: trimmed };
  }

  // 2. Pure 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { type: 'video', id: trimmed, rawInput: trimmed };
  }

  // 3. Channel URL with standard UC channel ID
  const channelIdMatch = trimmed.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelIdMatch && channelIdMatch[1]) {
    return { type: 'channel', id: channelIdMatch[1], rawInput: trimmed };
  }

  // 4. Raw UC channel ID
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { type: 'channel', id: trimmed, rawInput: trimmed };
  }

  // 5. Channel URL with @handle
  const handleUrlMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleUrlMatch && handleUrlMatch[1]) {
    return { type: 'channel', id: `@${handleUrlMatch[1]}`, rawInput: trimmed };
  }

  // 6. Channel URL with /c/ or /user/
  const customUrlMatch = trimmed.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_.-]+)/);
  if (customUrlMatch && customUrlMatch[1]) {
    return { type: 'channel', id: customUrlMatch[1], rawInput: trimmed };
  }

  // 7. Direct @handle input
  if (trimmed.startsWith('@')) {
    return { type: 'channel', id: trimmed, rawInput: trimmed };
  }

  // 8. Fallback: treat clean string as handle or channel name
  const cleanHandle = trimmed.replace(/^https?:\/\/(www\.)?youtube\.com\//, '').replace(/^@/, '');
  return { type: 'channel', id: `@${cleanHandle}`, rawInput: trimmed };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins === 0) return `${secs} sec`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} sec`;
}

// Known sponsor dictionary for high-precision brand resolution & categorization
const KNOWN_SPONSORS: Record<string, { brandName: string; category: string; website: string }> = {
  'ridge.com': { brandName: 'Ridge', category: 'Lifestyle & Everyday Carry', website: 'https://ridge.com' },
  'dbrand.com': { brandName: 'dbrand', category: 'Tech Skins & Cases', website: 'https://dbrand.com' },
  'nordvpn.com': { brandName: 'NordVPN', category: 'Cybersecurity & Privacy', website: 'https://nordvpn.com' },
  'expressvpn.com': { brandName: 'ExpressVPN', category: 'Cybersecurity & Privacy', website: 'https://expressvpn.com' },
  'surfshark.com': { brandName: 'Surfshark', category: 'Cybersecurity & Privacy', website: 'https://surfshark.com' },
  'surfshark.deals': { brandName: 'Surfshark', category: 'Cybersecurity & Privacy', website: 'https://surfshark.com' },
  'squarespace.com': { brandName: 'Squarespace', category: 'Website Development', website: 'https://squarespace.com' },
  'skillshare.com': { brandName: 'Skillshare', category: 'Online Learning', website: 'https://skillshare.com' },
  'raycon.com': { brandName: 'Raycon', category: 'Consumer Audio', website: 'https://rayconglobal.com' },
  'buyraycon.com': { brandName: 'Raycon', category: 'Consumer Audio', website: 'https://rayconglobal.com' },
  'hellofresh.com': { brandName: 'HelloFresh', category: 'Meal Kits & Food', website: 'https://hellofresh.com' },
  'drinkag1.com': { brandName: 'AG1 (Athletic Greens)', category: 'Health & Nutrition', website: 'https://drinkag1.com' },
  'athleticgreens.com': { brandName: 'AG1 (Athletic Greens)', category: 'Health & Nutrition', website: 'https://drinkag1.com' },
  'manscaped.com': { brandName: 'Manscaped', category: 'Men’s Grooming', website: 'https://manscaped.com' },
  'seatgeek.com': { brandName: 'SeatGeek', category: 'Event Ticketing', website: 'https://seatgeek.com' },
  'audible.com': { brandName: 'Audible', category: 'Audiobooks & Media', website: 'https://audible.com' },
  'betterhelp.com': { brandName: 'BetterHelp', category: 'Mental Health & Therapy', website: 'https://betterhelp.com' },
  'factor75.com': { brandName: 'Factor Meals', category: 'Ready-to-Eat Food', website: 'https://factor75.com' },
  'factormeals.com': { brandName: 'Factor Meals', category: 'Ready-to-Eat Food', website: 'https://factor75.com' },
  'casetify.com': { brandName: 'CASETiFY', category: 'Tech Accessories & Cases', website: 'https://casetify.com' },
  'anker.com': { brandName: 'Anker', category: 'Consumer Electronics & Power', website: 'https://anker.com' },
  'babbel.com': { brandName: 'Babbel', category: 'Language Learning', website: 'https://babbel.com' },
  'grammarly.com': { brandName: 'Grammarly', category: 'Productivity Software', website: 'https://grammarly.com' },
  'airup.com': { brandName: 'Air Up', category: 'Beverage & Hydration', website: 'https://air-up.com' },
  'air-up.com': { brandName: 'Air Up', category: 'Beverage & Hydration', website: 'https://air-up.com' },
  'rocketmoney.com': { brandName: 'Rocket Money', category: 'Personal Finance & Budgeting', website: 'https://rocketmoney.com' },
  'joinhoney.com': { brandName: 'Honey (PayPal)', category: 'Shopping & Coupon Tools', website: 'https://joinhoney.com' },
  'hostinger.com': { brandName: 'Hostinger', category: 'Web Hosting & Domains', website: 'https://hostinger.com' },
  'shopify.com': { brandName: 'Shopify', category: 'E-Commerce Platform', website: 'https://shopify.com' },
  'incogni.com': { brandName: 'Incogni', category: 'Data Privacy & Broker Removal', website: 'https://incogni.com' },
  'establishedtitles.com': { brandName: 'Established Titles', category: 'Novelty & Gifts', website: 'https://establishedtitles.com' },
  'displate.com': { brandName: 'Displate', category: 'Metal Posters & Art', website: 'https://displate.com' },
  'cleanmycloud.com': { brandName: 'CleanMyCloud', category: 'Cloud Optimization', website: 'https://cleanmycloud.com' },
  'proton.me': { brandName: 'Proton', category: 'Privacy & Security Suite', website: 'https://proton.me' },
  '1password.com': { brandName: '1Password', category: 'Password & Security Manager', website: 'https://1password.com' },
  'dashlane.com': { brandName: 'Dashlane', category: 'Password & Security Manager', website: 'https://dashlane.com' },
  'squarespace.syuh.net': { brandName: 'Squarespace', category: 'Website Development', website: 'https://squarespace.com' },
  'hexclad.com': { brandName: 'HexClad', category: 'Cookware & Kitchen', website: 'https://hexclad.com' },
  'luminskin.com': { brandName: 'Lumin', category: 'Men’s Skincare', website: 'https://luminskin.com' },
  'keeps.com': { brandName: 'Keeps', category: 'Hair Loss Treatment', website: 'https://keeps.com' },
  'hims.com': { brandName: 'Hims', category: 'Personal Health & Care', website: 'https://forhims.com' },
  'forhims.com': { brandName: 'Hims', category: 'Personal Health & Care', website: 'https://forhims.com' },
  'bespokepost.com': { brandName: 'Bespoke Post', category: 'Subscription Box', website: 'https://bespokepost.com' },
  'magicspoon.com': { brandName: 'Magic Spoon', category: 'Food & Cereal', website: 'https://magicspoon.com' },
  'masterclass.com': { brandName: 'MasterClass', category: 'Online Education', website: 'https://masterclass.com' },
  'rakuten.com': { brandName: 'Rakuten', category: 'Cashback & Rewards', website: 'https://rakuten.com' },
  'simplisafe.com': { brandName: 'SimpliSafe', category: 'Home Security', website: 'https://simplisafe.com' },
  'liquidiv.com': { brandName: 'Liquid I.V.', category: 'Hydration & Nutrition', website: 'https://liquid-iv.com' },
  'tradecoffee.com': { brandName: 'Trade Coffee', category: 'Coffee & Subscription', website: 'https://drinktrade.com' },
};

// Non-sponsor domains that must be filtered out
const NON_SPONSOR_DOMAINS = new Set([
  'youtube.com', 'youtu.be', 'google.com', 'goo.gl', 'forms.gle', 'twitter.com', 'x.com',
  'instagram.com', 'facebook.com', 'tiktok.com', 'discord.gg', 'discord.com',
  'twitch.tv', 'patreon.com', 'spotify.com', 'open.spotify.com', 'apple.com', 'apple.co',
  'podcasts.apple.com', 'anchor.fm', 'wikipedia.org', 'wikimedia.org', 'creativecommons.org',
  'reddit.com', 'linkedin.com', 'threads.net', 'whatsapp.com', 't.me', 'telegram.me',
  'snapchat.com', 'pinterest.com', 'github.com', 'gitlab.com', 'unsplash.com', 'pexels.com',
  'soundstripe.com', 'paypal.me', 'buymeacoffee.com', 'ko-fi.com', 'threads.com', 'amazon.com',
]);

const GENERIC_AFFILIATE_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.ly', 'cutt.ly', 'rb.gy', 'linktr.ee', 'geni.us', 'amzn.to'
]);

const URL_REGEX = /https?:\/\/[^\s<>"'{}|\\^`[\]]+/gi;

/**
 * Clean URL and normalize domain
 */
export function normalizeUrl(rawUrl: string): { domain: string; cleanUrl: string; isGenericShortener: boolean } | null {
  try {
    const parsed = new URL(rawUrl);
    const domain = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Filter out standard non-sponsor platforms
    if (NON_SPONSOR_DOMAINS.has(domain)) {
      return null;
    }

    // Clean tracking query parameters
    const clean = new URL(rawUrl);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'twclid', 'msclkid', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi'
    ];
    trackingParams.forEach(p => clean.searchParams.delete(p));

    const isGenericShortener = GENERIC_AFFILIATE_DOMAINS.has(domain);
    return {
      domain,
      cleanUrl: clean.toString().replace(/\/$/, ''),
      isGenericShortener
    };
  } catch (e) {
    return null;
  }
}

/**
 * Dynamic Brand Name Formatter from Domain or String
 */
export function formatBrandFromDomain(domain: string): { brandName: string; category: string; website: string } {
  // 1. Direct dictionary match
  if (KNOWN_SPONSORS[domain]) {
    return KNOWN_SPONSORS[domain];
  }

  // 2. Subdomain check (e.g. shop.brand.com -> brand.com)
  const parts = domain.split('.');
  if (parts.length > 2) {
    const parentDomain = parts.slice(-2).join('.');
    if (KNOWN_SPONSORS[parentDomain]) {
      return KNOWN_SPONSORS[parentDomain];
    }
  }

  // 3. Fallback: clean domain string and capitalize
  const baseName = parts.length >= 2 ? parts[parts.length - 2] : domain;
  const cleanBase = baseName.replace(/[^a-zA-Z0-9]/g, '');
  const capitalized = cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1);

  return {
    brandName: capitalized,
    category: 'Commercial Partner',
    website: `https://${domain}`
  };
}

/**
 * Extracts balanced JSON string from HTML
 */
function extractBalancedJson(text: string, startIndex: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          return text.substring(startIndex, i + 1);
        }
      }
    }
  }
  return null;
}

/**
 * Resolves Channel Information from any URL or handle
 */
export async function resolveChannelInfo(input: string): Promise<ChannelInfo> {
  const cached = getCached(cache.channel, input);
  if (cached) return cached;

  const parsed = parseYouTubeInput(input);
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 1. If YouTube Data API Key is configured, attempt official API resolution
  if (apiKey) {
    try {
      let apiUrl = '';
      if (parsed.id.startsWith('UC') && parsed.id.length === 24) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${parsed.id}&key=${apiKey}`;
      } else if (parsed.id.startsWith('@')) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(parsed.id.replace(/^@/, ''))}&key=${apiKey}`;
      } else {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forUsername=${encodeURIComponent(parsed.id)}&key=${apiKey}`;
      }

      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          const info: ChannelInfo = {
            channelId: item.id,
            channelTitle: item.snippet.title,
            channelHandle: item.snippet.customUrl ? (item.snippet.customUrl.startsWith('@') ? item.snippet.customUrl : `@${item.snippet.customUrl}`) : parsed.id,
            channelAvatar: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            channelUrl: `https://www.youtube.com/channel/${item.id}`,
            customUrl: item.snippet.customUrl
          };
          setCache(cache.channel, input, info);
          return info;
        }
      }
    } catch (e) {
      console.warn('YouTube API v3 channel resolution failed, falling back to public page fetch', e);
    }
  }

  // 2. Public Web Ingestion Fallback
  const targetUrl = parsed.id.startsWith('UC') && parsed.id.length === 24
    ? `https://www.youtube.com/channel/${parsed.id}`
    : `https://www.youtube.com/${parsed.id.startsWith('@') ? parsed.id : `@${parsed.id}`}`;

  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Unable to find YouTube channel at "${targetUrl}" (HTTP ${res.status}). Please check the URL or handle.`);
  }

  const html = await res.text();
  const idMatch = html.match(/channel_id=([a-zA-Z0-9_-]{24})/) ||
                  html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) ||
                  html.match(/<meta itemprop="identifier" content="(UC[a-zA-Z0-9_-]{22})">/);

  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/) ||
                     html.match(/"title":"([^"]+)"/);

  const avatarMatch = html.match(/<meta property="og:image" content="([^"]+)">/) ||
                      html.match(/"avatar":{"thumbnails":\[{"url":"([^"]+)"/);

  if (!idMatch) {
    throw new Error(`Could not resolve channel ID for "${input}". Please verify the YouTube handle or URL.`);
  }

  const channelId = idMatch[1];
  const channelTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : parsed.id;
  const channelAvatar = avatarMatch ? avatarMatch[1] : `https://i.ytimg.com/vi/default/hqdefault.jpg`;

  const info: ChannelInfo = {
    channelId,
    channelTitle,
    channelHandle: parsed.id.startsWith('@') ? parsed.id : `@${channelTitle.replace(/\s+/g, '')}`,
    channelAvatar,
    channelUrl: `https://www.youtube.com/channel/${channelId}`,
  };

  setCache(cache.channel, input, info);
  return info;
}

/**
 * Fetch video watch page details (Description, Author, Channel ID, Captions)
 */
export async function fetchWatchPageDetails(videoId: string): Promise<{
  title: string;
  description: string;
  author: string;
  channelId: string;
  lengthSeconds: number;
  publishedAt: string;
  captionUrl?: string;
}> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Failed to load video ${videoId} (HTTP ${res.status})`);
  }

  const html = await res.text();
  let description = '';
  let channelId = '';
  let author = '';
  let title = '';
  let lengthSeconds = 600;
  let captionUrl: string | undefined = undefined;

  const marker = 'ytInitialPlayerResponse = ';
  const startIdx = html.indexOf(marker);
  if (startIdx !== -1) {
    const jsonStr = extractBalancedJson(html, startIdx + marker.length);
    if (jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        description = data.videoDetails?.shortDescription || '';
        channelId = data.videoDetails?.channelId || '';
        author = data.videoDetails?.author || '';
        title = data.videoDetails?.title || '';
        lengthSeconds = parseInt(data.videoDetails?.lengthSeconds, 10) || 600;
        const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (tracks && tracks.length > 0) {
          captionUrl = tracks[0].baseUrl;
        }
      } catch (e) {}
    }
  }

  // Fallbacks if playerResponse JSON failed
  if (!description) {
    const metaDesc = html.match(/<meta property="og:description" content="([\s\S]*?)">/);
    if (metaDesc) description = metaDesc[1];
  }
  if (!title) {
    const metaTitle = html.match(/<meta property="og:title" content="([^"]+)">/);
    if (metaTitle) title = metaTitle[1];
  }
  if (!channelId) {
    const metaCId = html.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/);
    if (metaCId) channelId = metaCId[1];
  }

  const dateMatch = html.match(/<meta itemprop="datePublished" content="([^"]+)">/);
  const publishedAt = dateMatch
    ? new Date(dateMatch[1]).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Recent';

  return {
    title: title || `YouTube Video (${videoId})`,
    description,
    author: author || 'YouTube Creator',
    channelId,
    lengthSeconds,
    publishedAt,
    captionUrl
  };
}

/**
 * Fetch SponsorBlock segments for a video
 */
export async function fetchSponsorBlockSegments(videoId: string): Promise<any[]> {
  const cached = getCached(cache.sponsorBlock, videoId);
  if (cached) return cached;

  try {
    const res = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["sponsor"]`, {
      headers: { 'User-Agent': 'FumanceMediaSponsorDetector/2.0' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      setCache(cache.sponsorBlock, videoId, data);
      return data;
    }
    if (res.status === 404) {
      setCache(cache.sponsorBlock, videoId, []);
      return [];
    }
  } catch (e) {}
  return [];
}

/**
 * Sponsor disclosures & promo patterns
 */
const SPONSOR_DISCLOSURE_PATTERNS = [
  /sponsored by\s+([A-Za-z0-9\s&'-]{2,25})/i,
  /thanks to\s+([A-Za-z0-9\s&'-]{2,25})\s+for sponsoring/i,
  /thank you to\s+([A-Za-z0-9\s&'-]{2,25})\s+for sponsoring/i,
  /brought to you by\s+([A-Za-z0-9\s&'-]{2,25})/i,
  /paid partnership with\s+([A-Za-z0-9\s&'-]{2,25})/i,
  /partnered with\s+([A-Za-z0-9\s&'-]{2,25})/i,
];

const DISCOUNT_CODE_PATTERNS = [
  /(?:use code|code:?|promo code:?|coupon code:?|discount code:?)\s+([A-Z0-9_-]{3,15})/i,
  /code\s+"([A-Z0-9_-]{3,15})"/i,
  /use\s+([A-Z0-9_-]{3,15})\s+for\s+\d+%\s+off/i,
];

/**
 * Core Brand & Sponsor Discovery for a single video
 */
export interface DetectedVideoSponsor {
  brandName: string;
  domain: string;
  websiteUrl: string;
  category: string;
  confidence: 'CONFIRMED' | 'PROBABLE' | 'POTENTIAL';
  confidenceScore: number;
  discountCode?: string;
  detectionMethods: string[];
  evidenceSnippet: string;
  matchedUrl: string;
  timestampSeconds?: number;
  timestampFormatted?: string;
}

export function detectSponsorsFromDescription(
  description: string,
  channelHandle: string,
  sponsorBlockSegments: any[] = []
): DetectedVideoSponsor[] {
  if (!description || typeof description !== 'string') return [];

  const rawUrls = description.match(URL_REGEX) || [];
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  const detected: DetectedVideoSponsor[] = [];
  const seenDomains = new Set<string>();

  // Extract global discount code from description if available
  let descriptionDiscountCode: string | undefined = undefined;
  for (const pattern of DISCOUNT_CODE_PATTERNS) {
    const codeMatch = description.match(pattern);
    if (codeMatch && codeMatch[1]) {
      const code = codeMatch[1].trim().toUpperCase();
      if (!['THE', 'OUR', 'AND', 'FOR', 'GET', 'NEW', 'NOW', 'CODE'].includes(code)) {
        descriptionDiscountCode = code;
        break;
      }
    }
  }

  for (const rawUrl of rawUrls) {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) continue;

    const { domain, cleanUrl } = normalized;

    // Filter out channel's own name or handle in domain
    const cleanHandle = channelHandle.replace(/^@/, '').toLowerCase();
    if (domain.includes(cleanHandle) || (cleanHandle.length > 3 && domain.includes(cleanHandle.slice(0, -1)))) {
      continue;
    }

    if (seenDomains.has(domain)) continue;
    seenDomains.add(domain);

    const brandInfo = formatBrandFromDomain(domain);
    const detectionMethods: string[] = [];
    let confidenceScore = 40; // baseline for valid commercial external link

    // Find the line or paragraph containing this URL
    const matchingLine = lines.find(l => l.includes(rawUrl)) || '';
    let evidenceSnippet = matchingLine;

    // 1. Check for explicit sponsorship disclosures
    let hasExplicitDisclosure = false;
    for (const pattern of SPONSOR_DISCLOSURE_PATTERNS) {
      if (pattern.test(description) || (matchingLine && pattern.test(matchingLine))) {
        hasExplicitDisclosure = true;
        detectionMethods.push('Sponsorship disclosure in description');
        confidenceScore += 40;
        break;
      }
    }

    // 2. Check for discount / promo code associated with this link
    let promoCode = descriptionDiscountCode;
    for (const pattern of DISCOUNT_CODE_PATTERNS) {
      const lineCodeMatch = matchingLine.match(pattern);
      if (lineCodeMatch && lineCodeMatch[1]) {
        promoCode = lineCodeMatch[1].trim().toUpperCase();
        break;
      }
    }

    if (promoCode) {
      detectionMethods.push(`Discount / promo code detected ("${promoCode}")`);
      confidenceScore += 25;
    }

    // 3. Check for affiliate / partner URL path indicators
    const pathLower = cleanUrl.toLowerCase();
    if (
      pathLower.includes(`/${cleanHandle}`) ||
      pathLower.includes('discount') ||
      pathLower.includes('promo') ||
      pathLower.includes('deal') ||
      pathLower.includes('partner') ||
      pathLower.includes('save')
    ) {
      detectionMethods.push('Affiliate / creator referral URL path');
      confidenceScore += 20;
    }

    // 4. Check SponsorBlock segment
    let timestampSeconds: number | undefined = undefined;
    let timestampFormatted: string | undefined = undefined;
    if (sponsorBlockSegments.length > 0) {
      timestampSeconds = Math.floor(sponsorBlockSegments[0].segment[0]);
      timestampFormatted = formatTime(timestampSeconds);
      detectionMethods.push(`Verified sponsor timestamp at ${timestampFormatted}`);
      confidenceScore += 30;
    }

    // Determine classification
    let confidence: 'CONFIRMED' | 'PROBABLE' | 'POTENTIAL' = 'POTENTIAL';
    if (confidenceScore >= 75 || hasExplicitDisclosure || (promoCode && sponsorBlockSegments.length > 0)) {
      confidence = 'CONFIRMED';
    } else if (confidenceScore >= 50 || promoCode) {
      confidence = 'PROBABLE';
    }

    detected.push({
      brandName: brandInfo.brandName,
      domain,
      websiteUrl: cleanUrl,
      category: brandInfo.category,
      confidence,
      confidenceScore: Math.min(100, confidenceScore),
      discountCode: promoCode,
      detectionMethods,
      evidenceSnippet: evidenceSnippet || `Commercial link found: ${cleanUrl}`,
      matchedUrl: cleanUrl,
      timestampSeconds,
      timestampFormatted
    });
  }

  return detected;
}

/**
 * Analyze a single YouTube video
 */
export async function analyzeSingleVideo(videoId: string): Promise<VideoAnalysisResult> {
  const watch = await fetchWatchPageDetails(videoId);
  const sbSegments = await fetchSponsorBlockSegments(videoId);
  const detectedSponsors = detectSponsorsFromDescription(watch.description, watch.author, sbSegments);

  const sponsorSegments: SponsorSegment[] = [];
  sbSegments.forEach((seg, idx) => {
    const start = Math.floor(seg.segment[0]);
    const end = Math.floor(seg.segment[1]);
    const duration = Math.max(1, end - start);
    const percent = parseFloat(((duration / watch.lengthSeconds) * 100).toFixed(1));
    const matchedBrand = detectedSponsors.length > 0 ? detectedSponsors[0].brandName : 'Sponsor';

    sponsorSegments.push({
      id: seg.UUID || `seg_${idx}_${videoId}`,
      sponsorName: matchedBrand,
      category: detectedSponsors.length > 0 ? detectedSponsors[0].category : 'Brand Partner',
      startTime: start,
      endTime: end,
      startFormatted: formatTime(start),
      endFormatted: formatTime(end),
      durationSeconds: duration,
      durationFormatted: formatDurationSeconds(duration),
      percentOfVideo: percent,
      descriptionSnippet: `Sponsor segment verified at ${formatTime(start)} - ${formatTime(end)}.`
    });
  });

  const totalSponsorDuration = sponsorSegments.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const totalSponsorPercent = parseFloat(((totalSponsorDuration / watch.lengthSeconds) * 100).toFixed(1));

  return {
    videoId,
    title: watch.title,
    channelName: watch.author,
    channelId: watch.channelId,
    publishedAt: watch.publishedAt,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    viewCountFormatted: 'Verified View',
    videoDurationSeconds: watch.lengthSeconds,
    videoDurationFormatted: formatDurationSeconds(watch.lengthSeconds),
    hasSponsor: detectedSponsors.length > 0 || sponsorSegments.length > 0,
    sponsors: sponsorSegments,
    totalSponsorDurationSeconds: totalSponsorDuration,
    totalSponsorPercent,
    primarySponsorName: detectedSponsors.length > 0 ? detectedSponsors[0].brandName : (sponsorSegments.length > 0 ? sponsorSegments[0].sponsorName : 'None Detected'),
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Fetch channel video IDs (up to requested count: 15, 25, 45, or 70)
 */
export async function getChannelVideoList(channelInfo: ChannelInfo, limit: number): Promise<string[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 1. YouTube Data API v3 if API key is provided
  if (apiKey) {
    try {
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelInfo.channelId}&key=${apiKey}`);
      if (channelRes.ok) {
        const cData = await channelRes.json();
        const uploadsPlaylistId = cData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (uploadsPlaylistId) {
          const videoIds: string[] = [];
          let nextPageToken = '';
          while (videoIds.length < limit) {
            const pageSize = Math.min(50, limit - videoIds.length);
            const pUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${pageSize}&pageToken=${nextPageToken}&key=${apiKey}`;
            const pRes = await fetch(pUrl);
            if (!pRes.ok) break;
            const pData = await pRes.json();
            const items = pData.items || [];
            for (const it of items) {
              const vId = it.contentDetails?.videoId;
              if (vId && !videoIds.includes(vId)) {
                videoIds.push(vId);
              }
            }
            nextPageToken = pData.nextPageToken || '';
            if (!nextPageToken || items.length === 0) break;
          }
          if (videoIds.length > 0) {
            return videoIds.slice(0, limit);
          }
        }
      }
    } catch (e) {
      console.warn('YouTube API v3 playlist fetch error:', e);
    }
  }

  // 2. Public Web Ingestion Fallback
  const videosUrl = `https://www.youtube.com/channel/${channelInfo.channelId}/videos`;
  const res = await fetch(videosUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Failed to load channel videos page (HTTP ${res.status})`);
  }

  const html = await res.text();
  const rawMatches = Array.from(html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)).map(m => m[1]);
  const uniqueIds = [...new Set(rawMatches)];

  return uniqueIds.slice(0, limit);
}

/**
 * Main Full Channel Sponsors Detector Pipeline (HotSlicer-Style)
 */
export async function analyzeChannelPastSponsors(
  channelInput: string,
  videoLimit: number = 25
): Promise<ChannelAnalysisResponse> {
  const channelInfo = await resolveChannelInfo(channelInput);
  const allowedLimits = [15, 25, 45, 70];
  const targetCount = allowedLimits.includes(videoLimit) ? videoLimit : 25;

  const videoIds = await getChannelVideoList(channelInfo, targetCount);

  if (videoIds.length === 0) {
    return {
      channel: channelInfo,
      videoCountRequested: targetCount,
      videosAnalyzedCount: 0,
      sponsorsFoundCount: 0,
      confirmedSponsorsCount: 0,
      topSponsorName: 'None',
      sponsors: [],
      videos: [],
      notice: 'No videos found on this channel.',
      dataSource: process.env.YOUTUBE_API_KEY ? 'YOUTUBE_API_V3' : 'WEB_FALLBACK'
    };
  }

  // Fetch and analyze each video with strict channel ownership validation
  const analyzedVideos: VideoAnalysisResult[] = [];
  const brandGroupMap: Map<string, PastSponsor> = new Map();

  // Process in batches of 5 to avoid overloading
  const batchSize = 5;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (vId) => {
        try {
          const watch = await fetchWatchPageDetails(vId);

          // STRICT FAIL-CLOSED CHANNEL OWNERSHIP VALIDATION
          if (watch.channelId && watch.channelId !== channelInfo.channelId) {
            console.warn(`[FAIL-CLOSED REJECT] Video ${vId} belongs to ${watch.channelId}, not ${channelInfo.channelId}`);
            return;
          }

          const sbSegments = await fetchSponsorBlockSegments(vId);
          const detectedSponsors = detectSponsorsFromDescription(watch.description, channelInfo.channelHandle, sbSegments);

          const sponsorSegments: SponsorSegment[] = [];
          sbSegments.forEach((seg, idx) => {
            const start = Math.floor(seg.segment[0]);
            const end = Math.floor(seg.segment[1]);
            const duration = Math.max(1, end - start);
            const percent = parseFloat(((duration / watch.lengthSeconds) * 100).toFixed(1));
            const brand = detectedSponsors.length > 0 ? detectedSponsors[0].brandName : 'Verified Sponsor';

            sponsorSegments.push({
              id: seg.UUID || `seg_${idx}_${vId}`,
              sponsorName: brand,
              category: detectedSponsors.length > 0 ? detectedSponsors[0].category : 'Brand Partner',
              startTime: start,
              endTime: end,
              startFormatted: formatTime(start),
              endFormatted: formatTime(end),
              durationSeconds: duration,
              durationFormatted: formatDurationSeconds(duration),
              percentOfVideo: percent,
              descriptionSnippet: `Verified sponsor segment at ${formatTime(start)}.`
            });
          });

          const totalSponsorDuration = sponsorSegments.reduce((acc, curr) => acc + curr.durationSeconds, 0);
          const totalSponsorPercent = parseFloat(((totalSponsorDuration / watch.lengthSeconds) * 100).toFixed(1));

          const videoResult: VideoAnalysisResult = {
            videoId: vId,
            title: watch.title,
            channelName: channelInfo.channelTitle,
            channelId: channelInfo.channelId,
            publishedAt: watch.publishedAt,
            thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            viewCountFormatted: 'Verified View',
            videoDurationSeconds: watch.lengthSeconds,
            videoDurationFormatted: formatDurationSeconds(watch.lengthSeconds),
            hasSponsor: detectedSponsors.length > 0 || sponsorSegments.length > 0,
            sponsors: sponsorSegments,
            totalSponsorDurationSeconds: totalSponsorDuration,
            totalSponsorPercent,
            primarySponsorName: detectedSponsors.length > 0 ? detectedSponsors[0].brandName : (sponsorSegments.length > 0 ? sponsorSegments[0].sponsorName : 'None Detected'),
            analyzedAt: new Date().toISOString()
          };

          analyzedVideos.push(videoResult);

          // Group into HotSlicer PastSponsors
          for (const sp of detectedSponsors) {
            const key = sp.domain.toLowerCase();
            const existing = brandGroupMap.get(key);

            const videoEntry: PastSponsorVideo = {
              videoId: vId,
              title: watch.title,
              publishedAt: watch.publishedAt,
              thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
              youtubeUrl: `https://www.youtube.com/watch?v=${vId}`,
              timestampUrl: sp.timestampSeconds ? `https://www.youtube.com/watch?v=${vId}&t=${sp.timestampSeconds}s` : undefined,
              timestampFormatted: sp.timestampFormatted,
              hasTimestamp: !!sp.timestampSeconds,
              evidenceSnippet: sp.evidenceSnippet,
              matchedLinks: [sp.matchedUrl],
              discountCode: sp.discountCode
            };

            if (existing) {
              existing.videoCount += 1;
              if (sp.discountCode && !existing.discountCodes.includes(sp.discountCode)) {
                existing.discountCodes.push(sp.discountCode);
              }
              for (const m of sp.detectionMethods) {
                if (!existing.detectionMethods.includes(m)) existing.detectionMethods.push(m);
              }
              if (sp.evidenceSnippet && !existing.evidenceSnippets.includes(sp.evidenceSnippet)) {
                existing.evidenceSnippets.push(sp.evidenceSnippet);
              }
              // Upgrade confidence if repeated or confirmed
              if (sp.confidence === 'CONFIRMED' || existing.videoCount >= 2) {
                existing.confidence = 'CONFIRMED';
                existing.confidenceScore = Math.max(existing.confidenceScore, 85);
              }
              existing.videos.push(videoEntry);
            } else {
              brandGroupMap.set(key, {
                id: `sponsor_${key}`,
                brandName: sp.brandName,
                domain: sp.domain,
                websiteUrl: sp.websiteUrl,
                videoCount: 1,
                percentageOfAnalyzed: 0,
                confidence: sp.confidence,
                confidenceScore: sp.confidenceScore,
                category: sp.category,
                discountCodes: sp.discountCode ? [sp.discountCode] : [],
                detectionMethods: [...sp.detectionMethods],
                evidenceSnippets: sp.evidenceSnippet ? [sp.evidenceSnippet] : [],
                videos: [videoEntry]
              });
            }
          }
        } catch (err) {
          console.warn(`Failed to analyze video ${vId}`, err);
        }
      })
    );
  }

  // Calculate final percentage and sort sponsors by frequency and confidence
  const totalAnalyzed = analyzedVideos.length;
  const sponsorsList = Array.from(brandGroupMap.values()).map(sp => ({
    ...sp,
    percentageOfAnalyzed: totalAnalyzed > 0 ? parseFloat(((sp.videoCount / totalAnalyzed) * 100).toFixed(1)) : 0
  }));

  sponsorsList.sort((a, b) => {
    if (b.confidenceScore !== a.confidenceScore) return b.confidenceScore - a.confidenceScore;
    return b.videoCount - a.videoCount;
  });

  const confirmedCount = sponsorsList.filter(s => s.confidence === 'CONFIRMED').length;
  const topSponsorName = sponsorsList.length > 0 ? sponsorsList[0].brandName : 'None';

  let notice = undefined;
  if (!process.env.YOUTUBE_API_KEY && targetCount > totalAnalyzed) {
    notice = `Analyzed ${totalAnalyzed} recent videos available via public ingestion. For full pagination up to 70 videos, configure YOUTUBE_API_KEY in .env.local.`;
  }

  return {
    channel: channelInfo,
    videoCountRequested: targetCount,
    videosAnalyzedCount: totalAnalyzed,
    sponsorsFoundCount: sponsorsList.length,
    confirmedSponsorsCount: confirmedCount,
    topSponsorName,
    sponsors: sponsorsList,
    videos: analyzedVideos,
    notice,
    dataSource: process.env.YOUTUBE_API_KEY ? 'YOUTUBE_API_V3' : 'WEB_FALLBACK'
  };
}

// Backwards compatibility re-exports
export const fetchVideoSponsors = analyzeSingleVideo;
export async function fetchChannelSponsors(channelInput: string, videoCount: number = 25) {
  const result = await analyzeChannelPastSponsors(channelInput, videoCount);
  return {
    channelName: result.channel.channelTitle,
    channelHandle: result.channel.channelHandle,
    requestedChannelId: result.channel.channelId,
    videoResults: result.videos,
    topSponsorName: result.topSponsorName,
    totalSponsoredVideos: result.videos.filter(v => v.hasSponsor).length,
    totalSponsorTimeSeconds: result.videos.reduce((acc, v) => acc + v.totalSponsorDurationSeconds, 0),
    totalSponsorTimeFormatted: formatDurationSeconds(result.videos.reduce((acc, v) => acc + v.totalSponsorDurationSeconds, 0)),
  };
}
