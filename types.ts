// Common media types used in the frontend

export type ContentType = 'movie' | 'series' | 'channel';

export interface Media {
  id: number;
  title: string;
  streamUrl: string;
  thumbnailUrl?: string;
  type: ContentType;
  category?: string;
  rating?: string;
  year?: string;
  description?: string;
  isFeatured: boolean;
}

export interface Episode {
  id: number;
  mediaId: number;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  streamUrl: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  colorFrom?: string;
  colorTo?: string;
}

// Media items with additional UI state properties
export interface MediaItemProps {
  media: Media;
  onClick?: (media: Media) => void;
  isLoading?: boolean;
}

export interface ContentSectionProps {
  title: string;
  type?: ContentType;
  mediaItems: Media[];
  isLoading?: boolean;
  onItemClick?: (media: Media) => void;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isFullScreen: boolean;
  isMuted: boolean;
}
