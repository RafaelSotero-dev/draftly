# Resumo da Conversa - Excalidraw Clone

**Data:** 06/05/2026
**Status:** Pronto para Fase 2 (Design Técnico)

---

## 1. Objetivo do Projeto

Criar uma aplicação de quadro branco virtual baseada no **Excalidraw Open Source** com sistema de gerenciamento de projetos em nuvem (feature exclusiva do Excalidraw+ pago).

---

## 2. Stack Tecnológica Definida

| Tecnologia | Finalidade |
|------------|------------|
| React.js ^18.x | Framework frontend |
| TypeScript ^5.x | Linguagem de programação |
| Excalidraw OSS | Base do editor de desenhos |
| Prisma ^5.x | ORM para comunicação com banco |
| PostgreSQL | Banco de dados relacional |
| Supabase | Backend as a Service (Auth + DB) |

---

## 3. Infraestrutura Configurada

- **Banco de dados:** PostgreSQL hospedado no Supabase
- **Conexão:** DATABASE_URL configurada no arquivo `.env`
- **Estado atual:** Banco vazio, aguardando migrations

---

## 4. Documento de Requisitos Criado

**Arquivo:** `.kiro/specs/excalidraw-clone-projects/requirements.md`

### 10 Requisitos Funcionais:

| # | Requisito | Descrição |
|---|-----------|-----------|
| 1 | Integração Excalidraw Core | Ferramentas de desenho, suporte a .excalidraw |
| 2 | Dashboard Principal | Interface de gerenciamento com sidebar hierárquica |
| 3 | Estrutura de Pastas | Aninhamento até 5 níveis, integridade referencial |
| 4 | Metadados de Projetos | Thumbnails PNG 200x150, timestamps, nomes |
| 5 | Operações CRUD | Criar, renomear, duplicar, mover, excluir |
| 6 | Sincronização e Persistência | Auto-save com debounce de 2s via Prisma |
| 7 | Modelagem Prisma | Modelos User, Folder e Project com relações |
| 8 | Interface e UX | Design minimalista, navegação por teclado |
| 9 | Sistema de Autenticação | Login/cadastro com Supabase Auth |
| 10 | Isolamento de Dados | Usuários não visualizam projetos de outros |

### Requisitos Não-Funcionais:

**Desempenho:**
- Debounce de 2 segundos no auto-save
- Thumbnails otimizados para não bloquear thread principal

**Segurança:**
- DATABASE_URL em variáveis de ambiente
- Sanitização de inputs
- HTTPS em produção (`NODE_ENV=production`)
- HTTP permitido em desenvolvimento (`NODE_ENV=development`)
- Hash de senhas via Supabase Auth
- Validação de tokens JWT

**Confiabilidade:**
- Persistência local em caso de falhas
- Integridade referencial ao excluir pastas

---

## 5. Decisões Tomadas

### 5.1 Sistema de Autenticação
- **Decisão:** Implementar autenticação básica desde o início
- **Motivo:** Permitir deploy em VPS com múltiplos usuários, garantindo isolamento de dados
- **Implementação:** Supabase Auth com email/senha

### 5.2 Isolamento de Dados
- **Decisão:** Cada usuário visualiza apenas seus próprios projetos e pastas
- **Implementação:** Campo `userId` nos modelos Folder e Project do Prisma
- **Filtragem:** Automática por ID do usuário autenticado

### 5.3 HTTP em Desenvolvimento
- **Decisão:** Permitir HTTP quando `NODE_ENV=development`
- **Motivo:** Facilitar testes locais sem necessidade de certificado SSL

### 5.4 Colaboração em Tempo Real
- **Decisão:** NÃO implementar nesta fase
- **Motivo:** Foco em funcionalidades individuais primeiro

---

## 6. Estrutura de Dados (Schema Prisma Planejado)

```
User (gerenciado pelo Supabase Auth)
  └── id, email, createdAt, updatedAt

Folder
  └── id, name, parentId (auto-referência), userId, createdAt, updatedAt

Project
  └── id, name, folderId, userId, canvasData (JSON), thumbnail, createdAt, updatedAt
```

**Relacionamentos:**
- User → Folder (1:N)
- User → Project (1:N)
- Folder → Folder (1:N, auto-referência para hierarquia)
- Folder → Project (1:N)

---

## 7. Próximos Passos

### Fase 2: Design Técnico
1. Criar documento de design (`design.md`)
2. Definir arquitetura de componentes React
3. Detalhar API routes e endpoints
4. Especificar schema Prisma completo
5. Definir fluxo de autenticação com Supabase

### Fase 3: Implementação
1. Inicializar projeto React + TypeScript
2. Configurar Prisma com provider `postgresql`
3. Executar migrations no Supabase
4. Implementar autenticação
5. Desenvolver Dashboard e Canvas
6. Implementar auto-save e thumbnails

---

## 8. Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `.env` | Variáveis de ambiente (DATABASE_URL) |
| `docs/init-specs.md` | Especificações técnicas iniciais |
| `.kiro/specs/excalidraw-clone-projects/requirements.md` | Documento de requisitos completo |
| `.kiro/specs/excalidraw-clone-projects/.config.kiro` | Configuração do spec (workflow: requirements-first) |

---

## 9. Estado Atual

✅ Requisitos de infraestrutura analisados
✅ DATABASE_URL validada no .env
✅ Documento de requisitos criado e revisado
✅ Sistema de autenticação adicionado
✅ Isolamento de dados entre usuários definido
✅ HTTP em desenvolvimento permitido

⏳ **Aguardando:** Fase 2 - Design Técnico

---

## 10. Observações Importantes

- Toda comunicação deve ser em **PORTUGUÊS**
- Workflow escolhido: **Requirements-First** (Requisitos → Design → Tasks)
- Feature name: `excalidraw-clone-projects`
- Spec ID: `22e8512b-7122-40fd-9380-03f8c6636f31`
