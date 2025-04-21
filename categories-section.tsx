import { useLocation } from 'wouter';
import { type Category } from './types';

interface CategoriesSectionProps {
  categories?: Category[];
  isLoading?: boolean;
  onSelectCategory?: (categoryId: number) => void;
}

const defaultIcons: Record<string, string> = {
  'Ação': 'ri-movie-2-line',
  'Terror': 'ri-ghost-line',
  'Comédia': 'ri-emotion-laugh-line',
  'Romance': 'ri-heart-line',
  'Sci-Fi': 'ri-space-ship-line',
  'Aventura': 'ri-map-pin-line',
};

export function CategoriesSection({ 
  categories = [], 
  isLoading = false,
  onSelectCategory 
}: CategoriesSectionProps) {
  const [, navigate] = useLocation();
  
  const handleCategoryClick = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category.id);
    } else {
      navigate(`/category/${category.id}`);
    }
  };
  
  if (isLoading) {
    return (
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-white mb-4">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-dark-200 rounded-lg p-4 animate-pulse">
                <div className="w-8 h-8 bg-dark-100 rounded-full mb-2"></div>
                <div className="h-4 bg-dark-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-6 px-4">
      <div className="container mx-auto">
        <h2 className="text-xl md:text-2xl font-heading font-bold text-white mb-4">Categorias</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.length > 0 ? (
            categories.map(category => {
              // Determine the background gradient (fallback to defaults if not provided)
              const bgClass = category.colorFrom && category.colorTo 
                ? `bg-gradient-to-r from-[${category.colorFrom}] to-[${category.colorTo}]`
                : `bg-gradient-to-r from-primary to-secondary`;
              
              // Get the icon or use default
              const iconClass = category.icon || defaultIcons[category.name] || 'ri-film-line';
              
              return (
                <div 
                  key={category.id}
                  className={`${bgClass} rounded-lg p-4 
                    hover:from-secondary hover:to-primary transition duration-300 
                    hover:cursor-pointer`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <i className={`${iconClass} text-2xl text-white mb-2 block`}></i>
                  <h3 className="text-white font-medium">{category.name}</h3>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-text-tertiary">Nenhuma categoria disponível</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
