import { NextResponse } from 'next/server';
import { parseYouTubeInput, analyzeSingleVideo, analyzeChannelPastSponsors } from '@/lib/sponsor-fetcher';
import { AnalysisRunHistory, VideoAnalysisResult, PastSponsor } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, mode: preferredMode, videoCount = 25 } = body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json({ error: 'Please provide a valid YouTube URL or Channel name.' }, { status: 400 });
    }

    const parsed = parseYouTubeInput(query);
    const effectiveMode = preferredMode || parsed.type;
    const countNum = Number(videoCount) || 25;
    const allowedCounts = [15, 25, 45, 70];
    const requestedCount = allowedCounts.includes(countNum) ? countNum : Math.min(Math.max(1, countNum), 75);

    if (effectiveMode === 'video' || parsed.type === 'video') {
      const videoResult = await analyzeSingleVideo(parsed.id);

      const sponsors: PastSponsor[] = videoResult.sponsors.map((seg, idx) => ({
        id: `sponsor_single_${idx}`,
        brandName: seg.sponsorName,
        domain: seg.sponsorName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        websiteUrl: `https://www.youtube.com/watch?v=${videoResult.videoId}&t=${seg.startTime}s`,
        videoCount: 1,
        percentageOfAnalyzed: 100,
        confidence: 'CONFIRMED',
        confidenceScore: 90,
        category: seg.category,
        discountCodes: [],
        detectionMethods: ['Direct Video Sponsor Segment'],
        evidenceSnippets: seg.descriptionSnippet ? [seg.descriptionSnippet] : [],
        videos: [
          {
            videoId: videoResult.videoId,
            title: videoResult.title,
            publishedAt: videoResult.publishedAt,
            thumbnailUrl: videoResult.thumbnailUrl,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoResult.videoId}`,
            timestampUrl: `https://www.youtube.com/watch?v=${videoResult.videoId}&t=${seg.startTime}s`,
            timestampFormatted: seg.startFormatted,
            hasTimestamp: true,
            evidenceSnippet: seg.descriptionSnippet,
            matchedLinks: []
          }
        ]
      }));

      const run: AnalysisRunHistory = {
        id: `run_video_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        query,
        mode: 'video',
        videoCountRequested: 1,
        analyzedVideosCount: 1,
        sponsoredVideosCount: videoResult.hasSponsor ? 1 : 0,
        topSponsorName: videoResult.primarySponsorName,
        totalSponsorTimeFormatted: videoResult.totalSponsorDurationSeconds > 0 
          ? `${Math.floor(videoResult.totalSponsorDurationSeconds / 60)} min ${videoResult.totalSponsorDurationSeconds % 60} sec` 
          : '0 sec',
        videos: [videoResult],
        sponsors,
        confirmedSponsorsCount: sponsors.length,
        sponsorsFoundCount: sponsors.length,
        dataSource: process.env.YOUTUBE_API_KEY ? 'YOUTUBE_API_V3' : 'WEB_FALLBACK'
      };

      return NextResponse.json({
        success: true,
        mode: 'video',
        run,
        video: videoResult,
        sponsors,
      });
    } else {
      const channelData = await analyzeChannelPastSponsors(parsed.id, requestedCount);

      // Strict backend verification: Reject any video not belonging to requested channel ID
      const verifiedVideos: VideoAnalysisResult[] = channelData.videos.filter(
        v => !v.channelId || v.channelId === channelData.channel.channelId
      );

      const sponsoredCount = verifiedVideos.filter(v => v.hasSponsor).length;
      const totalSponsorSeconds = verifiedVideos.reduce((acc, v) => acc + v.totalSponsorDurationSeconds, 0);
      const totalMins = Math.floor(totalSponsorSeconds / 60);
      const totalSecs = totalSponsorSeconds % 60;
      const totalSponsorTimeFormatted = totalSponsorSeconds > 0
        ? `${totalMins} min ${totalSecs} sec`
        : '0 sec';

      const run: AnalysisRunHistory = {
        id: `run_channel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        query,
        mode: 'channel',
        requestedChannelId: channelData.channel.channelId,
        videoCountRequested: channelData.videoCountRequested,
        analyzedVideosCount: verifiedVideos.length,
        sponsoredVideosCount: sponsoredCount,
        topSponsorName: channelData.topSponsorName,
        totalSponsorTimeFormatted,
        videos: verifiedVideos,
        channel: channelData.channel,
        sponsors: channelData.sponsors,
        confirmedSponsorsCount: channelData.confirmedSponsorsCount,
        sponsorsFoundCount: channelData.sponsorsFoundCount,
        notice: channelData.notice,
        dataSource: channelData.dataSource
      };

      return NextResponse.json({
        success: true,
        mode: 'channel',
        channel: channelData.channel,
        sponsors: channelData.sponsors,
        channelName: channelData.channel.channelTitle,
        channelHandle: channelData.channel.channelHandle,
        requestedChannelId: channelData.channel.channelId,
        run,
        videos: verifiedVideos,
        notice: channelData.notice,
        dataSource: channelData.dataSource
      });
    }
  } catch (error: any) {
    console.error('API /api/analyze error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while analyzing YouTube sponsor data.' },
      { status: 500 }
    );
  }
}
