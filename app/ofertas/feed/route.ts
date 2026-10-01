import { NextRequest, NextResponse } from 'next/server';
import { listPublishedOffers } from '@/lib/offers';
import { buildOffersFeed, FEED_CHANNELS, type FeedChannel } from '@/lib/offers-feed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const channel = req.nextUrl.searchParams.get('channel') || 'pinterest';
  if (!FEED_CHANNELS.includes(channel as FeedChannel)) {
    return new NextResponse('Canal inválido', { status: 400 });
  }
  try {
    const offers = await listPublishedOffers();
    return new NextResponse(buildOffersFeed(offers, channel as FeedChannel), {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Feed temporariamente indisponível', {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
