import { NextResponse } from 'next/server';
import { getUserGrowthData } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days');

  try {
    const userGrowthData = await getUserGrowthData(days ? parseInt(days) : 30);
    return NextResponse.json(userGrowthData);
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user growth data' },
      { status: 500 }
    );
  }
}