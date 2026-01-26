import { createClient } from '@supabase/supabase-js';
import { Order, CartItem } from '../types';

// Tries to get env vars from Vite (import.meta.env) or standard process.env
// @ts-ignore
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env?.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = !!supabase;

// --- AUTH ---
export async function login(email: string, password: string): Promise<{ error: any }> {
  if (!supabase) {
    // Mock Login
    if (email === 'admin@lojinha.com' && password === 'admin') {
      return { error: null };
    }
    return { error: { message: "Credenciais inválidas (Mock: admin@lojinha.com / admin)" } };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
}

export async function logout() {
  if (supabase) await supabase.auth.signOut();
}

export async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// --- STORAGE ---
export async function uploadImage(file: File): Promise<string> {
  if (!supabase) throw new Error("Storage unavailable in mock mode");

  const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
  const { error } = await supabase.storage
    .from("products")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("products")
    .getPublicUrl(fileName);
    
  return data.publicUrl;
}

// --- ANALYTICS ---
export async function trackEvent(event: string, productId?: string, meta?: any) {
  if (!supabase) {
    console.log(`[Analytics Mock] Event: ${event}`, { productId, meta });
    return;
  }

  try {
    await supabase.from("analytics").insert({
      event,
      product_id: productId,
      meta: meta ? JSON.stringify(meta) : null
    });
  } catch (e) {
    console.error("Analytics Error:", e);
  }
}

// --- ORDERS (SALES) ---
export async function createOrder(order: Omit<Order, 'id' | 'created_at'>) {
  if (!supabase) {
    const mockOrders = JSON.parse(localStorage.getItem('zapshop_orders') || '[]');
    const newOrder = {
      ...order,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    mockOrders.push(newOrder);
    localStorage.setItem('zapshop_orders', JSON.stringify(mockOrders));
    return { data: newOrder, error: null };
  }

  // Ensure table 'orders' exists in Supabase with jsonb column for 'items'
  const { data, error } = await supabase.from('orders').insert([{
    customer_name: order.customer_name,
    total: order.total,
    status: order.status,
    items: order.items, // JSONB
    notes: order.notes
  }]).select();

  return { data, error };
}

export async function getOrders() {
  if (!supabase) {
    const mockOrders = JSON.parse(localStorage.getItem('zapshop_orders') || '[]');
    return mockOrders.sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return data;
}

export async function updateOrderStatus(id: string, status: string) {
    if (!supabase) {
        const mockOrders = JSON.parse(localStorage.getItem('zapshop_orders') || '[]');
        const updated = mockOrders.map((o: Order) => o.id === id ? { ...o, status } : o);
        localStorage.setItem('zapshop_orders', JSON.stringify(updated));
        return;
    }
    await supabase.from('orders').update({ status }).eq('id', id);
}

// --- DASHBOARD ---
export async function getDashboardData() {
  // Fetch real product count (including paused)
  let products = [];
  if (!supabase) {
    // We need to import this differently or pass it in, but for now lets assume local mock logic
    // In a real app we'd fetch from the ProductContext or similar.
    // For this mock function, we will return static stats or derive from localStorage
  }

  const orders = await getOrders();
  
  const today = new Date().toDateString();
  const salesToday = orders
    .filter((o: Order) => new Date(o.created_at).toDateString() === today)
    .reduce((acc: number, o: Order) => acc + o.total, 0);

  const salesMonth = orders
    .filter((o: Order) => {
        const d = new Date(o.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc: number, o: Order) => acc + o.total, 0);

  // We can't easily get product stats here without circular dependency or duplication
  // So the Admin component will calculate product-related stats (Low stock, etc.)
  
  return {
    salesToday,
    salesMonth,
    orderCountToday: orders.filter((o: Order) => new Date(o.created_at).toDateString() === today).length
  };
}