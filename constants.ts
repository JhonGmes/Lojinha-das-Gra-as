import { Product } from './types';

export const STORE_PHONE_NUMBER = "5511999999999";

export const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "tercos", label: "Terços" },
  { id: "imagens", label: "Imagens" },
  { id: "biblias", label: "Bíblias" },
];

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Terço Nossa Senhora Aparecida",
    price: 49.90,
    promoPrice: 39.90,
    description: "Belíssimo terço tradicional com contas em cristal azul celeste facetado. Medalha central detalhada de Nossa Senhora Aparecida e crucifixo em metal dourado de alta qualidade.",
    category: "tercos",
    image: "https://images.unsplash.com/photo-1621323386999-635235332df6?q=80&w=1000&auto=format&fit=crop",
    features: ["Cristal Azul 8mm", "Metal Banho Ouro", "Comprimento: 50cm", "Embalagem para Presente"],
    stock: 15,
    active: true
  },
  {
    id: "2",
    name: "Imagem São José 20cm",
    price: 89.90,
    description: "Imagem de São José Operário em resina importada de alta resistência. Pintura manual com riqueza de detalhes e acabamento barroco artesanal.",
    category: "imagens",
    image: "https://images.unsplash.com/photo-1518175510651-7cb46c05a109?q=80&w=1000&auto=format&fit=crop",
    features: ["Resina Maciça", "Pintura a Mão", "Altura: 20cm", "Base em Madeira"],
    stock: 5,
    active: true
  },
  {
    id: "3",
    name: "Bíblia Sagrada Capa Luxo",
    price: 129.90,
    description: "Bíblia Sagrada edição de luxo com capa em couro sintético marrom e detalhes em dourado. Letra gigante para leitura confortável e harpa cristã inclusa.",
    category: "biblias",
    image: "https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?q=80&w=1000&auto=format&fit=crop",
    features: ["Versão Almeida", "Letra Gigante", "Capa Couro PU", "Borda Dourada"],
    stock: 20,
    active: true
  },
  {
    id: "4",
    name: "Terço de Madeira Imbuia",
    price: 39.90,
    description: "Terço masculino em madeira de imbuia natural com cordão resistente. Ideal para uso diário e oração em família. Possui aroma suave característico da madeira.",
    category: "tercos",
    image: "https://images.unsplash.com/photo-1560613279-d5774e50882e?q=80&w=1000&auto=format&fit=crop",
    features: ["Madeira Imbuia", "Cordão Reforçado", "Contas 10mm", "Crucifixo Madeira"],
    stock: 50,
    active: true
  },
  {
    id: "5",
    name: "Imagem N. Sra. de Fátima",
    price: 159.90,
    description: "Delicada imagem de Nossa Senhora de Fátima com coroa removível. Detalhes em dourado e manto branco perolado. Uma peça de devoção e beleza única.",
    category: "imagens",
    image: "https://images.unsplash.com/photo-1574619796684-09942a221f75?q=80&w=1000&auto=format&fit=crop",
    features: ["Resina Importada", "Coroa Removível", "30cm de Altura", "Olhos de Vidro"],
    stock: 2,
    active: true
  },
  {
    id: "6",
    name: "Bíblia de Estudo Pentecostal",
    price: 149.90,
    promoPrice: 119.90,
    description: "A mais completa Bíblia de estudo com notas explicativas, mapas coloridos e concordância bíblica. Indispensável para quem deseja aprofundar o conhecimento.",
    category: "biblias",
    image: "https://images.unsplash.com/photo-1498842812179-c81beecf902c?q=80&w=1000&auto=format&fit=crop",
    features: ["Notas de Estudo", "Mapas Coloridos", "Capa Dura", "Fita Marcadora"],
    stock: 0,
    active: true
  },
  {
    id: "7",
    name: "Produto Teste Inativo",
    price: 10.00,
    description: "Este produto não deve aparecer na home",
    category: "tercos",
    image: "",
    features: [],
    stock: 10,
    active: false
  }
];