import { NextResponse } from 'next/server';
import { getTopEvents, getDailyStats } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const days = searchParams.get('days');

  try {
    if (type === 'daily') {
      const dailyStats = await getDailyStats(days ? parseInt(days) : 30);
      return NextResponse.json(dailyStats);
    } else {
      const topEvents = await getTopEvents(10);
      return NextResponse.json(topEvents);
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}