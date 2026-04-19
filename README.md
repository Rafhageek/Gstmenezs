# Painel MNZ — Menezes Advocacia

Sistema de gestão de recebíveis de cessão de crédito do escritório
**Menezes Advocacia**. Substitui planilhas manuais por uma plataforma
moderna, segura e auditável.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL, Auth, Storage, RLS) via `@supabase/ssr`
- **Vercel** (hospedagem e deploy contínuo)

## Estrutura

```
src/
├── app/                    # Rotas (App Router)
│   ├── layout.tsx          # Layout raiz + paleta
│   ├── page.tsx            # Landing provisória
│   └── globals.css         # Tokens de design
├── lib/
│   └── supabase/           # Clientes Supabase
│       ├── client.ts       # Browser
│       ├── server.ts       # Server Components
│       └── middleware.ts   # Refresh de sessão
└── middleware.ts           # Aplicação do refresh em todas as rotas
```

## Desenvolvimento local

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha:
```bash
cp .env.local.example .env.local
```

Onde encontrar as chaves no Supabase:
**Dashboard → Project Settings → API**

| Variável                          | Descrição                             |
| --------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | URL do projeto Supabase               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Chave pública (anon)                  |
| `SUPABASE_SERVICE_ROLE_KEY`       | Chave de serviço (NUNCA no client)    |

### 3. Rodar dev server
```bash
npm run dev
```
Aplicação em http://localhost:3000

## Deploy no Vercel

### Setup inicial (uma vez)

1. Crie um repositório no GitHub e suba o projeto:
   ```bash
   git init
   git add .
   git commit -m "chore: setup inicial Painel MNZ"
   git branch -M main
   git remote add origin <url-do-repo>
   git push -u origin main
   ```

2. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório.

3. Em **Environment Variables**, adicione as três chaves do Supabase
   (produção, preview e development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (apenas produção/preview)

4. Clique em **Deploy**. A Vercel detecta Next.js automaticamente.

### Deploys subsequentes

A cada `git push origin main`, a Vercel faz deploy automático em produção.
Pull Requests recebem **Preview Deploys** isolados com URL própria.

### Conectando o Supabase à Vercel

Para sincronizar variáveis e habilitar redirect URLs do Auth:

1. No Supabase Dashboard → **Authentication → URL Configuration**:
   - Site URL: `https://<seu-app>.vercel.app`
   - Redirect URLs: `https://<seu-app>.vercel.app/**`,
     `http://localhost:3000/**`

2. (Opcional) Use a [integração oficial Vercel ↔ Supabase](https://vercel.com/integrations/supabase)
   para sincronizar variáveis automaticamente.

## Roadmap (conforme [AGENTS.md](AGENTS.md))

- [x] Setup Next.js + Supabase + paleta de marca
- [ ] Schema SQL: `cessionarios`, `cessoes_credito`, `pagamentos`, `logs_auditoria`
- [ ] Row Level Security (RLS) por advogado
- [ ] Supabase Auth (Email/Senha)
- [ ] Cadastro de cessões
- [ ] Registro de pagamentos
- [ ] Dashboard financeiro com gráficos (Recharts)
- [ ] Upload de comprovantes (Supabase Storage)
- [ ] Geração de relatórios PDF com logomarca

## Segurança

- **Sigilo profissional**: todo acesso é auditado em `logs_auditoria`.
- **RLS**: políticas no PostgreSQL impedem vazamento entre advogados.
- **Secrets**: `SUPABASE_SERVICE_ROLE_KEY` nunca vai ao client.
- **HTTPS**: garantido pela Vercel.
