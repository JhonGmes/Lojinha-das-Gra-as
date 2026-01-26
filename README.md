# 🛍️ Lojinhas das Graças

E-commerce SPA focado em experiência humana, vendas via WhatsApp e Inteligência Artificial.
Projeto desenvolvido para pequenos negócios que desejam presença digital simples, rápida e acolhedora, potencializada pelo Google Gemini.

## ✨ Visão Geral

O site funciona como um catálogo interativo "WhatsApp First".
O cliente navega pelos produtos, tira dúvidas com um assistente IA, personaliza imagens de produtos, monta o carrinho e finaliza a compra diretamente pelo WhatsApp com uma mensagem formatada.

Sem gateways de pagamento complexos.
Sem fricção.
Mais conversão.

## 🧩 Funcionalidades

### 🛒 Experiência de Compra
• **Catálogo Inteligente**: Navegação fluida por categorias e busca em tempo real.
• **Carrinho Persistente**: Seus itens salvos no navegador (LocalStorage).
• **Checkout WhatsApp**: Geração automática de pedido formatado (Nome, Itens, Total, Pix).
• **Interface Responsiva**: Design moderno e adaptável a qualquer dispositivo.

### 🧠 Inteligência Artificial (Google Gemini)
• **Chatbot Assistente**: Tira dúvidas sobre produtos e ajuda na navegação.
• **Edição de Imagem**: Permite ao usuário visualizar o produto em diferentes cenários (ex: "Colocar num altar") via IA generativa.
• **Thinking Mode**: Análise profunda na página de detalhes explicando "Por que vale a pena?" comprar o produto.

### ⚙️ Gestão (Admin)
• **Admin Híbrido**: Sistema de gestão de produtos.
• **Supabase Integration**: Conecta-se a um banco de dados real se configurado.
• **Fallback Local**: Funciona perfeitamente em modo de demonstração (Mock) se não houver backend.

## 🛠️ Tecnologias

• **Frontend**: React 19, TypeScript, Vite
• **Estilização**: Tailwind CSS (CDN/Inline para Sandbox)
• **IA**: Google Gemini API (Models: gemini-3-pro, gemini-2.5-flash-image)
• **Backend (Opcional)**: Supabase (Postgres + Row Level Security)
• **Integração**: WhatsApp API (Deep Link)

## 📦 Estrutura do Projeto

```
src/
  ├── components/   # ChatBot, Navbar, CategoryMenu
  ├── context/      # Estados globais (Cart, Product, Search)
  ├── pages/        # Home, ProductDetail, Cart, Admin
  ├── services/     # Integrações (Gemini AI, Supabase)
  └── utils/        # Helpers
```

## 🚀 Como rodar o projeto

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente (Opcional):
Crie um arquivo `.env` na raiz para habilitar IA e Banco de Dados. Sem isso, o site roda em modo de demonstração.
```env
API_KEY=sua_chave_google_gemini
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_key_supabase
```

3. Rode o servidor:
```bash
npm run dev
```

## 📸 Conceito

Projeto ideal para lojas religiosas, artesanais ou pequenos comércios que querem unir a tradição do atendimento pessoal com a tecnologia de ponta da IA Generativa.

## 👤 Autor

Projeto desenvolvido com foco em Frontend, UX e soluções de alto impacto para negócios reais.