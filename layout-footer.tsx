import { Link } from 'wouter';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube 
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-300 py-8 px-4 mt-8">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <span className="text-primary text-2xl font-bold font-heading mr-1">Stream</span>
              <span className="text-white text-2xl font-bold font-heading">Flix</span>
            </Link>
            <p className="text-text-tertiary mt-3 max-w-md">
              A sua plataforma de streaming com os melhores filmes, séries e canais ao vivo. Assista quando e onde quiser.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-medium text-lg mb-4">Navegação</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-text-tertiary hover:text-white">
                    Início
                  </Link>
                </li>
                <li>
                  <Link href="/movies" className="text-text-tertiary hover:text-white">
                    Filmes
                  </Link>
                </li>
                <li>
                  <Link href="/series" className="text-text-tertiary hover:text-white">
                    Séries
                  </Link>
                </li>
                <li>
                  <Link href="/channels" className="text-text-tertiary hover:text-white">
                    Canais ao Vivo
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium text-lg mb-4">Suporte</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-text-tertiary hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-text-tertiary hover:text-white">Contato</a></li>
                <li><a href="#" className="text-text-tertiary hover:text-white">Ajuda</a></li>
                <li><a href="#" className="text-text-tertiary hover:text-white">Reportar Problema</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-text-tertiary hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="text-text-tertiary hover:text-white">Privacidade</a></li>
                <li><a href="#" className="text-text-tertiary hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-dark-100 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-tertiary text-sm">© {new Date().getFullYear()} StreamFlix. Todos os direitos reservados.</p>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-text-tertiary hover:text-white">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-text-tertiary hover:text-white">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-text-tertiary hover:text-white">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-text-tertiary hover:text-white">
              <Youtube size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
