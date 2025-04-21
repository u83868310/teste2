import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { FeaturedContent } from './media/featured-content';
import { ContentSection } from './media/content-section';
import { CategoriesSection } from './media/categories-section';
import { Button } from './ui/button';
import { useMedia } from './use-media';
import { type Media } from './types';
import { useToast } from './use-toast';
import { Loader } from 'lucide-react';
import { queryClient, apiRequest } from './queryClient';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locallyImporting, setLocallyImporting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { 
    featured,
    channels,
    movies,
    series,
    categories,
    importPlaylist,
    isImporting,
    loadDemoContent,
    isLoadingDemo,
    setSearchTerm: setMediaSearchTerm
  } = useMedia();
  
  // Check if there's any content available
  const hasContent = (
    (movies.data && movies.data.length > 0) || 
    (series.data && series.data.length > 0) || 
    (channels.data && channels.data.length > 0)
  );
  
  // Import local playlist if no content is available
  useEffect(() => {
    // Check if we need to load content
    if (!hasContent && !movies.isLoading && !series.isLoading && !channels.isLoading && !isImporting && !isLoadingDemo && !locallyImporting) {
      // Show toast notification
      toast({
        title: 'Importando Lista IPTV Local',
        description: 'Aguarde enquanto importamos o conteúdo da sua lista IPTV local.',
      });
      
      // Set loading state
      setLocallyImporting(true);
      
      // Make API request to import local playlist
      fetch('/api/playlist/import-local?clear=true', { 
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(response => response.json())
        .then((data) => {
          if (data.success) {
            toast({
              title: 'Lista importada com sucesso!',
              description: `Foram importados ${data.imported || 0} itens de mídia.`,
              variant: 'default',
            });
            
            // Refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/media'] });
            queryClient.invalidateQueries({ queryKey: ['/api/movies'] });
            queryClient.invalidateQueries({ queryKey: ['/api/series'] });
            queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
            queryClient.invalidateQueries({ queryKey: ['/api/media/featured'] });
          } else {
            toast({
              title: 'Erro ao importar lista',
              description: data.message || 'Ocorreu um erro ao importar sua lista IPTV.',
              variant: 'destructive',
            });
            
            // Fallback to demo content
            loadDemoContent();
          }
        })
        .catch((error) => {
          console.error('Error importing playlist:', error);
          
          toast({
            title: 'Erro ao importar lista',
            description: 'Ocorreu um erro ao importar sua lista IPTV. Carregando conteúdo de demonstração.',
            variant: 'destructive',
          });
          
          // Fallback to demo content
          loadDemoContent();
        })
        .finally(() => {
          setLocallyImporting(false);
        });
    }
  }, [hasContent, movies.isLoading, series.isLoading, channels.isLoading, isImporting, isLoadingDemo, locallyImporting, loadDemoContent, setLocallyImporting, toast, queryClient]);
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setMediaSearchTerm(term);
  };
  
  // Handle media item click
  const handleMediaClick = (media: Media) => {
    navigate(`/watch/${media.id}`);
  };
  
  // Get a featured item (either from featured list or the first movie/series)
  const featuredMedia = featured.data?.[0] || 
                        movies.data?.[0] || 
                        series.data?.[0];
  
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <Header onSearch={handleSearch} searchTerm={searchTerm} />
      
      <main className="flex-grow">
        {/* Loading Indicator if importing playlist */}
        {(isImporting || isLoadingDemo || locallyImporting) && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-dark-200 p-6 rounded-lg max-w-md text-center">
              <Loader className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {isLoadingDemo 
                  ? 'Carregando Conteúdo de Demonstração' 
                  : locallyImporting 
                    ? 'Importando Lista IPTV Local'
                    : 'Importando Conteúdos'
                }
              </h3>
              <p className="text-text-secondary mb-4">
                {isLoadingDemo 
                  ? 'Aguarde enquanto carregamos o conteúdo de demonstração...'
                  : locallyImporting
                    ? 'Aguarde enquanto importamos o conteúdo da sua lista IPTV local...'
                    : 'Aguarde enquanto carregamos os filmes, séries e canais disponíveis...'}
              </p>
              
              {(isImporting || locallyImporting) && !isLoadingDemo && !hasContent && (
                <div className="mt-4">
                  <p className="text-text-secondary mb-2">
                    A importação está demorando muito?
                  </p>
                  <Button 
                    variant="secondary" 
                    onClick={loadDemoContent}
                  >
                    Carregar Conteúdo de Demonstração
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Featured Content Section */}
        <FeaturedContent 
          media={featuredMedia} 
          isLoading={featured.isLoading || movies.isLoading && !featuredMedia} 
        />
        
        {/* Live Channels Section */}
        <ContentSection 
          title="Canais ao Vivo" 
          type="channel"
          mediaItems={channels.data || []}
          isLoading={channels.isLoading}
          onItemClick={handleMediaClick}
        />
        
        {/* Movies Section */}
        <ContentSection 
          title="Filmes em Destaque" 
          type="movie"
          mediaItems={movies.data || []}
          isLoading={movies.isLoading}
          onItemClick={handleMediaClick}
        />
        
        {/* Series Section */}
        <ContentSection 
          title="Séries Populares" 
          type="series"
          mediaItems={series.data || []}
          isLoading={series.isLoading}
          onItemClick={handleMediaClick}
        />
        
        {/* Categories Section */}
        <CategoriesSection 
          categories={categories.data} 
          isLoading={categories.isLoading}
        />
      </main>
      
      <Footer />
    </div>
  );
}
