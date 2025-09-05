import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || undefined;
    const stream = searchParams.get('stream') || undefined;
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;

    const offset = (page - 1) * limit;

    const result = await getUsers(limit, offset, search, stream, status);

    return NextResponse.json({
      success: true,
      users: result.users,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users' 
      }, 
      { status: 500 }
    );
  }
}