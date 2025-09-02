import { TelegramUser } from './queries';

class UserCacheService {
  private static instance: UserCacheService;
  private index: Map<string, TelegramUser[]> = new Map();
  private streamCache: Map<string, TelegramUser[]> = new Map();
  private allUsers: TelegramUser[] = [];
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

    const searchTerm = query.toLowerCase();
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
      query: query.slice(0, 3) + '...',
      firstLetter,
      candidatesCount: candidates.length,
      resultsCount: results.length,
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
    initialized: boolean; 
    lastUpdate: Date | null 
  } {
    return {
      totalUsers: this.allUsers.length,
      indexSize: this.index.size,
      streamCacheSize: this.streamCache.size,
      streamStats: this.getStreamStats(),
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