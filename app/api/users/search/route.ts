import { NextRequest, NextResponse } from 'next/server';
import UserCacheService from '@/lib/userCache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const stats = searchParams.get('stats'); // For debugging

    // Return cache stats if requested
    if (stats === 'true') {
      const cacheService = UserCacheService.getInstance();
      await cacheService.ensureInitialized();
      return NextResponse.json(cacheService.getStats());
    }

    if (!query || query.trim().length < 1) {
      return NextResponse.json([]);
    }

    const cacheService = UserCacheService.getInstance();
    
    // Ensure cache is initialized (lazy loading)
    await cacheService.ensureInitialized();
    
    // Perform instant cached search
    const users = cacheService.search(query.trim());
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}