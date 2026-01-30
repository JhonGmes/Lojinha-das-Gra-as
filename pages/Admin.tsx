import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { uploadImage, getOrders, updateOrderStatus } from '../services/supabase';
import { Product, Order } from '../types';

// --- CUSTOM SVG CHART COMPONENT (Zero Dependencies) ---
const SimpleAreaChart = ({ data }: { data: { label: string; value: number }[] }) => {
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400 text-xs">Sem dados suficientes</div>;

  const height = 200;
  const width = 600;
  const padding = 20;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - (d.value / maxValue) * (height - padding * 2) - padding;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

  return (
    <div className="w-full h-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid Lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e5e7eb" strokeDasharray="4" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e5e7eb" strokeDasharray="4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeDasharray="4" />
        
        {/* Area */}
        <polygon points={areaPoints} fill="url(#chartGradient)" />
        {/* Line */}
        <polyline points={polylinePoints} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Dots & Labels */}
        {data.map((d, i) => {
            const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
            const y = height - (d.value / maxValue) * (height - padding * 2) - padding;
            return (
                <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#fff" stroke="#d97706" strokeWidth="2" />
                    <text x={x} y={height - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.label}</text>
                    {d.value > 0 && <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#d97706">R${d.value}</text>}
                </g>
            );
        })}
      </svg>
    </div>
  );
};

const Admin: React.FC = () => {
  const { products, updateProduct, addProduct, deleteProduct, isUsingSupabase } = useProducts();
  const { signOut, user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'products'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form State
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    promoPrice: undefined,
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
    const data = await getOrders();
    setOrders(data);
  };

  // --- ACTIONS ---
  const handleUpdate = async (id: string, field: keyof Product, value: any) => {
    await updateProduct(id, { [field]: value });
  };

  const handleCreate = async () => {
    if(!newProduct.name || !newProduct.price) return;
    setIsCreating(true);
    await addProduct(newProduct);
    setIsCreating(false);
    setNewProduct({ ...newProduct, name: '', price: 0, stock: 10 });
    alert("Produto criado com sucesso!");
    setActiveTab('inventory');
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
    } finally {
        setUploadingImg(false);
    }
  };

  // --- DATA CALCULATIONS ---
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

  const lowStockProducts = products.filter(p => p.stock <= 5);
  const promoCount = products.filter(p => p.promoPrice && p.promoPrice > 0 && p.active).length;

  // Chart Data: Last 7 days
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const checkDate = d.toDateString();
        
        const total = orders
            .filter(o => new Date(o.created_at).toDateString() === checkDate)
            .reduce((acc, o) => acc + o.total, 0);
        
        data.push({ label: dateStr, value: total });
    }
    return data;
  }, [orders]);

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
      
      {/* SIDEBAR */}
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

      {/* MOBILE HEADER & MENU (Omitting code for brevity, same as previous step) */}
      <div className="md:hidden fixed top-0 w-full bg-brand-900 text-white z-30 px-4 py-3 flex justify-between items-center shadow-md">
         <span className="font-display font-black tracking-tight">LOJINHAS<span className="text-brand-400">.GRAÇAS</span></span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
         </button>
      </div>
      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="absolute right-0 top-0 h-full w-64 bg-brand-900 shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end mb-4"><button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2">&times;</button></div>
                  <nav className="space-y-2">
                    <SidebarItem id="dashboard" label="Resumo" icon={<span/>} />
                    <SidebarItem id="inventory" label="Estoque" icon={<span/>} />
                    <SidebarItem id="sales" label="Vendas" icon={<span/>} />
                    <SidebarItem id="products" label="Cadastrar" icon={<span/>} />
                  </nav>
                  <div className="mt-auto pt-4 border-t border-brand-800"><button onClick={signOut} className="w-full bg-red-600 text-white text-xs font-bold uppercase py-3 rounded">Sair</button></div>
              </div>
          </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-10 px-4 md:px-8 bg-brand-50 dark:bg-gray-900 transition-colors">
        
        {/* === DASHBOARD TAB === */}
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto py-8 animate-fade-in">
             <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Visão Geral</h2>
             
             {/* KPI Cards */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                 <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vendas Hoje</p>
                     <p className="text-2xl font-black text-brand-600 dark:text-brand-400">R$ {salesToday.toFixed(2)}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vendas Mês</p>
                     <p className="text-2xl font-black text-gray-900 dark:text-white">R$ {salesMonth.toFixed(2)}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pedidos</p>
                     <p className="text-2xl font-black text-blue-500">{orders.length}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Em Promoção</p>
                     <p className="text-2xl font-black text-green-500">{promoCount}</p>
                     <div className="absolute -right-4 -bottom-4 opacity-10"><svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg></div>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Chart Section */}
                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wide mb-6">Desempenho de Vendas (7 Dias)</h3>
                     <div className="h-64 w-full">
                         <SimpleAreaChart data={chartData} />
                     </div>
                 </div>

                 {/* Low Stock Alerts */}
                 <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
                     <h3 className="font-bold text-red-700 dark:text-red-400 uppercase text-xs tracking-wide mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Alerta de Estoque
                     </h3>
                     <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                         {lowStockProducts.length === 0 ? (
                             <p className="text-sm text-red-600/70 italic">Estoque saudável.</p>
                         ) : (
                             lowStockProducts.map(p => (
                                 <div key={p.id} className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm flex justify-between items-center">
                                     <div>
                                         <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{p.name}</p>
                                         <p className="text-[10px] text-gray-400">Ref: {p.id.substring(0,6)}</p>
                                     </div>
                                     <span className="text-sm font-black text-red-600 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">{p.stock} un</span>
                                 </div>
                             ))
                         )}
                     </div>
                     <button onClick={() => setActiveTab('inventory')} className="mt-4 w-full text-center text-xs font-bold text-red-600 hover:underline uppercase">Gerenciar Estoque</button>
                 </div>
             </div>
          </div>
        )}

        {/* === INVENTORY TAB (Management) === */}
        {activeTab === 'inventory' && (
           <div className="max-w-6xl mx-auto py-8 animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Gerenciar Produtos</h2>
                  <button onClick={() => setActiveTab('products')} className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs uppercase px-4 py-3 rounded shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Adicionar Novo
                  </button>
              </div>

              <div className="grid gap-4">
                 {/* Header Row */}
                 <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="col-span-1">Imagem</div>
                    <div className="col-span-4">Detalhes do Produto</div>
                    <div className="col-span-3">Precificação (Normal / Promo)</div>
                    <div className="col-span-2">Estoque</div>
                    <div className="col-span-2 text-right">Status</div>
                 </div>

                 {products.map(p => (
                     <div key={p.id} className={`bg-white dark:bg-gray-800 border ${p.active ? 'border-gray-200 dark:border-gray-700' : 'border-red-100 dark:border-red-900/30 opacity-75'} rounded-lg p-4 shadow-sm flex flex-col md:grid md:grid-cols-12 gap-4 items-center transition-all hover:shadow-md`}>
                         
                         {/* Photo */}
                         <div className="col-span-1 relative group w-16 h-16 md:w-full md:h-16 flex-shrink-0">
                             <img src={p.image} className="w-full h-full object-cover rounded bg-gray-100" />
                             {isUsingSupabase && (
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity rounded text-white text-[8px] font-bold uppercase text-center">
                                    <span>Trocar</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false, p.id)} />
                                </label>
                             )}
                         </div>

                         {/* Details */}
                         <div className="col-span-4 w-full">
                             <input 
                                value={p.name}
                                onChange={(e) => handleUpdate(p.id, "name", e.target.value)}
                                className="w-full font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 focus:border-brand-500 outline-none transition-colors mb-1 text-sm"
                             />
                             <select 
                                value={p.category}
                                onChange={(e) => handleUpdate(p.id, "category", e.target.value)}
                                className="text-xs text-gray-500 bg-transparent outline-none cursor-pointer hover:text-brand-600"
                             >
                                 <option value="tercos">Terços</option>
                                 <option value="imagens">Imagens</option>
                                 <option value="biblias">Bíblias</option>
                             </select>
                         </div>

                         {/* Pricing & Promo */}
                         <div className="col-span-3 w-full flex items-center gap-3">
                             <div className="flex-1">
                                 <label className="text-[9px] uppercase font-bold text-gray-400">Preço</label>
                                 <input 
                                     type="number" 
                                     value={p.price}
                                     onChange={(e) => handleUpdate(p.id, "price", parseFloat(e.target.value))}
                                     className="w-full text-sm font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none dark:text-white"
                                 />
                             </div>
                             
                             {/* Promo Toggle Logic */}
                             <div className="flex-1 relative">
                                <label className="text-[9px] uppercase font-bold text-brand-500 flex justify-between cursor-pointer" onClick={() => handleUpdate(p.id, "promoPrice", p.promoPrice ? 0 : (p.price * 0.9).toFixed(2))}>
                                    Promo
                                    <span className={`w-2 h-2 rounded-full ${p.promoPrice ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                </label>
                                {p.promoPrice ? (
                                    <input 
                                        type="number" 
                                        value={p.promoPrice}
                                        onChange={(e) => handleUpdate(p.id, "promoPrice", parseFloat(e.target.value))}
                                        className="w-full text-sm font-bold text-brand-600 dark:text-brand-400 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-brand-500 outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <button onClick={() => handleUpdate(p.id, "promoPrice", (p.price * 0.9).toFixed(2))} className="text-xs text-gray-400 underline mt-1">Ativar</button>
                                )}
                             </div>
                         </div>

                         {/* Stock */}
                         <div className="col-span-2 w-full">
                             <div className={`flex items-center border rounded w-max bg-white dark:bg-gray-900 ${p.stock <= 5 ? 'border-red-300 shadow-sm shadow-red-100' : 'border-gray-200 dark:border-gray-700'}`}>
                                 <button onClick={() => handleUpdate(p.id, "stock", Math.max(0, p.stock - 1))} className="px-3 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold">-</button>
                                 <input 
                                     type="number"
                                     value={p.stock}
                                     onChange={(e) => handleUpdate(p.id, "stock", parseInt(e.target.value))}
                                     className={`w-10 text-center text-sm font-bold bg-transparent outline-none ${p.stock <= 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}
                                 />
                                 <button onClick={() => handleUpdate(p.id, "stock", p.stock + 1)} className="px-3 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold">+</button>
                             </div>
                         </div>

                         {/* Actions */}
                         <div className="col-span-2 w-full flex items-center justify-between md:justify-end gap-3">
                              <button 
                                onClick={() => handleUpdate(p.id, "active", !p.active)}
                                className={`flex-1 md:flex-none px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${p.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                              >
                                  {p.active ? 'Ativo' : 'Off'}
                              </button>
                              <button 
                                onClick={() => window.confirm("Excluir definitivamente?") && deleteProduct(p.id)}
                                className="p-2 text-gray-300 hover:text-red-600 transition-colors"
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

        {/* === SALES VIEW (Simple Table) === */}
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
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                                            {order.items.length} itens
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-brand-600 dark:text-brand-400">
                                            R$ {order.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">Nenhuma venda registrada.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- ADD PRODUCT VIEW (Same as before, simplified for this block) --- */}
        {activeTab === 'products' && (
            <div className="max-w-4xl mx-auto py-8 animate-fade-in">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Cadastrar Produto</h2>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome</label>
                                <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-sm outline-none focus:border-brand-500 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preço</label><input type="number" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-sm outline-none focus:border-brand-500 dark:text-white" /></div>
                                <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Estoque</label><input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-sm outline-none focus:border-brand-500 dark:text-white" /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoria</label>
                                <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-sm outline-none focus:border-brand-500 dark:text-white">
                                    <option value="tercos">Terços</option><option value="imagens">Imagens</option><option value="biblias">Bíblias</option>
                                </select>
                            </div>
                            <div><label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</label><textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 rounded text-sm outline-none h-32 resize-none dark:text-white" /></div>
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Imagem</label>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                {newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover" /> : <div className="text-center p-6"><span className="text-gray-400 text-xs">Clique para fazer upload</span></div>}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload(e, true)} disabled={!isUsingSupabase} />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end"><button onClick={handleCreate} disabled={isCreating || uploadingImg} className="bg-brand-600 text-white font-bold text-sm py-3 px-8 rounded uppercase tracking-widest hover:bg-brand-700 disabled:opacity-50">Criar Produto</button></div>
                </div>
            </div>
        )}
        
      </main>
    </div>
  );
};

export default Admin;