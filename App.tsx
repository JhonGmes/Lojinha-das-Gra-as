import React, { ReactNode } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { SearchProvider, useSearch } from './context/SearchContext';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import CategoryPage from './pages/CategoryPage';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ChatBot from './components/ChatBot';

const TopBar = () => (
  <div className="bg-gray-900 dark:bg-black text-brand-100 text-[10px] md:text-xs font-bold py-2 text-center tracking-widest uppercase transition-colors">
    ENVIAMOS PARA TODO O BRASIL • FRETE GRÁTIS ACIMA DE R$ 199,00
  </div>
);

const SearchBar = () => {
  const { search, setSearch } = useSearch();
  const navigate = useNavigate();

  return (
    <div className="relative w-full max-w-xs mx-4 hidden md:block">
      <input
        type="text"
        placeholder="Buscar produtos..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (window.location.hash !== '#/') {
            navigate('/');
          }
        }}
        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-full pl-4 pr-10 py-2 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-gray-400"
      />
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
};

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
      title={isDark ? "Modo Claro" : "Modo Escuro"}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      )}
    </button>
  );
}

const Navbar = () => {
  const { itemCount } = useCart();
  return (
    <>
      <TopBar />
      <nav className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex flex-col group items-start flex-shrink-0">
            <span className="font-display font-black text-2xl tracking-tighter leading-none text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
              LOJINHAS<span className="text-brand-600 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">.GRAÇAS</span>
            </span>
            <span className="text-[10px] font-medium text-gray-400 tracking-[0.3em] uppercase ml-0.5">Artigos Religiosos</span>
          </Link>

          <SearchBar />

          <div className="hidden lg:flex gap-6 text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-widest flex-shrink-0">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative group">
              Início
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/category/tercos" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative group">
              Terços
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/category/imagens" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative group">
              Imagens
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/category/biblias" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative group">
              Bíblias
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all group-hover:w-full"></span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <ThemeToggle />
             <Link to="/admin" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden md:block" title="Área Admin">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </Link>
             <Link to="/cart" className="relative p-2 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-full transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {itemCount > 0 && <span className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">{itemCount}</span>}
            </Link>
          </div>
        </div>
        {/* Mobile Search */}
        <div className="md:hidden px-6 pb-4">
             <SearchBar />
        </div>
      </nav>
    </>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 dark:bg-black text-brand-100 py-12 border-t border-gray-800 transition-colors">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h4 className="font-display font-black text-xl mb-4 tracking-tighter text-white">LOJINHAS<span className="text-brand-500">.GRAÇAS</span></h4>
          <p className="text-gray-400 text-sm leading-relaxed">
            Artigos religiosos selecionados com carinho para fortalecer sua fé.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-4 text-white">Navegação</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/" className="hover:text-brand-500 transition-colors">Início</Link></li>
            <li><Link to="/category/tercos" className="hover:text-brand-500 transition-colors">Terços</Link></li>
            <li><Link to="/category/imagens" className="hover:text-brand-500 transition-colors">Imagens</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest mb-4 text-white">Atendimento</h4>
          <p className="text-gray-400 text-sm">Segunda a Sexta: 9h às 18h</p>
          <p className="text-gray-400 text-sm">contato@lojinhadasgracas.com.br</p>
        </div>
      </div>
      <div className="container mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-center">
        <p className="text-gray-600 text-xs">© 2024 Lojinhas das Graças. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: React.PropsWithChildren) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SearchProvider>
          <ProductProvider>
            <CartProvider>
              <HashRouter>
                <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-brand-200 selection:text-brand-900 transition-colors duration-300">
                  <Navbar />
                  <main className="flex-1 w-full relative">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/category/:slug" element={<CategoryPage />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/admin" element={
                          <ProtectedRoute>
                              <Admin />
                          </ProtectedRoute>
                      } />
                    </Routes>
                  </main>
                  <Footer />
                  <ChatBot />
                </div>
              </HashRouter>
            </CartProvider>
          </ProductProvider>
        </SearchProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;