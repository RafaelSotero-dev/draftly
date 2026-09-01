# Draftly

![Draftly logo](./public/favicon.svg)

Editor de quadros brancos inspirado no Excalidraw, com organização em pastas, dashboard em nuvem, autenticação via Supabase e persistência no PostgreSQL do próprio projeto Supabase, acessado via Prisma.

## Visão geral

O Draftly foi criado para ir além do uso básico do Excalidraw OSS: ele adiciona gerenciamento de projetos, hierarquia de pastas, salvamento automático e thumbnails para cada projeto. O Supabase é usado para autenticação; os dados de pastas e projetos ficam no PostgreSQL do Supabase via Prisma.

## O que ele faz

- Editor visual com base no `@excalidraw/excalidraw`
- Dashboard com lista de projetos por pasta
- CRUD de pastas e projetos
- Duplicação, movimentação, renomeação e exclusão
- Auto-save do canvas com debounce de 2 segundos
- Exportação do projeto como arquivo `.excalidraw`
- Login, cadastro, recuperação e redefinição de senha via Supabase Auth

> [!NOTE]
> Cada usuário vê apenas seus próprios projetos e pastas.

## Stack

- React 19 + TypeScript
- Vite
- Fastify
- Prisma + PostgreSQL (banco hospedado no Supabase)
- Supabase Auth
- Excalidraw OSS

## Estrutura

- `/src` - aplicação frontend
- `/server` - API Fastify
- `/prisma` - schema e migrations
- `/public` - assets estáticos
- `/docs` - especificações e decisões do projeto

## Requisitos

- Node.js recente compatível com Vite/Fastify
- PostgreSQL acessível via Supabase
- Projeto Supabase com Auth habilitado

## Configuração

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Preencha as variáveis:

- `DATABASE_URL` - conexão com o PostgreSQL do Supabase usada pelo Prisma em runtime
- `DIRECT_URL` - conexão direta usada pelo Prisma em migrations
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `PORT` e `HOST` se necessário
- `VITE_BASE_API_URL` é opcional e só é usado se a API não estiver em `http://localhost:3001`

## Executar localmente

```bash
npm install
npm run dev:all
```

Isso inicia:

- frontend em `http://localhost:5173`
- backend em `http://localhost:3001`

### Scripts úteis

- `npm run dev` - frontend apenas
- `npm run dev:server` - API apenas
- `npm run build` - build do frontend
- `npm run build:server` - build da API
- `npm run server` - executa a API compilada em `dist/backend/server/index.js`
- `npm run lint` - análise estática
- `npm run preview` - pré-visualização do build frontend

## Fluxo de uso

1. Crie uma conta ou faça login.
2. Crie pastas para organizar seus projetos.
3. Crie um projeto dentro de uma pasta.
4. Abra o projeto para editar o canvas.
5. O Draftly salva automaticamente as alterações e gera thumbnail em segundo plano.
6. Exporte o arquivo `.excalidraw` quando precisar levar o desenho para outro lugar.

## API

O backend expõe rotas autenticadas para:

- `GET /api/folders`, `POST /api/folders`, `PATCH /api/folders/:id`, `DELETE /api/folders/:id`
- `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`
- `POST /api/projects/:id/duplicate`
- `POST /api/projects/:id/save`
- `POST /api/projects/:id/thumbnail`

## Observações

> [!IMPORTANT]
> O app depende de variáveis de ambiente válidas para iniciar. Sem `DATABASE_URL` e as credenciais do Supabase, o frontend e o backend falham ao subir.

> [!TIP]
> A hierarquia de pastas é limitada a 5 níveis e a exclusão usa cascade no banco.
