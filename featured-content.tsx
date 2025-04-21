import { useState } from 'react';
import { Button } from './ui-button';
import { Play, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { type Media } from './types';
import { getFallbackImage } from './api';

interface FeaturedContentProps {
  media?: Media;
  isLoading?: boolean;
}

export function FeaturedContent({ media, isLoading = false }: FeaturedContentProps) {
  const [, navigate] = useLocation();
  
  // Navigate to watch page
  const handlePlay = () => {
    if (media) {
      navigate(`/watch/${media.id}`);
    }
  };
  
  // Get the appropriate placeholder if no media is available
  const placeholderStyle = {
    backgroundImage: `url(${media?.thumbnailUrl || getFallbackImage('movie')})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
  
  if (isLoading) {
    return (
      <div className="relative w-full h-[70vh] max-h-[70vh] bg-dark-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-300 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-1/2 z-10">
          <div className="h-12 w-3/4 bg-dark-100 rounded mb-4"></div>
          <div className="h-4 w-1/2 bg-dark-100 rounded mb-4"></div>
          <div className="h-16 w-full bg-dark-100 rounded mb-6"></div>
          <div className="h-10 w-32 bg-primary rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!media) {
    return (
      <div className="relative w-full h-[50vh] bg-gradient-to-r from-dark-200 to-dark-300 flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-white text-2xl font-bold mb-2">Bem-vindo ao StreamFlix</h2>
          <p className="text-text-secondary mb-6">
            Sua plataforma de streaming com filmes, séries e canais ao vivo
          </p>
          <Button onClick={() => navigate('/movies')}>Explorar Conteúdos</Button>
        </div>
      </div>
    );
  }
  
  return (
    <section className="relative">
      {/* Video Player Container */}
      <div className="relative w-full">
        <div className="bg-dark-200 w-full h-[70vh] max-h-[70vh]" style={placeholderStyle}>
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-300 to-transparent"></div>
          
          {/* Player Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center">
            <Button 
              onClick={handlePlay}
              className="bg-primary text-white rounded-md px-5 py-2 font-medium flex items-center hover:bg-opacity-90 mr-4"
            >
              <Play className="mr-2 h-4 w-4" /> Play
            </Button>
            <Button 
              variant="secondary"
              className="bg-dark-100 bg-opacity-70 text-white rounded-md px-4 py-2 font-medium flex items-center hover:bg-opacity-90 mr-4"
            >
              <Plus className="mr-2 h-4 w-4" /> Minha Lista
            </Button>
          </div>
        </div>
        
        {/* Content Info */}
        <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-1/2 z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-heading mb-2">
            {media.title}
          </h1>
          <div className="flex items-center mb-3 text-sm">
            {media.rating && (
              <span className="text-green-500 font-medium mr-2">{media.rating} Match</span>
            )}
            {media.year && (
              <span className="text-text-tertiary mr-2">{media.year}</span>
            )}
            <span className="border border-text-tertiary px-1 text-xs text-text-tertiary mr-2">
              {media.type === 'movie' ? '16+' : media.type === 'series' ? '14+' : 'Livre'}
            </span>
            {media.type === 'series' && (
              <span className="text-text-tertiary">8 Temporadas</span>
            )}
          </div>
          {media.description && (
            <p className="text-text-secondary mb-6 line-clamp-3">
              {media.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
