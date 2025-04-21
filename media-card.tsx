import { Card } from './ui-card';
import { Star } from 'lucide-react';
import { type Media } from './types';
import { getFallbackImage } from './api';

interface MediaCardProps {
  media: Media;
  onClick?: (media: Media) => void;
  isLoading?: boolean;
  aspectRatio?: 'portrait' | 'landscape';
  showDetails?: boolean;
}

export function MediaCard({ 
  media, 
  onClick, 
  isLoading = false,
  aspectRatio = 'portrait', // portrait for movies, landscape for channels/series
  showDetails = true
}: MediaCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(media);
    }
  };
  
  // Get fallback image based on content type
  const imageUrl = media.thumbnailUrl || getFallbackImage(media.type);
  
  // Determine if card should be portrait (movies) or landscape (channels/series)
  const isPortrait = aspectRatio === 'portrait';
  
  if (isLoading) {
    return (
      <div 
        className={`flex-shrink-0 rounded-lg overflow-hidden shadow-lg bg-dark-200 animate-pulse
          ${isPortrait ? 'w-40' : 'w-48'}`}
      >
        <div className={`w-full ${isPortrait ? 'h-56' : 'h-28'} bg-dark-100`}></div>
        <div className="p-3">
          <div className="h-4 bg-dark-100 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-dark-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  return (
    <Card 
      className={`content-card flex-shrink-0 rounded-lg overflow-hidden shadow-lg bg-dark-200 
        hover:cursor-pointer transition-transform duration-300 hover:scale-105
        ${isPortrait ? 'w-40' : 'w-48'}`}
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={media.title} 
          className={`w-full ${isPortrait ? 'h-56' : 'h-28'} object-cover`}
          loading="lazy"
        />
        
        {/* Live indicator for channels */}
        {media.type === 'channel' && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
            <span className="text-xs font-medium text-white">AO VIVO</span>
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="p-3">
          <h3 className="text-white font-medium text-sm mb-1 truncate">{media.title}</h3>
          
          {media.type === 'channel' && (
            <p className="text-text-tertiary text-xs">{media.category || 'Canal'}</p>
          )}
          
          {media.type === 'movie' && media.rating && (
            <div className="flex items-center">
              <Star className="text-yellow-400 h-3 w-3 mr-1" />
              <span className="text-text-tertiary text-xs">{media.rating}</span>
            </div>
          )}
          
          {media.type === 'series' && (
            <p className="text-text-tertiary text-xs">{media.category || 'Série'}</p>
          )}
        </div>
      )}
    </Card>
  );
}
