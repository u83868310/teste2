import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Input } from './ui-input';
import { Button } from './ui-button';
import { Avatar, AvatarFallback } from './ui-avatar';
import { Separator } from './ui-separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui-dropdown-menu';
import { 
  Search, Menu, ChevronDown, 
  UserCircle, Settings, HelpCircle, LogOut 
} from 'lucide-react';
import { useIsMobile } from './use-mobile';

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
}

export function Header({ onSearch, searchTerm = '' }: HeaderProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch && onSearch(e.target.value);
  };
  
  // Toggle search on mobile
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };
  
  return (
    <header className="bg-dark-300 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary text-3xl font-bold font-heading mr-1">Stream</span>
              <span className="text-white text-3xl font-bold font-heading">Flix</span>
            </Link>
          </div>
          
          {/* Main Navigation - Desktop */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-white'} hover:text-primary font-medium`}>
              Início
            </Link>
            <Link href="/movies" className={`${location === '/movies' ? 'text-primary' : 'text-text-secondary'} hover:text-primary font-medium`}>
              Filmes
            </Link>
            <Link href="/series" className={`${location === '/series' ? 'text-primary' : 'text-text-secondary'} hover:text-primary font-medium`}>
              Séries
            </Link>
            <Link href="/channels" className={`${location === '/channels' ? 'text-primary' : 'text-text-secondary'} hover:text-primary font-medium`}>
              Canais ao Vivo
            </Link>
          </nav>
          
          {/* Search & User Menu */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            <div className="relative hidden md:block">
              <Input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={handleSearchChange}
                className="bg-dark-100 rounded-full py-2 pl-10 pr-4 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search className="absolute left-3 top-2.5 text-text-tertiary h-4 w-4" />
            </div>
            
            {/* Search Icon - Mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white hover:text-primary"
              onClick={toggleSearch}
            >
              <Search size={20} />
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center focus:outline-none p-1">
                  <Avatar className="w-8 h-8 bg-secondary text-white">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="ml-1 text-white h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48 bg-dark-100">
                <DropdownMenuItem className="flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Ajuda</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-dark-200" />
                <DropdownMenuItem className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-dark-200 text-white border-dark-100">
                <div className="flex flex-col space-y-4 mt-6">
                  <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-white'} hover:text-primary font-medium text-lg`}>
                    Início
                  </Link>
                  <Link href="/movies" className={`${location === '/movies' ? 'text-primary' : 'text-text-secondary'} hover:text-primary font-medium text-lg`}>
                    Filmes
                  </Link>
                  <Link href="/series" className={`${location === '/series' ? 'text-primary' : 'text-text-secondary'} hover:text-primary font-medium text-lg`}>
                    Séries
                  </Link>
                  <Link href="/channels" className={`${location === '/channels' ? 'text-primary' : 'text-text-secondary'} hover:text-primary font-medium text-lg`}>
                    Canais ao Vivo
                  </Link>
                  <Separator className="bg-dark-100" />
                  <button className="text-text-secondary hover:text-primary font-medium text-lg text-left">
                    Meu Perfil
                  </button>
                  <button className="text-text-secondary hover:text-primary font-medium text-lg text-left">
                    Configurações
                  </button>
                  <button className="text-text-secondary hover:text-primary font-medium text-lg text-left">
                    Ajuda
                  </button>
                  <button className="text-text-secondary hover:text-primary font-medium text-lg text-left">
                    Sair
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Mobile Search (conditionally rendered) */}
        {isMobile && isSearchExpanded && (
          <div className="mt-3 pb-2">
            <Input
              type="text"
              placeholder="Buscar filmes, séries ou canais"
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-dark-100 rounded-md py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        )}
      </div>
    </header>
  );
}
