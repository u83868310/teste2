import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from './api';
import { type Media, type ContentType } from './types';
import { useToast } from './use-toast';

export function useMedia() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query for featured media
  const featuredQuery = useQuery({
    queryKey: ['/api/media/featured'],
    queryFn: mediaApi.getFeaturedMedia
  });
  
  // Query for all media
  const allMediaQuery = useQuery({
    queryKey: ['/api/media'],
    queryFn: mediaApi.getAllMedia
  });
  
  // Queries for specific content types
  const moviesQuery = useQuery({
    queryKey: ['/api/movies'],
    queryFn: mediaApi.getMovies
  });
  
  const seriesQuery = useQuery({
    queryKey: ['/api/series'],
    queryFn: mediaApi.getSeries
  });
  
  const channelsQuery = useQuery({
    queryKey: ['/api/channels'],
    queryFn: mediaApi.getChannels
  });
  
  // Query for categories
  const categoriesQuery = useQuery({
    queryKey: ['/api/categories'],
    queryFn: mediaApi.getAllCategories
  });
  
  // Mutation for importing playlist
  const importPlaylistMutation = useMutation({
    mutationFn: mediaApi.importPlaylist,
    onSuccess: () => {
      toast({
        title: 'Importação concluída',
        description: 'A lista de conteúdos foi importada com sucesso.',
      });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: `Não foi possível importar a lista: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    }
  });
  
  // Function to handle importing the playlist
  const importPlaylist = useCallback(() => {
    importPlaylistMutation.mutate();
  }, [importPlaylistMutation]);
  
  // Mutation for loading demo content
  const loadDemoContentMutation = useMutation({
    mutationFn: mediaApi.loadDemoContent,
    onSuccess: () => {
      toast({
        title: 'Conteúdo de demonstração carregado',
        description: 'Conteúdo de demonstração carregado com sucesso.',
      });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao carregar conteúdo de demonstração',
        description: `Não foi possível carregar o conteúdo de demonstração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    }
  });
  
  // Function to handle loading demo content
  const loadDemoContent = useCallback(() => {
    loadDemoContentMutation.mutate();
  }, [loadDemoContentMutation]);
  
  // Function to filter media by search term
  const filterMedia = useCallback((mediaItems: Media[] | undefined, term: string): Media[] => {
    if (!mediaItems || !term.trim()) return mediaItems || [];
    
    const normalizedTerm = term.toLowerCase().trim();
    return mediaItems.filter(item => 
      item.title.toLowerCase().includes(normalizedTerm) || 
      item.category?.toLowerCase().includes(normalizedTerm) ||
      item.description?.toLowerCase().includes(normalizedTerm)
    );
  }, []);
  
  // Get content by type (with search filter applied)
  const getContentByType = useCallback((type: ContentType): { data: Media[] | undefined, isLoading: boolean } => {
    switch (type) {
      case 'movie':
        return {
          data: filterMedia(moviesQuery.data, searchTerm),
          isLoading: moviesQuery.isLoading
        };
      case 'series':
        return {
          data: filterMedia(seriesQuery.data, searchTerm),
          isLoading: seriesQuery.isLoading
        };
      case 'channel':
        return {
          data: filterMedia(channelsQuery.data, searchTerm),
          isLoading: channelsQuery.isLoading
        };
      default:
        return {
          data: filterMedia(allMediaQuery.data, searchTerm),
          isLoading: allMediaQuery.isLoading
        };
    }
  }, [
    searchTerm, 
    filterMedia, 
    moviesQuery.data, 
    moviesQuery.isLoading,
    seriesQuery.data,
    seriesQuery.isLoading,
    channelsQuery.data,
    channelsQuery.isLoading,
    allMediaQuery.data,
    allMediaQuery.isLoading
  ]);
  
  return {
    searchTerm,
    setSearchTerm,
    featured: {
      data: featuredQuery.data,
      isLoading: featuredQuery.isLoading,
      error: featuredQuery.error
    },
    allMedia: {
      data: filterMedia(allMediaQuery.data, searchTerm),
      isLoading: allMediaQuery.isLoading,
      error: allMediaQuery.error
    },
    movies: getContentByType('movie'),
    series: getContentByType('series'),
    channels: getContentByType('channel'),
    categories: {
      data: categoriesQuery.data,
      isLoading: categoriesQuery.isLoading,
      error: categoriesQuery.error
    },
    importPlaylist,
    isImporting: importPlaylistMutation.isPending || isImporting,
    setIsImporting,
    loadDemoContent,
    isLoadingDemo: loadDemoContentMutation.isPending,
    getContentByType
  };
}

export function useMediaDetails(id?: number) {
  const { toast } = useToast();
  
  // Query for media details
  const mediaQuery = useQuery({
    queryKey: [`/api/media/${id}`],
    queryFn: () => id ? mediaApi.getMediaById(id) : Promise.reject('No ID provided'),
    enabled: !!id
  });
  
  // Query for episodes (if the media is a series)
  const episodesQuery = useQuery({
    queryKey: [`/api/media/${id}/episodes`],
    queryFn: () => id ? mediaApi.getEpisodesByMediaId(id) : Promise.reject('No ID provided'),
    enabled: !!id && mediaQuery.data?.type === 'series'
  });
  
  return {
    media: {
      data: mediaQuery.data,
      isLoading: mediaQuery.isLoading,
      error: mediaQuery.error
    },
    episodes: {
      data: episodesQuery.data,
      isLoading: episodesQuery.isLoading,
      error: episodesQuery.error
    }
  };
}
