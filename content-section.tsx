import { useState, useRef } from 'react';
import { Link } from 'wouter';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './ui-button';
import { MediaCard } from '@/components/media/media-card';
import { type ContentSectionProps } from './types';

export function ContentSection({ 
  title, 
  type,
  mediaItems = [],
  isLoading = false,
  onItemClick
}: ContentSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  
  // Handle scroll indicators
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
  };
  
  // Scroll left
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };
  
  // Scroll right
  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };
  
  // Determine the correct "View All" link based on content type
  const viewAllLink = type ? `/${type}s` : '#';
  
  // Determine aspect ratio based on content type
  const aspectRatio = type === 'movie' ? 'portrait' : 'landscape';
  
  return (
    <section className="py-6 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-white">{title}</h2>
          {type && (
            <Link href={viewAllLink} className="text-text-tertiary hover:text-white text-sm flex items-center">
              Ver Todos <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          )}
        </div>
        
        {/* Content Slider with Navigation Buttons */}
        <div className="relative group">
          {/* Left Scroll Button */}
          {showLeftScroll && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-dark-300 bg-opacity-80 text-white rounded-full h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollLeft}
            >
              <ChevronLeft size={24} />
            </Button>
          )}
          
          {/* Content Slider */}
          <div 
            ref={scrollContainerRef}
            className="category-slider flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
            onScroll={handleScroll}
          >
            {isLoading ? (
              // Loading skeleton cards
              Array(6).fill(0).map((_, index) => (
                <MediaCard 
                  key={`loading-${index}`}
                  media={{ id: -1, title: '', streamUrl: '', type: type || 'movie', isFeatured: false }}
                  isLoading={true}
                  aspectRatio={aspectRatio}
                />
              ))
            ) : mediaItems.length > 0 ? (
              // Actual content cards
              mediaItems.map(item => (
                <MediaCard 
                  key={`media-${item.id}`}
                  media={item}
                  onClick={onItemClick}
                  aspectRatio={aspectRatio}
                />
              ))
            ) : (
              // Empty state
              <div className="flex-1 flex items-center justify-center h-40 bg-dark-200 rounded-lg">
                <p className="text-text-secondary text-sm">Nenhum conteúdo disponível</p>
              </div>
            )}
          </div>
          
          {/* Right Scroll Button */}
          {showRightScroll && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-dark-300 bg-opacity-80 text-white rounded-full h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={scrollRight}
            >
              <ChevronRight size={24} />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
