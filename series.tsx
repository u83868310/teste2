import { useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { MediaCard } from './media/media-card';
import { useMedia } from './use-media';
import { type Media } from './types';
import { Loader } from 'lucide-react';

export default function Series() {
  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();
  
  const { series, setSearchTerm: setMediaSearchTerm } = useMedia();
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setMediaSearchTerm(term);
  };
  
  // Handle series click
  const handleSeriesClick = (seriesItem: Media) => {
    navigate(`/watch/${seriesItem.id}`);
  };
  
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <Header onSearch={handleSearch} searchTerm={searchTerm} />
      
      <main className="flex-grow px-4 py-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 font-heading">Séries</h1>
          
          {series.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="h-8 w-8 text-primary animate-spin mr-3" />
              <span className="text-text-secondary">Carregando séries...</span>
            </div>
          ) : series.data && series.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {series.data.map(seriesItem => (
                <MediaCard 
                  key={seriesItem.id}
                  media={seriesItem}
                  onClick={handleSeriesClick}
                  aspectRatio="landscape"
                />
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-20">
              <h3 className="text-xl text-white mb-2">Nenhuma série encontrada</h3>
              <p className="text-text-secondary">
                Não encontramos nenhuma série correspondente a "{searchTerm}".
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl text-white mb-2">Nenhuma série disponível</h3>
              <p className="text-text-secondary">
                Não há séries disponíveis no momento. Tente novamente mais tarde.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
