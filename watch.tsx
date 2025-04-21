import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { VideoPlayer } from './ui/video-player';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ContentSection } from './media/content-section';
import { useMediaDetails, useMedia } from './use-media';
import { ChevronLeft, Loader, Info, Play } from 'lucide-react';
import { useToast } from './use-toast';
import { type Episode } from './types';

export default function Watch() {
  const [, navigate] = useLocation();
  const [matched, params] = useRoute<{ id: string }>('/watch/:id');
  const { toast } = useToast();
  const id = matched && params ? parseInt(params.id) : undefined;
  
  const { media, episodes } = useMediaDetails(id);
  const { getContentByType } = useMedia();
  
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  
  // Get related content based on media type
  const relatedContent = media.data 
    ? getContentByType(media.data.type)
    : { data: undefined, isLoading: false };
  
  // Set the first episode as selected when episodes are loaded
  useEffect(() => {
    if (episodes.data && episodes.data.length > 0 && !selectedEpisode) {
      setSelectedEpisode(episodes.data[0]);
    }
  }, [episodes.data, selectedEpisode]);
  
  // Handle errors
  useEffect(() => {
    if (media.error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o conteúdo solicitado.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [media.error, toast, navigate]);
  
  // Handle back button
  const handleBack = () => {
    window.history.back();
  };
  
  // Handle episode selection
  const handleEpisodeSelect = (episode: Episode) => {
    setSelectedEpisode(episode);
  };
  
  // Determine the stream URL to play
  const streamUrl = selectedEpisode?.streamUrl || media.data?.streamUrl || '';
  
  if (media.isLoading) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <Loader className="h-12 w-12 text-primary animate-spin mr-3" />
        <span className="text-text-secondary text-xl">Carregando...</span>
      </div>
    );
  }
  
  if (!media.data) {
    return (
      <div className="min-h-screen bg-dark-300 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl text-white mb-4">Conteúdo não encontrado</h2>
            <Button onClick={() => navigate('/')}>Voltar para Início</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          {/* Back button */}
          <Button 
            variant="ghost" 
            className="mb-4 text-text-secondary hover:text-white"
            onClick={handleBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          
          {/* Video Player */}
          <div className="mb-6">
            <VideoPlayer 
              streamUrl={streamUrl}
              title={selectedEpisode?.title || media.data.title}
              subtitle={
                selectedEpisode 
                  ? `S${selectedEpisode.seasonNumber}:E${selectedEpisode.episodeNumber} - ${media.data.title}`
                  : media.data.category
              }
              description={selectedEpisode?.description || media.data.description}
              autoPlay={true}
            />
          </div>
          
          {/* Episodes section (for series) */}
          {media.data.type === 'series' && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Episódios</h2>
              
              {episodes.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 text-primary animate-spin mr-2" />
                  <span className="text-text-secondary">Carregando episódios...</span>
                </div>
              ) : episodes.data && episodes.data.length > 0 ? (
                <div className="space-y-2">
                  {episodes.data.map(episode => (
                    <div 
                      key={episode.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-dark-200 transition-colors
                        ${selectedEpisode?.id === episode.id ? 'bg-dark-100' : 'bg-dark-300'}`}
                      onClick={() => handleEpisodeSelect(episode)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          {selectedEpisode?.id === episode.id ? (
                            <Play className="h-6 w-6 text-primary" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-dark-100 flex items-center justify-center text-text-secondary text-xs">
                              {episode.episodeNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-white font-medium">
                            {episode.title || `Episódio ${episode.episodeNumber}`}
                          </h3>
                          <p className="text-text-tertiary text-sm">
                            {`Temporada ${episode.seasonNumber}, Episódio ${episode.episodeNumber}`}
                          </p>
                          {episode.description && (
                            <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                              {episode.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-200 rounded-md p-6 text-center">
                  <Info className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-text-secondary">
                    Nenhum episódio disponível para esta série.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <Separator className="my-8 bg-dark-100" />
          
          {/* Related content */}
          <ContentSection 
            title={`${media.data.type === 'movie' ? 'Filmes' : media.data.type === 'series' ? 'Séries' : 'Canais'} Relacionados`}
            mediaItems={(relatedContent.data || []).filter(item => item.id !== media.data?.id).slice(0, 10)}
            isLoading={relatedContent.isLoading}
            onItemClick={(mediaItem) => navigate(`/watch/${mediaItem.id}`)}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
