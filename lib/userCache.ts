import { TelegramUser } from './queries';

class UserCacheService {
  private static instance: UserCacheService;
  private index: Map<string, TelegramUser[]> = new Map();
  private streamCache: Map<string, TelegramUser[]> = new Map();
  private allUsers: TelegramUser[] = [];
  private nonCourseUsers: TelegramUser[] = [];
  private hackathonUsers: TelegramUser[] = [];
  private initialized = false;
  private lastUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RESULTS = 50;
  private readonly VALID_STREAMS = ['3rd_stream', '4th_stream', '5th_stream'];

  private constructor() {}

  static getInstance(): UserCacheService {
    if (!UserCacheService.instance) {
      UserCacheService.instance = new UserCacheService();
    }
    return UserCacheService.instance;
  }

  async ensureInitialized(): Promise<void> {
    const now = Date.now();

    if (!this.initialized || (now - this.lastUpdate) > this.CACHE_TTL) {
      await this.loadUsers();
      await this.loadUsersByStreams();
      await this.loadNonCourseUsers();
      await this.loadHackathonUsers();
      this.buildIndex();
      this.initialized = true;
      this.lastUpdate = now;
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      // Import getAllUsers function dynamically to avoid circular dependency
      const { getAllUsers } = await import('./queries');
      this.allUsers = await getAllUsers();
      console.log(`User cache loaded: ${this.allUsers.length} users`);
    } catch (error) {
      console.error('Failed to load users for cache:', error);
      this.allUsers = [];
    }
  }

  private async loadUsersByStreams(): Promise<void> {
    try {
      // Import getUsersByStream function dynamically to avoid circular dependency
      const { getUsersByStream } = await import('./queries');

      this.streamCache.clear();

      // Load users for each valid stream
      for (const stream of this.VALID_STREAMS) {
        const users = await getUsersByStream(stream);
        this.streamCache.set(stream, users);
        console.log(`Stream cache loaded for ${stream}: ${users.length} users`);
      }
    } catch (error) {
      console.error('Failed to load users by streams for cache:', error);
      this.streamCache.clear();
    }
  }

  private async loadNonCourseUsers(): Promise<void> {
    try {
      // Import getUsersExceptCourseAttendees function dynamically to avoid circular dependency
      const { getUsersExceptCourseAttendees } = await import('./queries');
      this.nonCourseUsers = await getUsersExceptCourseAttendees();
      console.log(`Non-course users cache loaded: ${this.nonCourseUsers.length} users`);
    } catch (error) {
      console.error('Failed to load non-course users for cache:', error);
      this.nonCourseUsers = [];
    }
  }

  private async loadHackathonUsers(): Promise<void> {
    try {
      // Import getHackathonUsers function dynamically to avoid circular dependency
      const { getHackathonUsers } = await import('./queries');
      this.hackathonUsers = await getHackathonUsers();
      console.log(`Hackathon users cache loaded: ${this.hackathonUsers.length} users`);
    } catch (error) {
      console.error('Failed to load hackathon users for cache:', error);
      this.hackathonUsers = [];
    }
  }

  private buildIndex(): void {
    this.index.clear();

    this.allUsers.forEach(user => {
      // Index by username
      if (user.username) {
        const firstLetter = user.username.toLowerCase()[0];
        this.addToIndex(firstLetter, user);
      }

      // Index by first_name
      if (user.first_name) {
        const firstLetter = user.first_name.toLowerCase()[0];
        this.addToIndex(firstLetter, user);
      }
    });

    console.log(`User index built: ${this.index.size} letter buckets`);
    console.log('📋 Sample users with letter "s":',
      (this.index.get('s') || []).slice(0, 5).map(u => ({
        username: u.username,
        first_name: u.first_name,
        user_id: u.user_id
      }))
    );
  }

  private addToIndex(letter: string, user: TelegramUser): void {
    if (!this.index.has(letter)) {
      this.index.set(letter, []);
    }
    
    const bucket = this.index.get(letter)!;
    
    // Avoid duplicates (user might appear in both username and first_name buckets)
    if (!bucket.some(existing => existing.user_id === user.user_id)) {
      bucket.push(user);
    }
  }

  search(query: string): TelegramUser[] {
    if (!query || query.length === 0) {
      return [];
    }

    // Remove @ prefix if present
    const cleanQuery = query.toLowerCase().replace(/^@/, '');
    const searchTerm = cleanQuery;
    const firstLetter = searchTerm[0];

    // Get candidates from index
    const candidates = this.index.get(firstLetter) || [];

    // Filter by full query and return limited results
    const results = candidates
      .filter(user => {
        const username = user.username?.toLowerCase() || '';
        const firstName = user.first_name?.toLowerCase() || '';

        return username.startsWith(searchTerm) || firstName.startsWith(searchTerm);
      })
      .slice(0, this.MAX_RESULTS);

    console.log('🔍 UserCache search executed:', {
      originalQuery: query,
      cleanQuery,
      firstLetter,
      candidatesCount: candidates.length,
      candidates: candidates.slice(0, 3).map(u => ({ username: u.username, firstName: u.first_name })),
      resultsCount: results.length,
      results: results.map(u => ({ username: u.username, firstName: u.first_name })),
      cacheAge: Date.now() - this.lastUpdate,
      timestamp: new Date().toISOString()
    });

    return results;
  }

  // Get users by course stream
  getUsersByStream(stream: string): TelegramUser[] {
    if (!this.VALID_STREAMS.includes(stream)) {
      console.warn(`Invalid stream requested: ${stream}`);
      return [];
    }

    const users = this.streamCache.get(stream) || [];
    
    console.log('📊 UserCache stream lookup:', {
      stream,
      usersCount: users.length,
      cacheAge: Date.now() - this.lastUpdate,
      timestamp: new Date().toISOString()
    });

    return users;
  }

  // Get users who haven't paid for courses
  getUsersExceptCourseAttendees(): TelegramUser[] {
    console.log('📊 UserCache non-course users lookup:', {
      usersCount: this.nonCourseUsers.length,
      cacheAge: Date.now() - this.lastUpdate,
      timestamp: new Date().toISOString()
    });

    return this.nonCourseUsers;
  }

  // Get hackathon participants
  getHackathonUsers(): TelegramUser[] {
    console.log('📊 UserCache hackathon users lookup:', {
      usersCount: this.hackathonUsers.length,
      cacheAge: Date.now() - this.lastUpdate,
      timestamp: new Date().toISOString()
    });

    return this.hackathonUsers;
  }

  // Get stream statistics
  getStreamStats(): { [stream: string]: number } {
    const stats: { [stream: string]: number } = {};

    for (const stream of this.VALID_STREAMS) {
      stats[stream] = this.streamCache.get(stream)?.length || 0;
    }

    return stats;
  }

  getStats(): {
    totalUsers: number;
    indexSize: number;
    streamCacheSize: number;
    streamStats: { [stream: string]: number };
    nonCourseUsers: number;
    hackathonUsers: number;
    initialized: boolean;
    lastUpdate: Date | null
  } {
    return {
      totalUsers: this.allUsers.length,
      indexSize: this.index.size,
      streamCacheSize: this.streamCache.size,
      streamStats: this.getStreamStats(),
      nonCourseUsers: this.nonCourseUsers.length,
      hackathonUsers: this.hackathonUsers.length,
      initialized: this.initialized,
      lastUpdate: this.lastUpdate ? new Date(this.lastUpdate) : null
    };
  }

  // Force refresh for testing/admin purposes
  async forceRefresh(): Promise<void> {
    this.initialized = false;
    this.lastUpdate = 0;
    await this.ensureInitialized();
  }
}

export default UserCacheService;