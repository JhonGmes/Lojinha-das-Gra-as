import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import CategoryMenu from '../components/CategoryMenu';
import { useSearch } from '../context/SearchContext';
import { useProducts } from '../context/ProductContext';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { search } = useSearch();
  const { products, loading } = useProducts();

  const filtered = products.filter(
    (p) => p.active !== false && p.category === slug && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const title = CATEGORIES.find((c) => c.id === slug)?.label || "Categoria";

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-8 pb-20 animate-fade-in">
      <div className="flex flex-col items-center mb-10">
          <h2 className="font-display font-black text-3xl text-gray-900 dark:text-white uppercase tracking-tight mb-2">
            {search ? `Resultados em ${title}` : title}
          </h2>
          <div className="w-12 h-1 bg-brand-500 rounded-full mb-8"></div>
          
          <CategoryMenu />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {filtered.map(product => {
                const finalPrice = product.promoPrice || product.price;
                return (
                    <div key={product.id} className="group flex flex-col bg-white dark:bg-gray-800 rounded-lg hover:shadow-xl dark:shadow-gray-900/50 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transform hover:-translate-y-1">
                        <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-t-lg">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                        {product.promoPrice && (
                            <div className="absolute top-3 right-3 z-10">
                                <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-sm">Promo</span>
                            </div>
                        )}
                        <div className="absolute top-3 left-3"><span className="bg-white/95 dark:bg-black/80 backdrop-blur text-brand-900 dark:text-brand-100 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider shadow-sm rounded-sm">{CATEGORIES.find(c => c.id === product.category)?.label || product.category}</span></div>
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <button className="w-full bg-brand-600 text-white font-bold text-xs py-3 uppercase tracking-widest hover:bg-brand-700 transition-colors shadow-lg rounded-sm">Ver Detalhes</button>
                        </div>
                        </Link>
                        <div className="p-5 text-center">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-2 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"><Link to={`/product/${product.id}`}>{product.name}</Link></h3>
                        <div className="flex items-center justify-center gap-2 mb-2">
                             {product.promoPrice ? (
                                <>
                                    <span className="text-xs text-gray-400 line-through">R$ {product.price.toFixed(2)}</span>
                                    <span className="font-display font-black text-red-600 dark:text-red-400 text-xl">R$ {product.promoPrice.toFixed(2)}</span>
                                </>
                             ) : (
                                <span className="font-display font-black text-brand-600 dark:text-brand-400 text-xl">R$ {product.price.toFixed(2)}</span>
                             )}
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide block bg-gray-50 dark:bg-gray-700/50 py-1 rounded">3x de R$ {(finalPrice / 3).toFixed(2)} sem juros</span>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg">
             <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum produto encontrado nesta categoria com o termo "{search}".</p>
             <Link to="/" className="inline-block mt-4 text-brand-600 font-bold underline uppercase text-xs">Ver todos os produtos</Link>
          </div>
      )}
    </div>
  );
};

export default CategoryPage;