import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { trackEvent, createOrder } from '../services/supabase';
import { STORE_PHONE_NUMBER } from '../constants';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { products, updateProduct, refreshProducts } = useProducts(); // Acesso ao estoque real
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação de Estoque em Tempo Real
  const stockValidation = items.map(item => {
    const liveProduct = products.find(p => p.id === item.id);
    const availableStock = liveProduct ? liveProduct.stock : 0;
    const hasStock = availableStock >= item.quantity;
    return { ...item, availableStock, hasStock };
  });

  const hasStockIssues = stockValidation.some(i => !i.hasStock);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Sua sacola está vazia</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">Navegue pelas nossas coleções e encontre produtos incríveis.</p>
        <Link to="/" className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded font-bold uppercase tracking-widest text-xs transition-colors shadow-lg">
          Começar a Comprar
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!customerName.trim()) {
        alert("Por favor, digite seu nome para identificarmos o pedido.");
        return;
    }

    if (hasStockIssues) {
        alert("Alguns itens do seu carrinho ultrapassam o estoque disponível. Por favor, ajuste as quantidades.");
        return;
    }

    setIsSubmitting(true);
    trackEvent('checkout_start', undefined, { total, itemsCount: items.length });

    try {
        // 1. Salvar Pedido (Histórico)
        await createOrder({
            customer_name: customerName,
            total: total,
            status: 'pending',
            items: items,
            notes: notes
        });

        // 2. Abater Estoque (Core Logic)
        for (const item of items) {
            const liveProduct = products.find(p => p.id === item.id);
            if (liveProduct) {
                const newStock = Math.max(0, liveProduct.stock - item.quantity);
                await updateProduct(item.id, { stock: newStock });
            }
        }
        
        // 3. Atualizar contexto local para refletir novo estoque na UI imediatamente
        await refreshProducts();

        // 4. Formatar Mensagem WhatsApp
        let message = `*🛍️ Novo Pedido - Lojinhas das Graças*\n\n`;
        message += `*Cliente:* ${customerName}\n\n`;
        
        items.forEach(item => {
        const price = item.promoPrice || item.price;
        message += `• ${item.quantity}x ${item.name} - R$ ${price.toFixed(2)}\n`;
        });
        
        message += `\n*Total:* R$ ${total.toFixed(2)}\n`;
        
        if (notes) message += `\n*Obs:* ${notes}\n`;
        
        message += `\nPagamento via Pix a combinar.\n`;
        message += `Aguardo confirmação! 🙏`;

        const url = `https://wa.me/${STORE_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        
        trackEvent('checkout_complete', undefined, { total });
        clearCart();
        
        // 5. Redirecionar
        window.open(url, '_blank');

    } catch (error) {
        console.error("Checkout error:", error);
        alert("Houve um erro ao processar o pedido. Tente novamente.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl animate-fade-in">
      <h1 className="font-display font-black text-3xl text-gray-900 dark:text-white mb-10 uppercase tracking-tight">Minha Sacola</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Item List */}
        <div className="lg:col-span-2 space-y-6">
          {stockValidation.map(item => {
             const finalPrice = item.promoPrice || item.price;
             return (
                <div key={item.id} className={`flex gap-6 py-6 border-b border-gray-100 dark:border-gray-800 last:border-0 ${!item.hasStock ? 'opacity-80' : ''}`}>
                    <div className="w-24 h-32 bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 rounded-sm relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        {!item.hasStock && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center text-center p-1">
                                <span className="text-[10px] font-bold text-red-600 uppercase leading-tight">Sem Estoque Suficiente</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-1">{item.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.category}</p>
                            <div className="flex gap-2 items-center">
                                {item.promoPrice && (
                                    <span className="text-xs text-gray-400 line-through">R$ {item.price.toFixed(2)}</span>
                                )}
                                <div className="font-bold text-brand-600 dark:text-brand-400">R$ {finalPrice.toFixed(2)}</div>
                            </div>
                            
                            {!item.hasStock && (
                                <p className="text-xs text-red-500 font-bold mt-2">
                                    Disponível: {item.availableStock} unid.
                                </p>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                            <div className={`flex items-center border rounded-sm ${!item.hasStock ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900' : 'border-gray-200 dark:border-gray-700'}`}>
                                <button 
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                                >-</button>
                                <span className={`px-2 text-xs font-bold ${!item.hasStock ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                                    disabled={item.quantity >= item.availableStock}
                                >+</button>
                            </div>
                            <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-wider"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
             );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg sticky top-28 border border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-xs mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">Resumo do Pedido</h2>
                
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Subtotal</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Frete</span>
                        <span className="text-green-600 font-bold uppercase text-xs">Grátis</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl text-gray-900 dark:text-white pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                        <span>Total</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 text-sm outline-none focus:border-brand-500 dark:text-white transition-colors rounded-sm"
                      placeholder="Seu Nome Completo *"
                    />
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 text-sm outline-none focus:border-brand-500 dark:text-white transition-colors resize-none h-20 rounded-sm"
                      placeholder="Observações (opcional)"
                    />
                </div>
                
                {hasStockIssues && (
                    <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded text-xs mb-4">
                        <strong>Atenção:</strong> Você possui itens com quantidade superior ao nosso estoque disponível. Ajuste as quantidades para prosseguir.
                    </div>
                )}
                
                <button 
                onClick={handleCheckout}
                disabled={isSubmitting || hasStockIssues}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded font-bold uppercase tracking-widest text-sm shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Gerando Pedido...' : (
                        <>
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Finalizar no WhatsApp
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;