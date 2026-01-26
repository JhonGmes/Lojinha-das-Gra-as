import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import CategoryMenu from '../components/CategoryMenu';
import { useSearch } from '../context/SearchContext';
import { useProducts } from '../context/ProductContext';

const Home: React.FC = () => {
  const { search } = useSearch();
  const { products, loading } = useProducts();

  useEffect(() => {
    document.title = "Lojinhas das Graças | Início";
  }, []);

  const filteredProducts = products.filter(p => 
    p.active !== false && // Hide paused products
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-20">
      {/* Hero (Only show if not searching) */}
      {!search && (
        <div className="relative h-[500px] bg-brand-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-12 group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518175510651-7cb46c05a109?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-[3s] group-hover:scale-105 opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
          <div className="container mx-auto px-6 relative z-10 text-center text-white">
            <span className="inline-block border border-white/30 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.3em] uppercase mb-6 shadow-lg">Fé & Devoção</span>
            <h1 className="font-display font-black text-4xl md:text-6xl mb-6 tracking-tight leading-none text-brand-50 drop-shadow-lg">
              LOJINHAS DAS <br/><span className="text-brand-400">GRAÇAS</span>
            </h1>
            <p className="text-base md:text-lg text-gray-200 mb-10 max-w-lg mx-auto font-medium leading-relaxed drop-shadow-md">
              Encontre artigos religiosos selecionados para fortalecer sua fé e presentear quem você ama.
            </p>
            <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="bg-brand-600 hover:bg-brand-500 text-white px-10 py-4 font-bold uppercase tracking-widest text-xs transition-all transform hover:-translate-y-1 shadow-xl rounded-sm">
              Ver Produtos
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div id="products" className="container mx-auto px-6 max-w-7xl pt-10">
        <div className="flex flex-col items-center mb-10">
          <h2 className="font-display font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tight mb-2">
            {search ? `Resultados para "${search}"` : 'Nossa Coleção'}
          </h2>
          <div className="w-12 h-1 bg-brand-500 rounded-full mb-8"></div>
          
          {!search && <CategoryMenu />}
        </div>

        {loading ? (
             <div className="flex justify-center py-20">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
             </div>
        ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-12">
            {filteredProducts.map(product => (
                <div key={product.id} className="group flex flex-col bg-white dark:bg-gray-800 rounded-lg hover:shadow-xl dark:shadow-gray-900/50 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transform hover:-translate-y-1">
                <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-t-lg">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    {product.promoPrice && (
                        <div className="absolute top-3 right-3 z-10">
                             <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-sm">Promoção</span>
                        </div>
                    )}
                    <div className="absolute top-3 left-3"><span className="bg-white/95 dark:bg-black/80 backdrop-blur text-brand-900 dark:text-brand-100 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-sm">{CATEGORIES.find(c => c.id === product.category)?.label || product.category}</span></div>
                    
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button className="w-full bg-brand-600 text-white font-bold text-xs py-3 uppercase tracking-widest hover:bg-brand-700 transition-colors shadow-lg rounded-sm">Ver Detalhes</button>
                    </div>
                </Link>
                <div className="p-4 md:p-5 text-center flex-1 flex flex-col justify-between">
                    <div>
                         <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-2 line-clamp-2 min-h-[2.5em] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"><Link to={`/product/${product.id}`}>{product.name}</Link></h3>
                         <div className="flex flex-col items-center justify-center gap-1 mb-2">
                             {product.promoPrice ? (
                                <>
                                    <span className="text-xs text-gray-400 line-through">De R$ {product.price.toFixed(2)}</span>
                                    <span className="font-display font-black text-red-600 dark:text-red-400 text-lg md:text-xl">Por R$ {product.promoPrice.toFixed(2)}</span>
                                </>
                             ) : (
                                <span className="font-display font-black text-brand-600 dark:text-brand-400 text-lg md:text-xl">R$ {product.price.toFixed(2)}</span>
                             )}
                         </div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide block bg-gray-50 dark:bg-gray-700/50 py-1 rounded">3x de R$ {((product.promoPrice || product.price) / 3).toFixed(2)}</span>
                </div>
                </div>
            ))}
            </div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum produto encontrado.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Home;