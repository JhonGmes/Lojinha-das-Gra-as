import React, { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { uploadImage, getOrders, updateOrderStatus } from '../services/supabase';
import { Product, Order } from '../types';

const Admin: React.FC = () => {
  const { products, updateProduct, addProduct, deleteProduct, isUsingSupabase, loading: productsLoading } = useProducts();
  const { signOut, user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'products'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    promoPrice: 0,
    category: 'tercos',
    description: '',
    image: 'https://images.unsplash.com/photo-1621323386999-635235332df6?q=80&w=1000&auto=format&fit=crop',
    features: [],
    stock: 10,
    active: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    document.title = "Painel Interno | Lojinhas das Graças";
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const data = await getOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  // --- ACTIONS ---

  const handleUpdate = async (id: string, field: keyof Product, value: any) => {
    // Optimistic update handled by context usually, but we await for safety
    await updateProduct(id, { [field]: value });
  };

  const handleCreate = async () => {
    if(!newProduct.name || !newProduct.price) return;
    setIsCreating(true);
    await addProduct(newProduct);
    setIsCreating(false);
    setNewProduct({
      name: '',
      price: 0,
      promoPrice: 0,
      category: 'tercos',
      description: '',
      image: 'https://images.unsplash.com/photo-1621323386999-635235332df6?q=80&w=1000&auto=format&fit=crop',
      features: [],
      stock: 10,
      active: true
    });
    alert("Produto criado com sucesso!");
    setActiveTab('inventory'); // Switch to inventory to see it
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean, productId?: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImg(true);
    try {
        const file = e.target.files[0];
        const publicUrl = await uploadImage(file);
        
        if (isNew) {
            setNewProduct(prev => ({ ...prev, image: publicUrl }));
        } else if (productId) {
            await updateProduct(productId, { image: publicUrl });
        }
    } catch (error) {
        alert("Erro no upload da imagem");
        console.error(error);
    } finally {
        setUploadingImg(false);
    }
  };

  // --- STATS CALCULATION ---
  const today = new Date().toDateString();
  const salesToday = orders
    .filter(o => new Date(o.created_at).toDateString() === today)
    .reduce((acc, o) => acc + o.total, 0);
  
  const salesMonth = orders
    .filter(o => {
        const d = new Date(o.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, o) => acc + o.total, 0);

  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const promoCount = products.filter(p => p.promoPrice && p.promoPrice > 0 && p.active).length;

  // --- COMPONENTS ---

  const SidebarItem = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === id ? 'bg-brand-800 text-white border-l-4 border-brand-500' : 'text-brand-200 hover:bg-brand-800/50 hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-brand-50 dark:bg-gray-900 overflow-hidden font-sans">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-64 bg-brand-900 flex-col shadow-xl z-20">
        <div className="p-6 border-b border-brand-800 flex items-center gap-3">
           <div className="w-10 h-10 bg-brand-500 rounded flex items-center justify-center text-white font-black text-lg shadow-lg">LG</div>
           <div>
             <h1 className="font-display font-black text-white text-lg tracking-tight leading-none">LOJINHAS</h1>
             <span className="text-[10px] text-brand-300 uppercase tracking-widest">Painel Interno</span>
           </div>
        </div>
        
        <nav className="flex-1 py-6 space-y-1">
          <SidebarItem id="dashboard" label="Resumo" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
          <SidebarItem id="inventory" label="Estoque" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
          <SidebarItem id="sales" label="Vendas" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l4 4a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" /></svg>} />
          <SidebarItem id="products" label="Cadastrar" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} />
        </nav>

        <div className="p-4 border-t border-brand-800 bg-brand-950/30">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-xs">{user?.email?.charAt(0).toUpperCase()}</div>
              <div className="overflow-hidden">
                  <p className="text-white text-xs font-bold truncate">{user?.email}</p>
                  <p className="text-brand-400 text-[10px] truncate">{isUsingSupabase ? 'Online' : 'Modo Local'}</p>
              </div>
           </div>
           <button onClick={signOut} className="w-full bg-brand-800 hover:bg-red-600 text-white text-xs font-bold uppercase py-2 rounded transition-colors">Sair</button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 w-full bg-brand-900 text-white z-30 px-4 py-3 flex justify-between items-center shadow-md">
         <span className="font-display font-black tracking-tight">LOJINHAS<span className="text-brand-400">.GRAÇAS</span></span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
         </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="absolute right-0 top-0 h-full w-64 bg-brand-900 shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end mb-4"><button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2">&times;</button></div>
                  <nav className="space-y-2">
                    <SidebarItem id="dashboard" label="Resumo" icon={<span/>} />
                    <SidebarItem id="inventory" label="Estoque" icon={<span/>} />
                    <SidebarItem id="sales" label="Vendas" icon={<span/>} />
                    <SidebarItem id="products" label="Cadastrar Produto" icon={<span/>} />
                  </nav>
                  <div className="mt-auto pt-4 border-t border-brand-800">
                      <button onClick={signOut} className="w-full bg-red-600 text-white text-xs font-bold uppercase py-3 rounded">Sair</button>
                  </div>
              </div>
          </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-10 px-4 md:px-8 bg-brand-50 dark:bg-gray-900 transition-colors">
        
        {/* --- DASHBOARD VIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto py-8 animate-fade-in">
             <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Resumo da Loja</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vendas Hoje</h3>
                     <p className="text-3xl font-black text-brand-600 dark:text-brand-400">R$ {salesToday.toFixed(2)}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vendas Mês</h3>
                     <p className="text-3xl font-black text-gray-900 dark:text-white">R$ {salesMonth.toFixed(2)}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Estoque Baixo</h3>
                     <p className="text-3xl font-black text-orange-500">{lowStockCount}</p>
                     <p className="text-[10px] text-gray-400 uppercase mt-1">Produtos críticos</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Em Promoção</h3>
                     <p className="text-3xl font-black text-green-500">{promoCount}</p>
                     <p className="text-[10px] text-gray-400 uppercase mt-1">Ofertas ativas</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-wide mb-4">Últimas Vendas</h3>
                     <div className="space-y-4">
                         {orders.slice(0, 5).map(o => (
                             <div key={o.id} className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0">
                                 <div>
                                     <p className="font-bold text-sm text-gray-800 dark:text-white">{o.customer_name}</p>
                                     <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p>
                                 </div>
                                 <div className="text-right">
                                     <p className="font-bold text-brand-600 dark:text-brand-400 text-sm">R$ {o.total.toFixed(2)}</p>
                                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                        o.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                        o.status === 'delivered' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                     }`}>{o.status}</span>
                                 </div>
                             </div>
                         ))}
                         {orders.length === 0 && <p className="text-sm text-gray-500">Nenhuma venda recente.</p>}
                     </div>
                 </div>
                 <div className="bg-brand-100 dark:bg-gray-800 p-6 rounded-lg border border-brand-200 dark:border-gray-700 flex flex-col justify-center items-center text-center">
                     <div className="w-16 h-16 bg-brand-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     </div>
                     <h3 className="font-black text-brand-900 dark:text-white text-lg mb-2">Dica do Dia</h3>
                     <p className="text-sm text-brand-800 dark:text-gray-300 max-w-sm">
                         Fotos de alta qualidade aumentam a conversão em até 40%. Use a aba <strong>Estoque</strong> para atualizar as imagens dos seus produtos.
                     </p>
                 </div>
             </div>
          </div>
        )}

        {/* --- INVENTORY VIEW (Mini ERP) --- */}
        {activeTab === 'inventory' && (
           <div className="max-w-6xl mx-auto py-8 animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Estoque & Produtos</h2>
                  <button onClick={() => setActiveTab('products')} className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs uppercase px-4 py-3 rounded shadow-lg transition-transform hover:-translate-y-1">
                      + Novo Produto
                  </button>
              </div>

              <div className="grid gap-4">
                 {/* Header Row (Desktop) */}
                 <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1">Foto</div>
                    <div className="col-span-4">Produto</div>
                    <div className="col-span-2">Preço</div>
                    <div className="col-span-2">Estoque</div>
                    <div className="col-span-2 text-right">Ações</div>
                 </div>

                 {products.map(p => (
                     <div key={p.id} className={`bg-white dark:bg-gray-800 border ${p.active ? 'border-gray-200 dark:border-gray-700' : 'border-red-100 dark:border-red-900/40 opacity-80'} rounded-lg p-4 shadow-sm flex flex-col md:grid md:grid-cols-12 gap-4 items-center`}>
                         
                         {/* Photo */}
                         <div className="col-span-1 relative group w-16 h-16 md:w-full md:h-16 flex-shrink-0">
                             <img src={p.image} className="w-full h-full object-cover rounded bg-gray-100" />
                             {isUsingSupabase && (
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity rounded text-white text-[8px] font-bold uppercase text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Trocar
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false, p.id)} />
                                </label>
                             )}
                         </div>

                         {/* Details */}
                         <div className="col-span-4 w-full">
                             <input 
                                value={p.name}
                                onChange={(e) => handleUpdate(p.id, "name", e.target.value)}
                                className="w-full font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 focus:border-brand-500 outline-none transition-colors mb-1"
                             />
                             <select 
                                value={p.category}
                                onChange={(e) => handleUpdate(p.id, "category", e.target.value)}
                                className="text-xs text-gray-500 bg-transparent outline-none cursor-pointer"
                             >
                                 <option value="tercos">Terços</option>
                                 <option value="imagens">Imagens</option>
                                 <option value="biblias">Bíblias</option>
                             </select>
                         </div>

                         {/* Pricing */}
                         <div className="col-span-2 w-full flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-gray-400 w-8">Preço</span>
                                 <input 
                                     type="number" 
                                     value={p.price}
                                     onChange={(e) => handleUpdate(p.id, "price", parseFloat(e.target.value))}
                                     className="w-20 text-sm font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white"
                                 />
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-brand-500 font-bold w-8">Promo</span>
                                 <input 
                                     type="number" 
                                     placeholder="0.00"
                                     value={p.promoPrice || ''}
                                     onChange={(e) => handleUpdate(p.id, "promoPrice", parseFloat(e.target.value))}
                                     className="w-20 text-sm font-bold text-brand-600 dark:text-brand-400 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none"
                                 />
                             </div>
                         </div>

                         {/* Stock */}
                         <div className="col-span-2 w-full">
                             <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 w-max">
                                 <button onClick={() => handleUpdate(p.id, "stock", Math.max(0, p.stock - 1))} className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">-</button>
                                 <input 
                                     type="number"
                                     value={p.stock}
                                     onChange={(e) => handleUpdate(p.id, "stock", parseInt(e.target.value))}
                                     className={`w-12 text-center text-sm font-bold bg-transparent outline-none ${p.stock < 5 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
                                 />
                                 <button onClick={() => handleUpdate(p.id, "stock", p.stock + 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">+</button>
                             </div>
                         </div>

                         {/* Actions */}
                         <div className="col-span-3 w-full flex items-center justify-between md:justify-end gap-3">
                              <button 
                                onClick={() => handleUpdate(p.id, "active", !p.active)}
                                className={`flex-1 md:flex-none px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${p.active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-200 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}
                              >
                                  {p.active ? 'Ativo' : 'Pausado'}
                              </button>
                              <button 
                                onClick={() => window.confirm("Excluir definitivamente?") && deleteProduct(p.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Excluir"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                         </div>
                     </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- SALES VIEW --- */}
        {activeTab === 'sales' && (
            <div className="max-w-6xl mx-auto py-8 animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Histórico de Vendas</h2>
                  <button onClick={fetchOrders} className="text-xs font-bold text-brand-600 underline">Atualizar Lista</button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Itens</th>
                                    <th className="px-6 py-4">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => {
                                                    updateOrderStatus(order.id, e.target.value);
                                                    setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: e.target.value as any} : o));
                                                }}
                                                className={`text-[10px] font-bold uppercase py-1 px-2 rounded border-none outline-none cursor-pointer ${
                                                    order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                                    order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}
                                            >
                                                <option value="pending">Pendente</option>
                                                <option value="paid">Pago</option>
                                                <option value="delivered">Entregue</option>
                                                <option value="cancelled">Cancelado</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(order.created_at).toLocaleDateString('pt-BR')} <br/>
                                            <span className="text-[10px]">{new Date(order.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customer_name}</p>
                                            {order.notes && <p className="text-[10px] text-gray-400 truncate max-w-[150px]" title={order.notes}>{order.notes}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {order.items.map((item, idx) => (
                                                    <span key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                                                        <span className="font-bold">{item.quantity}x</span> {item.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-brand-600 dark:text-brand-400">
                                            R$ {order.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">Nenhuma venda registrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- ADD PRODUCT VIEW --- */}
        {activeTab === 'products' && (
            <div className="max-w-4xl mx-auto py-8 animate-fade-in">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Cadastrar Produto</h2>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome do Produto</label>
                                <input 
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm outline-none focus:border-brand-500 dark:text-white"
                                    placeholder="Ex: Terço de Madeira"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preço R$</label>
                                    <input 
                                        type="number"
                                        value={newProduct.price || ''}
                                        onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm outline-none focus:border-brand-500 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Estoque</label>
                                    <input 
                                        type="number"
                                        value={newProduct.stock}
                                        onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm outline-none focus:border-brand-500 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoria</label>
                                <select 
                                    value={newProduct.category}
                                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm outline-none focus:border-brand-500 dark:text-white"
                                >
                                    <option value="tercos">Terços</option>
                                    <option value="imagens">Imagens</option>
                                    <option value="biblias">Bíblias</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
                                <textarea 
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm outline-none focus:border-brand-500 dark:text-white h-32 resize-none"
                                    placeholder="Descreva o produto..."
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Imagem</label>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                {newProduct.image ? (
                                    <>
                                        <img src={newProduct.image} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white font-bold uppercase text-xs">Alterar Imagem</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-gray-400 text-xs">Clique para fazer upload</span>
                                    </div>
                                )}
                                
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, true)}
                                    disabled={!isUsingSupabase}
                                />
                                {!isUsingSupabase && !newProduct.image && (
                                     <div className="absolute bottom-2 text-[10px] text-red-500 bg-white px-2 rounded">Modo Local: Upload desativado</div>
                                )}
                            </div>
                            
                            {!isUsingSupabase && (
                                <input 
                                    className="mt-4 w-full p-2 text-xs border border-gray-200 rounded"
                                    placeholder="Ou cole uma URL de imagem aqui"
                                    value={newProduct.image}
                                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                                />
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <button 
                            onClick={handleCreate}
                            disabled={isCreating || uploadingImg}
                            className="bg-brand-600 text-white font-bold text-sm py-3 px-8 rounded uppercase tracking-widest hover:bg-brand-700 disabled:opacity-50 transition-transform active:scale-95"
                        >
                            {isCreating ? 'Salvando...' : 'Criar Produto'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
      </main>
    </div>
  );
};

export default Admin;