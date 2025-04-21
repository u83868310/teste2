import { 
  users, type User, type InsertUser, 
  media, type Media, type InsertMedia,
  categories, type Category, type InsertCategory,
  episodes, type Episode, type InsertEpisode,
  favorites, type Favorite, type InsertFavorite,
  ContentType
} from "./schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Media operations
  getAllMedia(): Promise<Media[]>;
  getMediaById(id: number): Promise<Media | undefined>;
  getMediaByType(type: ContentType): Promise<Media[]>;
  getFeaturedMedia(): Promise<Media[]>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: number, media: Partial<InsertMedia>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getMediaByCategory(category: string): Promise<Media[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Episode operations
  getEpisodesByMediaId(mediaId: number): Promise<Episode[]>;
  getEpisodeById(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  
  // Favorite operations
  getUserFavorites(userId: number): Promise<Media[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, mediaId: number): Promise<boolean>;
  isFavorite(userId: number, mediaId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private media: Map<number, Media>;
  private categories: Map<number, Category>;
  private episodes: Map<number, Episode>;
  private favorites: Map<number, Favorite>;
  
  private userCurrentId: number;
  private mediaCurrentId: number;
  private categoryCurrentId: number;
  private episodeCurrentId: number;
  private favoriteCurrentId: number;

  constructor() {
    this.users = new Map();
    this.media = new Map();
    this.categories = new Map();
    this.episodes = new Map();
    this.favorites = new Map();
    
    this.userCurrentId = 1;
    this.mediaCurrentId = 1;
    this.categoryCurrentId = 1;
    this.episodeCurrentId = 1;
    this.favoriteCurrentId = 1;
    
    // Initialize with default categories
    this.initializeDefaultCategories();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Media operations
  async getAllMedia(): Promise<Media[]> {
    return Array.from(this.media.values());
  }
  
  async getMediaById(id: number): Promise<Media | undefined> {
    return this.media.get(id);
  }
  
  async getMediaByType(type: ContentType): Promise<Media[]> {
    return Array.from(this.media.values()).filter(item => item.type === type);
  }
  
  async getFeaturedMedia(): Promise<Media[]> {
    return Array.from(this.media.values()).filter(item => item.isFeatured);
  }
  
  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = this.mediaCurrentId++;
    const newMedia: Media = { ...insertMedia, id };
    this.media.set(id, newMedia);
    return newMedia;
  }
  
  async updateMedia(id: number, updateData: Partial<InsertMedia>): Promise<Media | undefined> {
    const currentMedia = this.media.get(id);
    if (!currentMedia) return undefined;
    
    const updatedMedia = { ...currentMedia, ...updateData };
    this.media.set(id, updatedMedia);
    return updatedMedia;
  }
  
  async deleteMedia(id: number): Promise<boolean> {
    return this.media.delete(id);
  }
  
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getMediaByCategory(category: string): Promise<Media[]> {
    return Array.from(this.media.values()).filter(item => item.category === category);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Episode operations
  async getEpisodesByMediaId(mediaId: number): Promise<Episode[]> {
    return Array.from(this.episodes.values())
      .filter(episode => episode.mediaId === mediaId)
      .sort((a, b) => {
        if (a.seasonNumber !== b.seasonNumber) {
          return a.seasonNumber - b.seasonNumber;
        }
        return a.episodeNumber - b.episodeNumber;
      });
  }
  
  async getEpisodeById(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }
  
  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const id = this.episodeCurrentId++;
    const episode: Episode = { ...insertEpisode, id };
    this.episodes.set(id, episode);
    return episode;
  }
  
  // Favorite operations
  async getUserFavorites(userId: number): Promise<Media[]> {
    const userFavoriteIds = Array.from(this.favorites.values())
      .filter(fav => fav.userId === userId)
      .map(fav => fav.mediaId);
    
    return Array.from(this.media.values())
      .filter(media => userFavoriteIds.includes(media.id));
  }
  
  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteCurrentId++;
    const favorite: Favorite = { 
      ...insertFavorite, 
      id, 
      createdAt: new Date() 
    };
    this.favorites.set(id, favorite);
    return favorite;
  }
  
  async removeFavorite(userId: number, mediaId: number): Promise<boolean> {
    const favorite = Array.from(this.favorites.values())
      .find(fav => fav.userId === userId && fav.mediaId === mediaId);
    
    if (!favorite) return false;
    return this.favorites.delete(favorite.id);
  }
  
  async isFavorite(userId: number, mediaId: number): Promise<boolean> {
    return Array.from(this.favorites.values())
      .some(fav => fav.userId === userId && fav.mediaId === mediaId);
  }

  // Initialize with default categories
  private initializeDefaultCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: 'Ação', icon: 'ri-movie-2-line', colorFrom: '#e50914', colorTo: '#e50914' },
      { name: 'Terror', icon: 'ri-ghost-line', colorFrom: '#1e40af', colorTo: '#60a5fa' },
      { name: 'Comédia', icon: 'ri-emotion-laugh-line', colorFrom: '#15803d', colorTo: '#4ade80' },
      { name: 'Romance', icon: 'ri-heart-line', colorFrom: '#7e22ce', colorTo: '#c084fc' },
      { name: 'Sci-Fi', icon: 'ri-space-ship-line', colorFrom: '#eab308', colorTo: '#facc15' },
      { name: 'Aventura', icon: 'ri-map-pin-line', colorFrom: '#4f46e5', colorTo: '#818cf8' }
    ];
    
    defaultCategories.forEach(category => {
      const id = this.categoryCurrentId++;
      this.categories.set(id, { ...category, id });
    });
  }
}

export const storage = new MemStorage();
