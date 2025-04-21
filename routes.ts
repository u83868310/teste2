import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMediaSchema, ContentTypeEnum, insertCategorySchema, insertEpisodeSchema } from "./schema";
import axios from "axios";
import { z, ZodError } from "zod";
import fs from "fs";
import path from "path";

// M3U8 Parser helper for local file
async function parseLocalM3U8Playlist(filePath: string) {
  try {
    // Read the local m3u file
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // IPTV credentials
    const username = '430739833';
    const password = '127619980';
    
    // Process the content
    const lines = content.split('\n');
    const result = [];
    
    let currentItem: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check if this is a header line
      if (line.startsWith('#EXTINF:')) {
        // Extract title and other metadata from the header line
        const titleMatch = line.match(/tvg-name="([^"]+)"/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        const titleFromComma = line.split(',').slice(1).join(',').trim();
        
        // Create a new current item
        currentItem = {
          title: titleMatch ? titleMatch[1] : titleFromComma,
          thumbnailUrl: logoMatch ? logoMatch[1] : '',
          type: 'movie', // Default type
          category: groupMatch ? groupMatch[1] : 'Uncategorized',
          isFeatured: false,
          description: `Canal IPTV: ${titleMatch ? titleMatch[1] : titleFromComma}`
        };
        
        // Try to determine type based on group/category
        if (currentItem.category) {
          const lowerCategory = currentItem.category.toLowerCase();
          if (lowerCategory.includes('canal') || 
              lowerCategory.includes('channel') || 
              lowerCategory.includes('tv')) {
            currentItem.type = 'channel';
          } else if (lowerCategory.includes('série') || 
                     lowerCategory.includes('series') || 
                     lowerCategory.includes('temporada') || 
                     lowerCategory.includes('season')) {
            currentItem.type = 'series';  
          }
        }
      } 
      // If not a header line and not a comment, it should be the URL
      else if (!line.startsWith('#') && currentItem) {
        // Make sure URL has authentication credentials
        let streamUrl = line;
        
        // Ensure we're dealing with a URL
        if (streamUrl.startsWith('http')) {
          try {
            // Check if URL is from IPTV provider and add authentication if needed
            if (streamUrl.includes('main.cdnfs.top') || streamUrl.includes('iptv-org')) {
              // If the URL doesn't already have credentials, add them
              if (!streamUrl.includes(username) && !streamUrl.includes(password)) {
                const urlObj = new URL(streamUrl);
                // Check if it's already a full URL with user/pass in path
                if (!streamUrl.includes(`/${username}/${password}/`)) {
                  // Add auth to URL path
                  if (urlObj.pathname.startsWith('/')) {
                    urlObj.pathname = `/${username}/${password}${urlObj.pathname}`;
                  } else {
                    urlObj.pathname = `/${username}/${password}/${urlObj.pathname}`;
                  }
                  streamUrl = urlObj.toString();
                }
              }
            }
          } catch (e) {
            console.error('Error processing URL:', streamUrl, e);
          }
        }
        
        // Add the URL to the current item
        currentItem.streamUrl = streamUrl;
        
        // Add the complete item to our results and reset currentItem
        result.push(currentItem);
        currentItem = null;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing local m3u file:', error);
    throw new Error('Failed to parse local M3U file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// M3U8 Parser helper for remote URL
async function parseM3U8Playlist(url: string) {
  try {
    // IPTV credentials
    const username = '430739833';
    const password = '127619980';
    
    // Check if URL needs authentication
    if (url.includes('main.cdnfs.top') || url.includes('iptv-org')) {
      // If the URL doesn't already have credentials, add them
      if (!url.includes(username) && !url.includes(password)) {
        try {
          const urlObj = new URL(url);
          
          // Add username and password as query parameters if they don't exist
          if (!urlObj.searchParams.has('username') && !urlObj.searchParams.has('password')) {
            urlObj.searchParams.set('username', username);
            urlObj.searchParams.set('password', password);
          }
          
          url = urlObj.toString();
        } catch (e) {
          console.error('Error modifying URL:', e);
        }
      }
    }
    
    console.log('Fetching playlist from:', url);
    const response = await axios.get(url);
    const content = response.data;
    
    if (typeof content !== 'string') {
      throw new Error('Invalid playlist format');
    }
    
    const lines = content.split('\n');
    const mediaItems = [];
    let currentItem: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        // Parse extinf line for metadata
        currentItem = { 
          type: 'movie',
          isFeatured: false
        }; // Default type
        
        // Extract title and other metadata from the line
        const titleMatch = line.match(/tvg-name="([^"]+)"/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        
        if (titleMatch) currentItem.title = titleMatch[1];
        if (logoMatch) currentItem.thumbnailUrl = logoMatch[1];
        if (groupMatch) {
          currentItem.category = groupMatch[1];
          
          // Determine content type based on category
          const category = groupMatch[1].toLowerCase();
          if (category.includes('series') || category.includes('série')) {
            currentItem.type = 'series';
          } else if (category.includes('channel') || category.includes('canal')) {
            currentItem.type = 'channel';
          }
        }
        
        // Extract title after the comma if present
        const commaMatch = line.match(/,(.+)$/);
        if (commaMatch && (!currentItem.title || currentItem.title.trim() === '')) {
          currentItem.title = commaMatch[1].trim();
        }
        
        // Add description
        currentItem.description = `Canal IPTV: ${currentItem.title || ''}`;
      } else if (line.startsWith('http') && currentItem) {
        // This is the URL line
        let streamUrl = line;
        
        // Add authentication credentials to the stream URL if needed
        if (streamUrl.includes('main.cdnfs.top') || streamUrl.includes('iptv-org')) {
          // If the URL doesn't already have credentials, add them
          if (!streamUrl.includes(username) && !streamUrl.includes(password)) {
            try {
              const urlObj = new URL(streamUrl);
              // Check if it's already a full URL with user/pass in path
              if (!streamUrl.includes(`/${username}/${password}/`)) {
                // Add auth to URL path
                if (urlObj.pathname.startsWith('/')) {
                  urlObj.pathname = `/${username}/${password}${urlObj.pathname}`;
                } else {
                  urlObj.pathname = `/${username}/${password}/${urlObj.pathname}`;
                }
                streamUrl = urlObj.toString();
              }
            } catch (e) {
              console.error('Error processing URL:', streamUrl, e);
            }
          }
        }
        
        currentItem.streamUrl = streamUrl;
        
        // Only add items that have both title and URL
        if (currentItem.title && currentItem.streamUrl) {
          mediaItems.push(currentItem);
        }
        
        currentItem = null;
      }
    }
    
    return mediaItems;
  } catch (error) {
    console.error('Error parsing M3U8 playlist:', error);
    
    // Check specifically for rate limiting (HTTP 429)
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      throw new Error('IPTV API rate limit exceeded. Please try again later.');
    }
    
    throw new Error(`Failed to parse playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware for handling JSON bodies
  app.use(express.json());
  
  // API routes
  const apiRouter = express.Router();
  
  // Health check endpoint
  apiRouter.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // Fetch and parse the IPTV playlist
  apiRouter.get('/playlist/parse', async (req, res) => {
    try {
      const playlistUrl = process.env.PLAYLIST_URL || 'http://main.cdnfs.top:80/get.php?username=430739833&password=127619980&type=m3u&output=hls';
      const mediaItems = await parseM3U8Playlist(playlistUrl);
      res.json({ success: true, count: mediaItems.length, media: mediaItems });
    } catch (error) {
      console.error('Error fetching playlist:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Endpoint to create demo content
  apiRouter.post('/create-demo-content', async (req, res) => {
    try {
      // Clear any existing media first
      const existingMedia = await storage.getAllMedia();
      for (const media of existingMedia) {
        await storage.deleteMedia(media.id);
      }
      
      // Demo video URL that works with HLS.js
      const demoUrl = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
      
      // Create sample content
      const demoContent = [
        // Movies
        {
          title: 'Aventura na Floresta',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/movie1/300/450',
          type: 'movie',
          category: 'Aventura',
          description: 'Um grupo de amigos se perde na floresta e precisa encontrar o caminho para casa.',
          isFeatured: true
        },
        {
          title: 'Corrida contra o Tempo',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/movie2/300/450',
          type: 'movie',
          category: 'Ação',
          description: 'Um piloto de corridas precisa vencer a corrida mais importante de sua vida.',
          isFeatured: false
        },
        {
          title: 'O Mistério da Casa Antiga',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/movie3/300/450',
          type: 'movie',
          category: 'Suspense',
          description: 'Uma família se muda para uma casa misteriosa e descobre segredos sombrios.',
          isFeatured: false
        },
        {
          title: 'Amor em Paris',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/movie4/300/450',
          type: 'movie',
          category: 'Romance',
          description: 'Dois estranhos se encontram em Paris e vivem uma história de amor inesquecível.',
          isFeatured: true
        },
        
        // Series
        {
          title: 'A Vida na Cidade',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/series1/300/450',
          type: 'series',
          category: 'Drama',
          description: 'A história de amigos que vivem diversas situações na cidade grande.',
          isFeatured: true
        },
        {
          title: 'Investigadores',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/series2/300/450',
          type: 'series',
          category: 'Crime',
          description: 'Uma equipe de detetives resolve crimes complexos.',
          isFeatured: false
        },
        {
          title: 'Mundos Paralelos',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/series3/300/450',
          type: 'series',
          category: 'Ficção',
          description: 'Uma cientista descobre como viajar entre mundos paralelos.',
          isFeatured: false
        },
        
        // Channels
        {
          title: 'Notícias 24h',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/channel1/300/450',
          type: 'channel',
          category: 'Notícias',
          description: 'Canal de notícias 24 horas por dia.',
          isFeatured: false
        },
        {
          title: 'Esportes ao Vivo',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/channel2/300/450',
          type: 'channel',
          category: 'Esportes',
          description: 'Os melhores eventos esportivos ao vivo.',
          isFeatured: true
        },
        {
          title: 'Documentários',
          streamUrl: demoUrl,
          thumbnailUrl: 'https://picsum.photos/seed/channel3/300/450',
          type: 'channel',
          category: 'Educativo',
          description: 'Documentários sobre natureza, história e ciência.',
          isFeatured: false
        }
      ];
      
      // Store media items
      const results = [];
      
      for (const item of demoContent) {
        try {
          // Validate and add item
          const validatedItem = insertMediaSchema.parse({
            title: item.title,
            streamUrl: item.streamUrl,
            thumbnailUrl: item.thumbnailUrl,
            type: ContentTypeEnum.parse(item.type),
            category: item.category,
            description: item.description,
            isFeatured: item.isFeatured
          });
          
          const savedMedia = await storage.createMedia(validatedItem);
          results.push({ 
            success: true, 
            id: savedMedia.id, 
            title: savedMedia.title 
          });
          
          // Add episodes for series
          if (item.type === 'series') {
            for (let i = 1; i <= 5; i++) {
              try {
                await storage.createEpisode({
                  mediaId: savedMedia.id,
                  title: `Episódio ${i}: Nova Aventura`,
                  seasonNumber: 1,
                  episodeNumber: i,
                  streamUrl: item.streamUrl,
                  thumbnailUrl: `https://picsum.photos/seed/${item.title.replace(/\s+/g, '')}_ep${i}/300/450`,
                  description: `Descrição do episódio ${i} da série ${item.title}.`
                });
              } catch (episodeError) {
                console.error(`Error creating episode for "${item.title}":`, episodeError);
              }
            }
          }
        } catch (error) {
          console.error(`Error creating demo item "${item.title}":`, error);
          results.push({
            success: false,
            title: item.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      res.json({
        success: true,
        message: `Created ${results.filter(r => r.success).length} demo items successfully`,
        failed: results.filter(r => !r.success).length,
        results
      });
      
    } catch (error) {
      console.error('Error creating demo content:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Import media items from local playlist file
  apiRouter.post('/playlist/import-local', async (req, res) => {
    try {
      // Path to local playlist file
      const playlistPath = path.join(process.cwd(), 'lista', 'playlist_430739833.m3u');
      
      console.log('Attempting to read local playlist from:', playlistPath);
      
      // Check if the file exists
      if (!fs.existsSync(playlistPath)) {
        return res.status(404).json({ 
          success: false, 
          message: 'Local playlist file not found' 
        });
      }
      
      // Parse the local playlist file
      const allMediaItems = await parseLocalM3U8Playlist(playlistPath);
      console.log(`Successfully parsed ${allMediaItems.length} items from local playlist`);
      
      // Limit the number of items to import to prevent Replit from crashing
      // Use the first 500 items from each type (movie, series, channel) to get a good variety
      const movieItems = allMediaItems.filter(item => item.type === 'movie').slice(0, 500);
      const seriesItems = allMediaItems.filter(item => item.type === 'series').slice(0, 500);
      const channelItems = allMediaItems.filter(item => item.type === 'channel').slice(0, 500);
      
      // Combine the limited items
      const mediaItems = [...movieItems, ...seriesItems, ...channelItems];
      console.log(`Limited to ${mediaItems.length} items to prevent server overload`);
      
      // Clear any existing media before importing
      if (req.query.clear === 'true') {
        const existingMedia = await storage.getAllMedia();
        for (const media of existingMedia) {
          await storage.deleteMedia(media.id);
        }
        console.log('Cleared existing media items');
      }
      
      // Store media items
      const importResults = [];
      let successCount = 0;
      let failCount = 0;
      
      // Limit the number of items to import if specified
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const itemsToImport = limit ? mediaItems.slice(0, limit) : mediaItems;
      
      console.log(`Processing ${itemsToImport.length} items from playlist...`);
      
      for (const item of itemsToImport) {
        try {
          if (!item.title || !item.streamUrl) {
            failCount++;
            continue;
          }
          
          // Validate against schema
          const validatedItem = insertMediaSchema.parse({
            title: item.title || 'Unknown Title',
            streamUrl: item.streamUrl,
            thumbnailUrl: item.thumbnailUrl || '',
            type: ContentTypeEnum.parse(item.type || 'movie'),
            category: item.category || 'Uncategorized',
            description: item.description || '',
            isFeatured: item.isFeatured || false
          });
          
          const savedMedia = await storage.createMedia(validatedItem);
          importResults.push({ 
            success: true, 
            id: savedMedia.id, 
            title: savedMedia.title,
            type: savedMedia.type
          });
          successCount++;
          
          // Create episodes for series
          if (item.type === 'series' && savedMedia.type === 'series') {
            for (let i = 1; i <= 5; i++) {
              try {
                await storage.createEpisode({
                  mediaId: savedMedia.id,
                  title: `Episódio ${i}`,
                  seasonNumber: 1,
                  episodeNumber: i,
                  streamUrl: item.streamUrl,
                  thumbnailUrl: `https://picsum.photos/seed/episode${savedMedia.id}_${i}/300/450`,
                  description: `Episódio ${i} da série ${savedMedia.title}`
                });
              } catch (episodeError) {
                console.error(`Error creating episode for "${savedMedia.title}":`, episodeError);
              }
            }
          }
        } catch (error) {
          console.error(`Error importing media item "${item.title}":`, error);
          importResults.push({ 
            success: false, 
            title: item.title, 
            error: error instanceof Error ? error.message : 'Validation error' 
          });
          failCount++;
        }
      }
      
      // Set some items as featured if we have some media
      const allMedia = await storage.getAllMedia();
      const featuredCount = allMedia.filter(item => item.isFeatured).length;
      
      if (allMedia.length > 0 && featuredCount < 5) {
        // Select random items to set as featured, ensuring variety in content types
        const movieCandidates = allMedia.filter(item => item.type === 'movie' && !item.isFeatured);
        const seriesCandidates = allMedia.filter(item => item.type === 'series' && !item.isFeatured);
        const channelCandidates = allMedia.filter(item => item.type === 'channel' && !item.isFeatured);
        
        // Select 2 movies, 2 series, and 1 channel to be featured
        const moviesToFeature = movieCandidates.sort(() => 0.5 - Math.random()).slice(0, 2);
        const seriesToFeature = seriesCandidates.sort(() => 0.5 - Math.random()).slice(0, 2);
        const channelsToFeature = channelCandidates.sort(() => 0.5 - Math.random()).slice(0, 1);
        
        const itemsToFeature = [...moviesToFeature, ...seriesToFeature, ...channelsToFeature];
        
        for (const item of itemsToFeature) {
          await storage.updateMedia(item.id, { isFeatured: true });
        }
        
        console.log(`Set ${itemsToFeature.length} items as featured`);
      }
      
      res.json({ 
        success: true, 
        total: itemsToImport.length,
        imported: successCount, 
        failed: failCount,
        message: `Successfully imported ${successCount} media items from local playlist`
      });
    } catch (error) {
      console.error('Error importing local playlist:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Import media items from remote playlist to database
  apiRouter.post('/playlist/import', async (req, res) => {
    try {
      const playlistUrl = process.env.PLAYLIST_URL || 'http://main.cdnfs.top:80/get.php?username=430739833&password=127619980&type=m3u&output=hls';
      
      let mediaItems = [];
      try {
        mediaItems = await parseM3U8Playlist(playlistUrl);
      } catch (error) {
        // Check if this is a rate limit error (HTTP 429)
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          console.log('IPTV API rate limited, falling back to demo content directly');
          
          // Fall back to demo content directly
          try {
            // Create demo content in the same process instead of making an HTTP request
            // Clear any existing media first
            const existingMedia = await storage.getAllMedia();
            for (const media of existingMedia) {
              await storage.deleteMedia(media.id);
            }
            
            // Demo video URL that works with HLS.js
            const demoUrl = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
            
            // Create sample demo content
            const demoContent = [
              // Movies
              {
                title: 'Aventura na Floresta',
                streamUrl: demoUrl,
                thumbnailUrl: 'https://picsum.photos/seed/movie1/300/450',
                type: 'movie' as const,
                category: 'Aventura',
                description: 'Um grupo de amigos se perde na floresta e precisa encontrar o caminho para casa.',
                isFeatured: true
              },
              {
                title: 'Corrida contra o Tempo',
                streamUrl: demoUrl,
                thumbnailUrl: 'https://picsum.photos/seed/movie2/300/450',
                type: 'movie' as const,
                category: 'Ação',
                description: 'Um piloto de corridas precisa vencer a corrida mais importante de sua vida.',
                isFeatured: false
              },
              {
                title: 'O Mistério da Casa Antiga',
                streamUrl: demoUrl,
                thumbnailUrl: 'https://picsum.photos/seed/movie3/300/450',
                type: 'movie' as const,
                category: 'Suspense',
                description: 'Uma família se muda para uma casa antiga e começa a perceber eventos paranormais.',
                isFeatured: false
              }
            ];
            
            // Add demo content
            for (const item of demoContent) {
              await storage.createMedia(item);
            }
            
            return res.json({
              success: true,
              message: 'IPTV API rate limited. Demo content loaded instead.',
              imported: demoContent.length
            });
          } catch (demoError) {
            console.error('Error creating demo content:', demoError);
            return res.status(500).json({
              success: false,
              message: 'Failed to load demo content'
            });
          }
        } else {
          throw error; // Re-throw if not a rate limit error
        }
      }
      
      // Store media items
      const importResults = [];
      
      for (const item of mediaItems) {
        try {
          // Validate against schema
          const validatedItem = insertMediaSchema.parse({
            title: item.title || 'Unknown Title',
            streamUrl: item.streamUrl,
            thumbnailUrl: item.thumbnailUrl || '',
            type: ContentTypeEnum.parse(item.type || 'movie'),
            category: item.category || 'Uncategorized',
            description: item.description || '',
            isFeatured: item.isFeatured || false
          });
          
          const savedMedia = await storage.createMedia(validatedItem);
          importResults.push({ 
            success: true, 
            id: savedMedia.id, 
            title: savedMedia.title 
          });
          
          // Create episodes for series
          if (item.type === 'series' && savedMedia.type === 'series') {
            for (let i = 1; i <= 5; i++) {
              try {
                await storage.createEpisode({
                  mediaId: savedMedia.id,
                  title: `Episode ${i}`,
                  seasonNumber: 1,
                  episodeNumber: i,
                  streamUrl: item.streamUrl,
                  thumbnailUrl: `https://picsum.photos/seed/episode${i}/300/450`,
                  description: `Description for episode ${i}`
                });
              } catch (episodeError) {
                console.error(`Error creating episode for "${savedMedia.title}":`, episodeError);
              }
            }
          }
        } catch (error) {
          console.error(`Error importing media item "${item.title}":`, error);
          importResults.push({ 
            success: false, 
            title: item.title, 
            error: error instanceof Error ? error.message : 'Validation error' 
          });
        }
      }
      
      // Set some items as featured if we have some media
      const allMedia = await storage.getAllMedia();
      const featuredCount = allMedia.filter(item => item.isFeatured).length;
      
      if (allMedia.length > 0 && featuredCount < 2) {
        // Select a few random items to set as featured
        const randomItems = allMedia
          .filter(item => !item.isFeatured)
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(3, allMedia.length));
        
        for (const item of randomItems) {
          await storage.updateMedia(item.id, { isFeatured: true });
        }
      }
      
      res.json({ 
        success: true, 
        imported: importResults.filter(r => r.success).length, 
        failed: importResults.filter(r => !r.success).length,
        results: importResults
      });
    } catch (error) {
      console.error('Error importing playlist:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Media endpoints
  apiRouter.get('/media', async (req, res) => {
    try {
      const allMedia = await storage.getAllMedia();
      res.json(allMedia);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  });
  
  apiRouter.get('/media/featured', async (req, res) => {
    try {
      const featuredMedia = await storage.getFeaturedMedia();
      res.json(featuredMedia);
    } catch (error) {
      console.error('Error fetching featured media:', error);
      res.status(500).json({ message: 'Failed to fetch featured media' });
    }
  });
  
  apiRouter.get('/media/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const media = await storage.getMediaById(id);
      
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      res.json(media);
    } catch (error) {
      console.error('Error fetching media by ID:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  });
  
  // Movies, Series, and Channels endpoints
  apiRouter.get('/movies', async (req, res) => {
    try {
      const movies = await storage.getMediaByType('movie');
      res.json(movies);
    } catch (error) {
      console.error('Error fetching movies:', error);
      res.status(500).json({ message: 'Failed to fetch movies' });
    }
  });
  
  apiRouter.get('/series', async (req, res) => {
    try {
      const series = await storage.getMediaByType('series');
      res.json(series);
    } catch (error) {
      console.error('Error fetching series:', error);
      res.status(500).json({ message: 'Failed to fetch series' });
    }
  });
  
  apiRouter.get('/channels', async (req, res) => {
    try {
      const channels = await storage.getMediaByType('channel');
      res.json(channels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ message: 'Failed to fetch channels' });
    }
  });
  
  // Categories endpoints
  apiRouter.get('/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  // Get direct stream URL from stream ID
  apiRouter.get('/direct-stream/:streamId', async (req, res) => {
    try {
      const streamId = req.params.streamId;
      const username = '430739833';
      const password = '127619980';
      
      // Use the player API to get the direct stream URL
      const playerApiUrl = `http://main.cdnfs.top:80/player_api.php?username=${username}&password=${password}&action=get_live_streams&stream_id=${streamId}`;
      
      console.log('Getting direct stream from API:', playerApiUrl);
      
      const apiResponse = await axios.get(playerApiUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
      });
      
      if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
        // Get the direct URL from the API response
        const streamData = apiResponse.data[0];
        const directUrl = streamData.direct_source || streamData.stream_url;
        
        if (directUrl) {
          return res.json({ 
            success: true, 
            streamUrl: directUrl,
            name: streamData.name,
            streamType: streamData.stream_type,
            epgChannelId: streamData.epg_channel_id,
            added: streamData.added,
            categoryId: streamData.category_id,
            customSid: streamData.custom_sid
          });
        } else {
          return res.status(404).json({ 
            success: false, 
            message: 'No direct stream URL found for this stream ID'
          });
        }
      } else {
        return res.status(404).json({ 
          success: false, 
          message: 'Stream not found or invalid response from API'
        });
      }
    } catch (error) {
      console.error('Error getting direct stream URL:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get direct stream URL', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  apiRouter.get('/categories/:id/media', async (req, res) => {
    try {
      const category = await storage.getCategoryById(parseInt(req.params.id));
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      const media = await storage.getMediaByCategory(category.name);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media by category:', error);
      res.status(500).json({ message: 'Failed to fetch media by category' });
    }
  });
  
  apiRouter.post('/categories', async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const createdCategory = await storage.createCategory(category);
      res.status(201).json(createdCategory);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create category' });
    }
  });
  
  // Episodes endpoints
  apiRouter.get('/media/:id/episodes', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const media = await storage.getMediaById(id);
      
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      if (media.type !== 'series') {
        return res.status(400).json({ message: 'Media is not a series' });
      }
      
      const episodes = await storage.getEpisodesByMediaId(id);
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      res.status(500).json({ message: 'Failed to fetch episodes' });
    }
  });
  
  apiRouter.post('/media/:id/episodes', async (req, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      if (isNaN(mediaId)) {
        return res.status(400).json({ message: 'Invalid media ID' });
      }
      
      const media = await storage.getMediaById(mediaId);
      
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }
      
      if (media.type !== 'series') {
        return res.status(400).json({ message: 'Media is not a series' });
      }
      
      // Validate episode data
      const episodeData = insertEpisodeSchema.parse({
        ...req.body,
        mediaId
      });
      
      const createdEpisode = await storage.createEpisode(episodeData);
      res.status(201).json(createdEpisode);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid episode data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create episode' });
    }
  });
  
  // Stream proxy endpoint to handle authentication and CORS issues
  apiRouter.get('/stream-proxy', async (req, res) => {
    let url = req.query.url as string;
    
    if (!url) {
      return res.status(400).json({ message: 'No URL provided' });
    }
    
    try {
      // IPTV credentials
      const username = '430739833';
      const password = '127619980';
      
      // Do we need to get a direct stream URL from the player API?
      if (url.includes('main.cdnfs.top') && url.includes('.m3u8')) {
        console.log('Getting direct stream URL from player API for:', url);
        
        try {
          // Extract the stream ID from the URL
          const match = url.match(/\/([0-9]+)\.m3u8/);
          if (match && match[1]) {
            const streamId = match[1];
            // Use the player API to get the direct stream URL
            const playerApiUrl = `http://main.cdnfs.top:80/player_api.php?username=${username}&password=${password}&action=get_live_streams&stream_id=${streamId}`;
            
            const apiResponse = await axios.get(playerApiUrl, {
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              }
            });
            
            if (apiResponse.data && Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
              // Get the direct URL from the API response
              const directUrl = apiResponse.data[0].direct_source || apiResponse.data[0].stream_url;
              if (directUrl) {
                console.log('Found direct stream URL:', directUrl);
                url = directUrl;
              }
            }
          }
        } catch (apiError) {
          console.warn('Error getting direct stream URL:', apiError);
          // Continue with the original URL if there's an error
        }
      }
      
      console.log(`Proxy request for stream: ${url}`);
      
      // Make the request to the stream URL
      const response = await axios({
        method: 'get',
        url: url,
        // Do not use stream for m3u8, use text
        responseType: url.endsWith('.m3u8') ? 'text' : 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'http://main.cdnfs.top/',
          'Accept': '*/*'
        }
      });
      
      // Set proper content type based on URL
      if (url.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      } else if (url.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t');
      }
      
      // Make sure CORS headers are set
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      
      // Set the status code
      res.status(response.status);
      
      // Send the response data based on type
      if (typeof response.data === 'string') {
        // For m3u8 files, we need to proxy the ts files as well
        if (url.endsWith('.m3u8')) {
          let content = response.data;
          
          // Replace all TS file references with our proxy
          // But be careful with HLS segments paths - they may be relative or absolute
          const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
          
          // Match all lines that might contain media segments
          const mediaPattern = /^((?!#).+)$/gm;
          content = content.replace(mediaPattern, (match) => {
            // Skip empty lines
            if (!match.trim()) return match;
            
            // If it's already an absolute URL
            if (match.startsWith('http')) {
              return `/api/stream-proxy?url=${encodeURIComponent(match)}`;
            } 
            // Handle relative paths (both with and without leading slash)
            else {
              const absoluteUrl = match.startsWith('/') 
                ? `${new URL(url).origin}${match}` 
                : `${baseUrl}${match}`;
              return `/api/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
            }
          });
          
          res.send(content);
        } else {
          res.send(response.data);
        }
      } else {
        // For binary streams like .ts files
        response.data.pipe(res);
      }
    } catch (error) {
      console.error('Stream proxy error:', error);
      
      // Send a fallback stream URL
      const fallbackStreamUrl = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
      
      if (req.headers.accept?.includes('application/json')) {
        // If client accepts JSON, send JSON response
        res.status(500).json({ 
          message: 'Failed to proxy stream', 
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackUrl: fallbackStreamUrl
        });
      } else {
        // Otherwise redirect to fallback
        res.redirect(fallbackStreamUrl);
      }
    }
  });
  
  // Register all API routes with /api prefix
  app.use('/api', apiRouter);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
