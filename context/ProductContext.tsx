import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { PRODUCTS as MOCK_PRODUCTS } from '../constants';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  isUsingSupabase: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: React.PropsWithChildren) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          const formatted = data.map((p: any) => ({
            ...p,
            price: Number(p.price),
            promoPrice: p.promoPrice ? Number(p.promoPrice) : undefined,
            stock: p.stock !== undefined ? Number(p.stock) : 0,
            features: p.features || [],
            active: p.active !== false // Default true if undefined
          }));
          setProducts(formatted);
        }
      } catch (err) {
        console.error("Supabase fetch error, falling back to mock:", err);
        setProducts(MOCK_PRODUCTS);
      }
    } else {
      setProducts(MOCK_PRODUCTS);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    const productData = { ...newProduct, active: true }; // Default active
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) {
        console.error("Error adding product:", error);
        alert("Erro ao adicionar produto no banco.");
        return;
      }
    } else {
      const mockId = (Date.now()).toString();
      setProducts(prev => [{ ...productData, id: mockId }, ...prev]);
    }
    await fetchProducts();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error("Error updating product:", error);
        return;
      }
    } 
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error("Error deleting product:", error);
        return;
      }
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      loading, 
      refreshProducts: fetchProducts, 
      updateProduct, 
      addProduct, 
      deleteProduct,
      isUsingSupabase: isSupabaseConfigured 
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within a ProductProvider");
  return context;
};