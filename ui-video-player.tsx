import { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { Button } from './ui-button';
import { Slider } from './ui-slider';
import { Progress } from './ui-progress';
import { 
  Play, Pause, Volume2, VolumeX, 
  Maximize, Minimize, Settings, X, 
  SkipBack, SkipForward, Loader
} from 'lucide-react';
import { type PlayerState } from './types';
import { cn } from './utils';

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
  subtitle?: string;
  description?: string;
  autoPlay?: boolean;
  onClose?: () => void;
  className?: string;
}

export function VideoPlayer({
  streamUrl,
  title,
  subtitle,
  description,
  autoPlay = true,
  onClose,
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hls, setHls] = useState<Hls | null>(null);
  
  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isFullScreen: false,
    isMuted: false
  });
  
  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Helper function to get proxy URL
  const getProxyUrl = async (originalUrl: string): Promise<string> => {
    // Check if the URL is from known external IPTV providers that need proxying
    if (originalUrl.includes('main.cdnfs.top') || 
        originalUrl.includes('api-iptv') || 
        originalUrl.includes('.m3u8')) {
      
      // For debugging - log the URL we're proxying
      console.log('Proxying stream URL:', originalUrl);
      
      // If it's a specific channel from our IPTV provider, use direct stream API
      if (originalUrl.includes('main.cdnfs.top') && originalUrl.includes('.m3u8')) {
        // Try to get direct stream URL for better compatibility
        const match = originalUrl.match(/\/([0-9]+)\.m3u8/);
        if (match && match[1]) {
          const streamId = match[1];
          console.log('Detected stream ID:', streamId);
          
          try {
            // Call our direct stream API
            const response = await fetch(`/api/direct-stream/${streamId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.streamUrl) {
                console.log('Using direct stream URL from API:', data.streamUrl);
                return `/api/stream-proxy?url=${encodeURIComponent(data.streamUrl)}`;
              }
            }
          } catch (err) {
            console.error('Error fetching direct stream URL:', err);
          }
        }
      }
      
      // Use our server proxy as fallback
      return `/api/stream-proxy?url=${encodeURIComponent(originalUrl)}`;
    }
    
    // Use the URL directly for our demo streams
    return originalUrl;
  };
  
  // Setup HLS.js for m3u8 playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Clean up previous HLS instance if it exists
    if (hls) {
      hls.destroy();
    }
    
    setIsLoading(true);
    setError(null);
    
    // Define an async function to setup player
    const setupPlayer = async () => {
      try {
        // Get the proxied stream URL
        const proxyUrl = await getProxyUrl(streamUrl);
        console.log('Using stream URL:', proxyUrl);
        
        if (Hls.isSupported()) {
          const newHls = new Hls({
            enableWorker: false, // Disable worker for more compatibility
            lowLatencyMode: false, // Disable low latency mode to improve compatibility
            backBufferLength: 30, // Reduce buffer length to improve stability
            maxBufferLength: 30, // Limit buffer size
            maxMaxBufferLength: 60, // Maximum buffer size
            liveSyncDurationCount: 1, // Reduce live sync duration for better recovery with frequent reloads
            liveMaxLatencyDurationCount: 5, // Reduced max latency count for quicker recovery
            liveDurationInfinity: true, // Treat live streams as infinite duration
            levelLoadingRetryDelay: 500, // Start with a lower retry delay
            manifestLoadingRetryDelay: 500, // Start with a lower retry delay
            fragLoadingRetryDelay: 500, // Start with a lower retry delay
            enableDateRangeMetadataCues: false, // Disable date range metadata for better compatibility
            startLevel: -1, // Auto start level
            debug: false, // Set to true for debugging only
            // Add tolerance for errors
            fragLoadingMaxRetry: 6,
            manifestLoadingMaxRetry: 6,
            levelLoadingMaxRetry: 6,
            xhrSetup: function(xhr, url) {
              // Make sure XHR requests include credentials
              xhr.withCredentials = false; // Change to false to avoid CORS issues
            }
          });
          
          newHls.loadSource(proxyUrl);
          newHls.attachMedia(video);
      
          newHls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            setPlayerState(prev => ({ ...prev, isPlaying: !!autoPlay }));
            if (autoPlay) {
              video.play().catch(error => {
                console.error('Autoplay failed:', error);
                setPlayerState(prev => ({ ...prev, isPlaying: false }));
              });
            }
          });
          
          newHls.on(Hls.Events.ERROR, (event, data) => {
            // Log all errors for debugging
            console.error('HLS error:', data.type, data.details, data);
            
            // Handle "media sequence mismatch" error specifically - this is common with live streams
            if (data.details === 'levelParsingError' && 
                data.reason && 
                data.reason.includes('media sequence mismatch')) {
              console.log('Media sequence mismatch detected - attempting to recover');
              
              // Just reload the stream instead of showing an error
              setTimeout(() => {
                newHls.stopLoad();
                newHls.startLoad();
                console.log('Restarted stream after media sequence error');
              }, 1000);
              
              return; // Don't treat this as fatal
            }
            
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('Network error:', data);
                  
                  // Don't show error for 10 seconds, just try to recover silently first
                  setTimeout(() => {
                    if (newHls) {
                      newHls.stopLoad();
                      newHls.startLoad();
                      console.log('Restarted stream after network error');
                    }
                  }, 1000);
                  
                  break;
                  
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('Media error:', data);
                  
                  // Try to recover media errors without showing the error to user
                  setTimeout(() => {
                    if (newHls) {
                      newHls.recoverMediaError();
                      console.log('Attempted to recover from media error');
                    }
                  }, 1000);
                  
                  break;
                  
                default:
                  // Only show error message for truly fatal errors after multiple retries
                  console.error('Fatal error:', data);
                  
                  // For IPTV live streams, we want to be more tolerant before showing errors
                  setTimeout(() => {
                    setError('Não foi possível reproduzir o canal. Tente outro canal ou recarregue a página.');
                  }, 5000);
                  
                  break;
              }
            }
          });
          
          setHls(newHls);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // For browsers that natively support HLS (Safari)
          const proxyUrl = await getProxyUrl(streamUrl);
          video.src = proxyUrl;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (autoPlay) {
              video.play().catch(error => {
                console.error('Autoplay failed:', error);
              });
            }
          });
          
          video.addEventListener('error', () => {
            setError('Erro ao carregar o vídeo.');
            setIsLoading(false);
          });
        } else {
          setError('Seu navegador não suporta a reprodução deste formato de vídeo.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error setting up player:', error);
        setError('Erro ao inicializar o player. Tente novamente.');
        setIsLoading(false);
      }
    };
    
    // Call the setupPlayer function
    setupPlayer();
    
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl, autoPlay]);
  
  // Add video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const onTimeUpdate = () => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: video.currentTime,
        duration: video.duration || 0
      }));
    };
    
    const onPlay = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    };
    
    const onPause = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };
    
    const onVolumeChange = () => {
      setPlayerState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted
      }));
    };
    
    const onLoadedMetadata = () => {
      setPlayerState(prev => ({
        ...prev,
        duration: video.duration || 0
      }));
      setIsLoading(false);
    };
    
    const onEnded = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };
    
    const onError = () => {
      setError('Erro ao reproduzir o vídeo.');
      setIsLoading(false);
    };
    
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, []);
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!containerRef.current) return;
    
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      setControlsVisible(true);
      
      timeout = setTimeout(() => {
        if (playerState.isPlaying) {
          setControlsVisible(false);
        }
      }, 3000);
    };
    
    const container = containerRef.current;
    container.addEventListener('mousemove', resetTimer);
    container.addEventListener('mousedown', resetTimer);
    container.addEventListener('touchstart', resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      container.removeEventListener('mousemove', resetTimer);
      container.removeEventListener('mousedown', resetTimer);
      container.removeEventListener('touchstart', resetTimer);
    };
  }, [playerState.isPlaying]);
  
  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (playerState.isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('Play failed:', error);
        setError('Não foi possível reproduzir o vídeo.');
      });
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = newVolume[0];
    video.muted = newVolume[0] === 0;
  };
  
  // Handle seeking
  const handleSeek = (newTime: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = newTime[0];
  };
  
  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen mode:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Update fullscreen state when it changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setPlayerState(prev => ({
        ...prev,
        isFullScreen: !!document.fullscreenElement
      }));
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Skip forward/backward
  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black w-full overflow-hidden group",
        isLoading ? "animate-pulse" : "",
        className
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
        onClick={togglePlay}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-10">
          <div className="flex flex-col items-center">
            <Loader className="w-10 h-10 text-primary animate-spin mb-2" />
            <p className="text-white text-sm">Carregando...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20">
          <div className="bg-background border border-destructive rounded-md p-4 max-w-md text-center">
            <p className="text-white font-medium mb-2">Erro de Reprodução</p>
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            <Button 
              variant="destructive" 
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}
      
      {/* Video controls */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div className="w-full mb-2 cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          const video = videoRef.current;
          if (video) {
            video.currentTime = pos * video.duration;
          }
        }}>
          <Progress value={(playerState.currentTime / playerState.duration) * 100 || 0} className="h-1 bg-dark-100" />
        </div>
        
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-primary hover:bg-transparent" 
              onClick={togglePlay}
            >
              {playerState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-primary hover:bg-transparent" 
              onClick={() => skipTime(-10)}
            >
              <SkipBack size={18} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-primary hover:bg-transparent" 
              onClick={() => skipTime(10)}
            >
              <SkipForward size={18} />
            </Button>
            
            <div className="flex items-center space-x-2 group relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-primary hover:bg-transparent" 
                onClick={toggleMute}
              >
                {playerState.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
              
              <div className="w-20 hidden group-hover:block absolute bottom-10 left-0 p-2 bg-dark-100 rounded-md">
                <Slider
                  value={[playerState.isMuted ? 0 : playerState.volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            </div>
            
            <span className="text-white text-xs hidden sm:inline-block">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
            </span>
          </div>
          
          {/* Right controls */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-primary hover:bg-transparent" 
              onClick={toggleFullscreen}
            >
              {playerState.isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </Button>
            
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-primary hover:bg-transparent" 
                onClick={onClose}
              >
                <X size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Video info (for normal player, not modal) */}
      {!onClose && title && (
        <div className="p-4 bg-dark-200">
          <h2 className="text-white text-xl font-medium mb-1">{title}</h2>
          {subtitle && <p className="text-text-tertiary text-sm mb-2">{subtitle}</p>}
          {description && <p className="text-text-secondary text-sm">{description}</p>}
        </div>
      )}
    </div>
  );
}
