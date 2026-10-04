# Ki-Delícia Pastelaria 🥟

> **O Sabor Que Pede Bis!** — Sistema de cardápio digital e gestão de pedidos.

---

## 📋 Descrição

Aplicação web completa para gerenciar o cardápio e os pedidos da **Ki-Delícia Pastelaria**. Desenvolvida com HTML5, CSS3 e JavaScript puro (ES Modules), sem dependências de framework no frontend.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 semântico | Estrutura das páginas |
| CSS3 com Custom Properties | Estilos organizados em arquivos separados |
| JavaScript ES Modules | Lógica modular sem bundler |
| localStorage | Persistência local dos dados |
| Supabase (PostgreSQL) | Banco de dados em nuvem (configuração futura) |
| Vercel | Hospedagem e deploy |

---

## 📁 Estrutura de Arquivos

```
ki-delicia-pastelaria/
├── index.html                    # HTML principal (limpo, sem CSS/JS inline)
├── logo.jpg                      # Logo original (mantida na raiz para compatibilidade)
├── package.json
├── vercel.json                   # Configuração de deploy
├── .gitignore
├── .env.example
├── README.md
│
├── assets/
│   ├── css/
│   │   ├── main.css             # Ponto de entrada (importa os demais)
│   │   ├── variables.css        # Design tokens e variáveis CSS
│   │   ├── reset.css            # Normalização base
│   │   ├── layout.css           # Header, nav, main, seções
│   │   ├── components.css       # Cards, botões, modal, toast, forms
│   │   └── responsive.css       # Media queries (mobile-first)
│   │
│   ├── js/
│   │   ├── main.js              # Ponto de entrada — inicializa e conecta módulos
│   │   ├── data.js              # Dados estáticos do cardápio e constantes
│   │   ├── storage.js           # Camada de persistência (localStorage)
│   │   ├── menu.js              # Renderização e lógica do cardápio
│   │   ├── cart.js              # Estado e renderização do carrinho
│   │   ├── orders.js            # CRUD e renderização de pedidos
│   │   ├── gestao.js            # Painel de gestão e configurações
│   │   └── ui.js                # Utilitários: toast, modal, tabs, formatação
│   │
│   └── images/
│       └── logo.jpg             # Logo da pastelaria
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Schema completo com RLS
```

---

## ⚙️ Instalação Local

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ (apenas para o servidor de desenvolvimento)
- Navegador moderno com suporte a ES Modules

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/ki-delicia-pastelaria.git
cd ki-delicia-pastelaria

# 2. Instale as dependências de desenvolvimento
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

> **Por que um servidor local?** — ES Modules (`import`/`export`) exigem que os arquivos sejam servidos via HTTP. Abrir o `index.html` diretamente no navegador (via `file://`) causará erro de CORS. Use `npm run dev`.

---

## 🌿 Variáveis de Ambiente

```bash
# Copie o exemplo
cp .env.example .env

# Edite com seus valores (Supabase — para integração futura)
```

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública anon do Supabase |

> ⚠️ **Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.

---

## 🗄️ Configuração do Supabase

### 1. Criar o projeto

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Crie um novo projeto
3. Anote a **URL** e a **anon key** em `Settings → API`

### 2. Executar o SQL

1. No painel do Supabase, vá em **SQL Editor → New query**
2. Cole o conteúdo de [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. Clique em **Run**

Isso criará:
- Tabela `menu_items` com todos os 15 pastéis
- Tabela `orders` para pedidos
- Tabela `order_items` para itens de cada pedido
- Tabela `store_config` para configurações
- Políticas RLS de segurança
- Triggers de `updated_at` automático

### 3. Testar as políticas RLS

```sql
-- Verificar itens visíveis publicamente
SELECT * FROM menu_items WHERE active = TRUE;

-- Verificar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🚀 Deploy na Vercel

### Via GitHub (recomendado)

```bash
# 1. Inicie um repositório Git
git init
git add .
git commit -m "feat: projeto inicial Ki-Delícia Pastelaria"

# 2. Crie o repositório no GitHub e envie
git remote add origin https://github.com/seu-usuario/ki-delicia.git
git push -u origin main
```

3. Acesse [vercel.com](https://vercel.com) → **New Project**
4. Importe o repositório do GitHub
5. Configurações do Vercel:
   - **Framework Preset:** Other
   - **Build Command:** *(deixe vazio)*
   - **Output Directory:** *(deixe vazio — raiz do projeto)*
6. Clique em **Deploy**

### Variáveis de ambiente na Vercel

Em **Project → Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `SUPABASE_ANON_KEY` | `sua-chave-anon` |

### Domínio personalizado

Em **Project → Settings → Domains**, adicione seu domínio e siga as instruções de DNS.

---

## 🧪 Funcionalidades

| Funcionalidade | Status |
|---|---|
| Exibir cardápio por categoria | ✅ |
| Busca em tempo real no cardápio | ✅ |
| Carrinho de compras | ✅ |
| Finalizar pedido com nome e observação | ✅ |
| Acompanhar pedidos (4 status) | ✅ |
| Filtrar pedidos por status | ✅ |
| Painel de estatísticas | ✅ |
| Editar preços do cardápio | ✅ |
| Adicionar novos itens ao cardápio | ✅ |
| Configurações da loja | ✅ |
| Persistência via localStorage | ✅ |
| Responsivo (mobile/tablet/desktop) | ✅ |
| Integração Supabase (banco real) | 🔧 Pronto para configurar |

---

## 🐛 Solução de Problemas

### Tela branca ao abrir o `index.html` diretamente

**Causa:** ES Modules não funcionam via `file://`.  
**Solução:** Use `npm run dev` e acesse `http://localhost:3000`.

### Erro `CORS` no console

**Causa:** Mesma que acima.  
**Solução:** Sempre sirva via servidor HTTP local.

### Itens do cardápio não aparecem

**Causa:** localStorage pode estar corrompido.  
**Solução:** Abra o DevTools → Application → Local Storage → Limpe as chaves `kd_*`.

### Logo não aparece

**Causa:** Arquivo `assets/images/logo.jpg` ausente.  
**Solução:** Certifique-se de que `logo.jpg` está na pasta `assets/images/`.

---

## 📞 Contato

**Ki-Delícia Pastelaria**  
📱 WhatsApp: (99) 98443-6545
