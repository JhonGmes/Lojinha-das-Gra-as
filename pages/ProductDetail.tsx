import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { analyzeProductWithThinking, editProductImage } from '../services/geminiService';
import { trackEvent } from '../services/supabase';
import { urlToBase64 } from '../utils/imageUtils';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, loading } = useProducts();
  const { addToCart } = useCart();

  const product = products.find(p => p.id === id);

  const [thinkingResult, setThinkingResult] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [qty, setQty] = useState(1);
  
  // Image Editing
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
        document.title = `${product.name} | Lojinhas das Graças`;
        trackEvent('view_product', product.id, { name: product.name });
    }
  }, [product]);

  if (loading) return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Carregando Produto...</p>
      </div>
  );

  if (!product || product.active === false) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
       <h2 className="font-display font-bold text-2xl mb-4 dark:text-white">Produto Indisponível</h2>
       <Link to="/" className="text-brand-600 underline font-bold uppercase text-sm tracking-widest">Voltar para Loja</Link>
    </div>
  );

  const handleAnalyze = async () => {
    setIsThinking(true);
    const result = await analyzeProductWithThinking(product);
    setThinkingResult(result);
    setIsThinking(false);
    trackEvent('ai_analyze', product.id);
  };

  const handleImageEdit = async () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    setEditError(null);
    try {
      const sourceUrl = editedImage || product.image; 
      const base64 = await urlToBase64(sourceUrl);
      const newImage = await editProductImage(base64, editPrompt);
      if (newImage) {
        setEditedImage(newImage);
        setEditPrompt('');
        trackEvent('ai_image_edit', product.id, { prompt: editPrompt });
      } else {
        setEditError("Não foi possível gerar a imagem.");
      }
    } catch (err: any) {
      setEditError("Erro ao processar imagem.");
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleAddToCart = () => {
    const itemToAdd = { ...product, price: product.promoPrice || product.price };
    addToCart(itemToAdd, qty);
    trackEvent('add_to_cart', product.id, { qty });
  };

  const finalPrice = product.promoPrice || product.price;
  const whatsappMessage = `Olá! Tenho interesse no *${product.name}* (Ref: ${product.id}). Preço: R$ ${finalPrice.toFixed(2)}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  const outOfStock = product.stock <= 0;

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Image (Main Focus) */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group shadow-lg">
            <img 
              src={editedImage || product.image} 
              alt={product.name} 
              className={`w-full h-full object-cover ${outOfStock ? 'grayscale opacity-70' : ''}`}
            />
            
            {product.promoPrice && (
                <div className="absolute top-6 left-6 z-10">
                    <span className="bg-red-600 text-white px-4 py-2 font-black uppercase tracking-widest text-sm shadow-lg transform -rotate-3 inline-block">Oferta Especial</span>
                </div>
            )}
            
            {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/70 text-white px-6 py-3 font-black uppercase tracking-widest text-xl transform -rotate-12 border-4 border-white">Esgotado</span>
                </div>
            )}
            
            {/* AI Floating Button */}
            <button 
                onClick={() => setShowEditModal(true)}
                className="absolute top-6 right-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-gray-900 dark:text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-brand-500 hover:text-white transition-all z-20 flex items-center gap-2 rounded-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Personalizar Foto
            </button>
            
            {editedImage && (
                <button 
                onClick={() => setEditedImage(null)}
                className="absolute top-16 right-6 bg-red-500 text-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-red-600 transition-colors z-20 rounded-sm"
                >
                Resetar
                </button>
            )}

            {/* AI Edit Inline Modal */}
            {showEditModal && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t-4 border-brand-500 animate-slideUp z-30 shadow-2xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Gemini Studio</span>
                        <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-red-500 text-xl leading-none">&times;</button>
                    </div>
                    <div className="flex gap-2">
                        <input 
                        type="text" 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder='Ex: "Colocar em um escritório luxuoso", "Adicionar luz do sol"'
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm outline-none focus:border-brand-500 dark:text-white transition-colors rounded-sm"
                        />
                        <button 
                        onClick={handleImageEdit}
                        disabled={isEditing || !editPrompt}
                        className="bg-brand-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-brand-600 disabled:opacity-50 transition-colors rounded-sm"
                        >
                        {isEditing ? 'Criando...' : 'Gerar'}
                        </button>
                    </div>
                    {editError && <p className="text-red-500 text-xs mt-2 font-medium">{editError}</p>}
                </div>
            )}
          </div>
        </div>

        {/* Right: Info & Conversion */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
           <div>
              <nav className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex gap-2">
                <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link> <span>/</span> 
                <span className="text-gray-900 dark:text-white">{product.category}</span>
              </nav>

              <h1 className="font-display font-black text-3xl md:text-4xl text-gray-900 dark:text-white mb-2 leading-tight uppercase">{product.name}</h1>
              <p className="text-gray-500 text-xs mb-6">Ref: {product.id.toString().toUpperCase()}</p>
              
              <div className="flex flex-col mb-8 p-6 bg-brand-50 dark:bg-gray-800 border border-brand-100 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="flex items-end gap-3 mb-1 flex-wrap">
                    {product.promoPrice ? (
                        <>
                             <span className="text-sm text-gray-400 line-through mb-1">R$ {product.price.toFixed(2)}</span>
                             <span className="font-display font-black text-4xl text-red-600 dark:text-red-400">R$ {finalPrice.toFixed(2)}</span>
                        </>
                    ) : (
                         <span className="font-display font-black text-4xl text-brand-600 dark:text-brand-400">R$ {finalPrice.toFixed(2)}</span>
                    )}
                </div>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-brand-800 dark:text-brand-300 font-medium">
                        em até <span className="text-gray-900 dark:text-white font-bold">3x de R$ {(finalPrice / 3).toFixed(2)}</span> sem juros
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${outOfStock ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>
                        {outOfStock ? 'Esgotado' : `Estoque: ${product.stock}`}
                    </span>
                </div>
              </div>
           </div>

           {/* Quantity and Actions */}
           <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Quantidade:</span>
                <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
                    <button 
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold disabled:opacity-50"
                        disabled={outOfStock}
                    >-</button>
                    <span className="px-4 font-bold text-gray-900 dark:text-white w-12 text-center">{qty}</span>
                    <button 
                        onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold disabled:opacity-50"
                        disabled={outOfStock || qty >= product.stock}
                    >+</button>
                </div>
              </div>

              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-4 px-6 rounded shadow-lg flex items-center justify-center gap-3 group transition-all transform ${outOfStock ? 'bg-gray-300 cursor-not-allowed text-gray-500 dark:bg-gray-700 dark:text-gray-400' : 'bg-[#25D366] hover:bg-[#128C7E] text-white shadow-green-200 hover:shadow-xl hover:-translate-y-1'}`}
                onClick={e => { if(outOfStock) e.preventDefault(); else trackEvent('click_whatsapp', product.id); }}
              >
                 <svg className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                 <span className="font-bold text-lg uppercase tracking-wider">Comprar no WhatsApp</span>
              </a>

              <button 
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="w-full bg-white dark:bg-transparent border-2 border-brand-900 dark:border-brand-400 text-brand-900 dark:text-brand-400 hover:bg-brand-900 hover:text-white dark:hover:bg-brand-400 dark:hover:text-gray-900 py-4 px-6 rounded font-bold text-sm uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {outOfStock ? 'Indisponível' : 'Adicionar à Sacola'}
              </button>
           </div>

           {/* Description & Features */}
           <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
             <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-widest mb-4">Detalhes do Produto</h3>
             <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">{product.description}</p>
             
             {product.features && product.features.length > 0 && (
                <ul className="space-y-2">
                {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wide">
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mr-3"></div>
                    {feature}
                    </li>
                ))}
                </ul>
             )}
           </div>

           {/* AI Analysis */}
           <div className="bg-white dark:bg-gray-800 border border-brand-100 dark:border-gray-700 p-6 rounded-lg relative overflow-hidden shadow-sm">
               <div className="absolute top-0 right-0 w-20 h-20 bg-brand-200 dark:bg-brand-900/40 rounded-full blur-2xl opacity-20"></div>
               
               <div className="flex items-center justify-between mb-3 relative z-10">
                   <h3 className="font-bold text-brand-900 dark:text-brand-100 text-xs uppercase tracking-widest flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                       Análise do Especialista
                   </h3>
                   {!thinkingResult && !isThinking && (
                        <button onClick={handleAnalyze} className="text-xs font-bold text-brand-700 dark:text-brand-400 underline hover:text-brand-900">
                            Por que vale a pena?
                        </button>
                   )}
               </div>

               {isThinking && (
                   <div className="flex items-center gap-2 text-xs text-brand-700 dark:text-brand-400 font-medium">
                       <span className="w-2 h-2 bg-brand-500 rounded-full animate-ping"></span>
                       Analisando especificações...
                   </div>
               )}

               {thinkingResult && (
                   <div className="text-sm text-brand-900/80 dark:text-brand-100/90 leading-relaxed whitespace-pre-line font-medium">
                       {thinkingResult}
                   </div>
               )}
           </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;