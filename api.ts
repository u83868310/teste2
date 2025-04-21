import { type Media, type Episode, type Category } from "./types";
import { apiRequest } from "./queryClient";

// API functions for fetching data from the server
export const mediaApi = {
  // Media endpoints
  getAllMedia: async (): Promise<Media[]> => {
    const res = await fetch('/api/media');
    if (!res.ok) throw new Error('Failed to fetch media');
    return res.json();
  },
  
  getFeaturedMedia: async (): Promise<Media[]> => {
    const res = await fetch('/api/media/featured');
    if (!res.ok) throw new Error('Failed to fetch featured media');
    return res.json();
  },
  
  getMediaById: async (id: number): Promise<Media> => {
    const res = await fetch(`/api/media/${id}`);
    if (!res.ok) throw new Error('Failed to fetch media');
    return res.json();
  },
  
  // Content type endpoints
  getMovies: async (): Promise<Media[]> => {
    const res = await fetch('/api/movies');
    if (!res.ok) throw new Error('Failed to fetch movies');
    return res.json();
  },
  
  getSeries: async (): Promise<Media[]> => {
    const res = await fetch('/api/series');
    if (!res.ok) throw new Error('Failed to fetch series');
    return res.json();
  },
  
  getChannels: async (): Promise<Media[]> => {
    const res = await fetch('/api/channels');
    if (!res.ok) throw new Error('Failed to fetch channels');
    return res.json();
  },
  
  // Category endpoints
  getAllCategories: async (): Promise<Category[]> => {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },
  
  getMediaByCategory: async (categoryId: number): Promise<Media[]> => {
    const res = await fetch(`/api/categories/${categoryId}/media`);
    if (!res.ok) throw new Error('Failed to fetch media by category');
    return res.json();
  },
  
  // Episode endpoints
  getEpisodesByMediaId: async (mediaId: number): Promise<Episode[]> => {
    const res = await fetch(`/api/media/${mediaId}/episodes`);
    if (!res.ok) throw new Error('Failed to fetch episodes');
    return res.json();
  },
  
  // Playlist endpoints
  parsePlaylist: async () => {
    const res = await fetch('/api/playlist/parse');
    if (!res.ok) throw new Error('Failed to parse playlist');
    return res.json();
  },
  
  importPlaylist: async () => {
    const res = await apiRequest('POST', '/api/playlist/import', {});
    if (!res.ok) throw new Error('Failed to import playlist');
    return res.json();
  },
  
  // Load demo content
  loadDemoContent: async () => {
    const res = await apiRequest('POST', '/api/create-demo-content', {});
    if (!res.ok) throw new Error('Failed to load demo content');
    return res.json();
  }
};

// Function to get a fallback image based on content type
export function getFallbackImage(type: string): string {
  switch (type) {
    case 'movie':
      return 'https://via.placeholder.com/300x450/262626/ffffff?text=Movie';
    case 'series':
      return 'https://via.placeholder.com/300x169/262626/ffffff?text=Series';
    case 'channel':
      return 'https://via.placeholder.com/300x169/262626/ffffff?text=Channel';
    default:
      return 'https://via.placeholder.com/300x450/262626/ffffff?text=Media';
  }
}

// Helper function to get a gradient background for a category
export function getCategoryGradient(category?: Category): string {
  if (!category || !category.colorFrom || !category.colorTo) {
    return 'bg-gradient-to-r from-primary to-secondary';
  }
  
  return `bg-gradient-to-r from-[${category.colorFrom}] to-[${category.colorTo}]`;
}
