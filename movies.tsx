import { useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { MediaCard } from './media/media-card';
import { useMedia } from './use-media';
import { type Media } from './types';
import { Loader } from 'lucide-react';

export default function Movies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();
  
  const { movies, setSearchTerm: setMediaSearchTerm } = useMedia();
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setMediaSearchTerm(term);
  };
  
  // Handle movie click
  const handleMovieClick = (movie: Media) => {
    navigate(`/watch/${movie.id}`);
  };
  
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <Header onSearch={handleSearch} searchTerm={searchTerm} />
      
      <main className="flex-grow px-4 py-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 font-heading">Filmes</h1>
          
          {movies.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="h-8 w-8 text-primary animate-spin mr-3" />
              <span className="text-text-secondary">Carregando filmes...</span>
            </div>
          ) : movies.data && movies.data.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.data.map(movie => (
                <MediaCard 
                  key={movie.id}
                  media={movie}
                  onClick={handleMovieClick}
                />
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-20">
              <h3 className="text-xl text-white mb-2">Nenhum filme encontrado</h3>
              <p className="text-text-secondary">
                Não encontramos nenhum filme correspondente a "{searchTerm}".
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl text-white mb-2">Nenhum filme disponível</h3>
              <p className="text-text-secondary">
                Não há filmes disponíveis no momento. Tente novamente mais tarde.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
