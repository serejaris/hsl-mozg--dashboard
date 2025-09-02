import { TelegramUser } from './queries';

class UserCacheService {
  private static instance: UserCacheService;
  private index: Map<string, TelegramUser[]> = new Map();
  private allUsers: TelegramUser[] = [];
  private initialized = false;
  private lastUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RESULTS = 50;

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

  getStats(): { 
    totalUsers: number; 
    indexSize: number; 
    initialized: boolean; 
    lastUpdate: Date | null 
  } {
    return {
      totalUsers: this.allUsers.length,
      indexSize: this.index.size,
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