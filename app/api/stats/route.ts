import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/queries';
import '@/lib/init'; // Initialize application services

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}