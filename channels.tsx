import { useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { MediaCard } from './media/media-card';
import { useMedia } from './use-media';
import { type Media } from './types';
import { Loader } from 'lucide-react';

export default function Channels() {
  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();
  
  const { channels, setSearchTerm: setMediaSearchTerm } = useMedia();
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setMediaSearchTerm(term);
  };
  
  // Handle channel click
  const handleChannelClick = (channel: Media) => {
    navigate(`/watch/${channel.id}`);
  };
  
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <Header onSearch={handleSearch} searchTerm={searchTerm} />
      
      <main className="flex-grow px-4 py-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 font-heading">Canais ao Vivo</h1>
          
          {channels.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="h-8 w-8 text-primary animate-spin mr-3" />
              <span className="text-text-secondary">Carregando canais...</span>
            </div>
          ) : channels.data && channels.data.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {channels.data.map(channel => (
                <MediaCard 
                  key={channel.id}
                  media={channel}
                  onClick={handleChannelClick}
                  aspectRatio="landscape"
                />
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-20">
              <h3 className="text-xl text-white mb-2">Nenhum canal encontrado</h3>
              <p className="text-text-secondary">
                Não encontramos nenhum canal correspondente a "{searchTerm}".
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl text-white mb-2">Nenhum canal disponível</h3>
              <p className="text-text-secondary">
                Não há canais disponíveis no momento. Tente novamente mais tarde.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
