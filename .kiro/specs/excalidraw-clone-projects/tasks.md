# Implementation Plan: Clone do Excalidraw com Sistema de Projetos

## Overview

Este plano de implementação cobre o desenvolvimento do clone do Excalidraw com sistema de gerenciamento de projetos em nuvem. A implementação está organizada em fases progressivas, iniciando pela infraestrutura básica e evoluindo até funcionalidades avançadas como auto-save e thumbnails.

**Stack Técnico:**
- React.js ^18.x + TypeScript ^5.x
- Excalidraw OSS ^0.17.x
- Prisma ^5.x + PostgreSQL (Supabase)
- Supabase Auth ^2.x

---

## Tasks

### Fase 1: Setup do Projeto e Infraestrutura

- [x] 1. Inicializar projeto React com TypeScript
  - Criar projeto com Vite ou Next.js
  - Configurar TypeScript com strict mode
  - Configurar ESLint e Prettier
  - Configurar alias de imports (@/components, @/lib, etc.)
  - _Requirements: 7.7_

- [x] 2. Configurar Prisma ORM
  - [x] 2.1 Instalar e inicializar Prisma
    - Instalar prisma e @prisma/client
    - Configurar datasource postgresql com DATABASE_URL
    - Criar schema inicial com modelos User, Folder, Project
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 2.2 Executar primeira migration
    - Rodar prisma migrate dev para criar tabelas
    - Verificar índices criados (userId, folderId, updatedAt)
    - _Requirements: 7.8_

  - [x] 2.3 Escrever testes de conexão com banco
    - Testar conexão com PostgreSQL
    - Verificar se migrations foram aplicadas
    - _Requirements: 7.8_

- [x] 3. Configurar cliente Supabase Auth
  - [x] 3.1 Criar cliente Supabase
    - Instalar @supabase/supabase-js
    - Configurar SUPABASE_URL e SUPABASE_ANON_KEY
    - Criar arquivo lib/supabase.ts com cliente exportado
    - _Requirements: 9.2, 9.3_

  - [x] 4. Configurar variáveis de ambiente
    - Criar .env.example com todas as variáveis necessárias
    - Documentar DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
    - Configurar NODE_ENV para development/production
    - _Requirements: NFR-Segurança 3_

- [x] 5. Checkpoint - Infraestrutura básica pronta
  - Verificar conexão com banco de dados
  - Verificar cliente Supabase configurado
  - Perguntar ao usuário se há dúvidas antes de prosseguir

---

### Fase 2: Sistema de Autenticação

- [x] 6. Implementar AuthProvider e Context
  - [x] 6.1 Criar AuthContext e AuthProvider
    - Definir interface AuthContextValue
    - Implementar estados: user, session, isLoading
    - Criar hook useAuth para acesso ao contexto
    - _Requirements: 9.1, 9.6_

  - [x] 6.2 Implementar funções de autenticação
    - Implementar signIn(email, password)
    - Implementar signUp(email, password)
    - Implementar signOut()
    - Implementar persistência de sessão entre recarregamentos
    - _Requirements: 9.2, 9.3, 9.5_

  - [ ]* 6.3 Escrever testes unitários para AuthProvider
    - Testar fluxo de login bem-sucedido
    - Testar fluxo de login com credenciais inválidas
    - Testar persistência de sessão
    - _Requirements: 9.3, 9.4, 9.6_

- [x] 7. Implementar formulários de autenticação
  - [x] 7.1 Criar LoginForm
    - Campos de email e senha
    - Validação de formato de email
    - Exibição de erros de autenticação
    - _Requirements: 9.3, 9.4, 9.7_

  - [x] 7.2 Criar RegisterForm
    - Campos de email, senha e confirmação de senha
    - Validação de formato de email
    - Validação de senha mínima (8 caracteres)
    - Exibição de erros de cadastro
    - _Requirements: 9.2, 9.7, 9.8_

  - [x] 7.3 Criar páginas de autenticação
    - Criar pages/auth/login.tsx
    - Criar pages/auth/register.tsx
    - Configurar rotas públicas
    - _Requirements: 9.1_

- [x] 8. Implementar middleware de autenticação
  - [x] 8.2 Implementar proteção de rotas privadas
    - Redirecionar usuários não autenticados para login
    - Preservar URL de destino para redirecionamento pós-login
    - _Requirements: 9.1, 10.1_

- [x] 9. Checkpoint - Autenticação funcional
  - Testar fluxo completo: cadastro → login → logout
  - Verificar proteção de rotas privadas
  - Perguntar ao usuário se há dúvidas antes de prosseguir

---

### Fase 3: Modelagem de Dados e APIs CRUD

- [x] 10. Implementar API de Folders
  - [x] 10.1 Criar rotas CRUD para folders
    - POST /api/folders - Criar pasta
    - GET /api/folders - Listar pastas do usuário
    - GET /api/folders/:id - Obter pasta específica
    - PATCH /api/folders/:id - Renomear/mover pasta
    - DELETE /api/folders/:id - Excluir pasta (cascade)
    - _Requirements: 3.1, 3.3, 3.4, 3.6, 10.5_

  - [x] 10.2 Implementar validação de hierarquia
    - Validar profundidade máxima de 5 níveis
    - Validar referência circular ao mover pastas
    - Retornar erro apropriado para violações
    - _Requirements: 3.2, 3.5_

  - [ ]* 10.3 Escrever testes de propriedade para hierarquia de pastas
    - **Property 2: Integridade da hierarquia de pastas**
    - **Validates: Requirements 3.2**
    - Gerar hierarquias aleatórias e verificar profundidade

  - [ ]* 10.4 Escrever testes de propriedade para movimento de pasta
    - **Property 7: Validação de movimento de pasta (sem referência circular)**
    - **Validates: Requirements 3.5**
    - Gerar movimentos aleatórios e verificar rejeição de ciclos

- [x] 11. Implementar API de Projects
  - [x] 11.1 Criar rotas CRUD para projects
    - POST /api/projects - Criar projeto
    - GET /api/projects - Listar projetos do usuário
    - GET /api/projects/:id - Obter projeto específico
    - PATCH /api/projects/:id - Renomear/mover projeto
    - DELETE /api/projects/:id - Excluir projeto
    - POST /api/projects/:id/duplicate - Duplicar projeto
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 11.2 Implementar salvamento de canvas
    - POST /api/projects/:id/save - Salvar canvasData
    - Validar formato JSON do canvasData
    - Atualizar timestamp de modificação
    - _Requirements: 6.2, 6.4_

  - [x] 11.3 Implementar isolamento de dados
    - Filtrar todas as queries por userId do usuário autenticado
    - Retornar erro 403 para acesso a recursos de outros usuários
    - _Requirements: 10.2, 10.3, 10.7_

  - [ ]* 11.4 Escrever testes de propriedade para isolamento de dados
    - **Property 3: Isolamento de dados entre usuários**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.7**
    - Gerar acessos aleatórios e verificar negação de acesso cruzado

  - [ ]* 11.5 Escrever testes de propriedade para duplicação de projeto
    - **Property 8: Duplicação de projeto**
    - **Validates: Requirements 5.3**
    - Verificar ID único, nome sufixado, dados idênticos

- [x] 12. Implementar hooks de dados
  - [x] 12.1 Criar hook useFolders
    - Funções: createFolder, renameFolder, moveFolder, deleteFolder
    - Estados de loading e erro
    - Cache e invalidação
    - _Requirements: 3.1, 3.3, 3.4, 3.6_

  - [x] 12.2 Criar hook useProjects
    - Funções: createProject, renameProject, moveProject, deleteProject, duplicateProject
    - Estados de loading e erro
    - Cache e invalidação
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Implementar middleware de validação de token
  - [x] 13.1 Criar middleware de autenticação para APIs
    - Extrair Bearer token do header Authorization
    - Validar JWT via supabase.auth.getUser(token)
    - Retornar usuário autenticado ou erro 401
    - Reutilizar em todas as rotas protegidas da Fase 3
    - _Requirements: NFR-Segurança 8_

- [x] 14. Implementar servidor Fastify
  - [x] 14.1 Configurar servidor Fastify
    - Instalar fastify, @fastify/cors, @fastify/sensible
    - Criar server/index.ts como entrypoint
    - Configurar CORS para o frontend Vite
    - Registrar plugin de autenticação JWT (usando auth-middleware)
    - _Requirements: NFR-Segurança 8_

  - [x] 14.2 Implementar rotas HTTP de Folders
    - POST /api/folders
    - GET /api/folders
    - GET /api/folders/:id
    - PATCH /api/folders/:id
    - DELETE /api/folders/:id
    - Todas as rotas protegidas pelo middleware JWT
    - _Requirements: 3.1, 3.3, 3.4, 3.6, 10.5_

  - [x] 14.3 Implementar rotas HTTP de Projects
    - POST /api/projects
    - GET /api/projects
    - GET /api/projects/:id
    - PATCH /api/projects/:id
    - DELETE /api/projects/:id
    - POST /api/projects/:id/duplicate
    - POST /api/projects/:id/save
    - Todas as rotas protegidas pelo middleware JWT
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.4_

  - [x] 14.4 Atualizar cliente HTTP no frontend
    - Criar src/lib/api.ts com cliente HTTP que envia Bearer token
    - Atualizar src/api/folders.ts e src/api/projects.ts para usar o cliente HTTP
    - _Requirements: NFR-Segurança 8_

- [x] 15. Checkpoint - APIs CRUD funcionais
  - Testar CRUD de pastas via API
  - Testar CRUD de projetos via API
  - Verificar isolamento de dados entre usuários
  - Perguntar ao usuário se há dúvidas antes de prosseguir

---

### Fase 4: Dashboard e Sidebar

- [x] 16. Implementar componentes de UI base
  - [x] 16.1 Criar componentes reutilizáveis
    - Button.tsx com variantes (primary, secondary, ghost)
    - Input.tsx com validação visual
    - Modal.tsx para diálogos de confirmação
    - _Requirements: 8.6_

  - [x] 16.2 Implementar indicadores de estado
    - Loading spinner para operações assíncronas
    - Indicador de salvamento em andamento
    - _Requirements: 8.3_

- [x] 17. Implementar Sidebar e árvore de pastas
  - [x] 17.1 Criar componente FolderTree recursivo
    - Renderização hierárquica com indentação
    - Ícones de expansão/colapso
    - Seleção de pasta
    - _Requirements: 2.3, 2.4_

  - [x] 17.2 Criar componente Sidebar
    - Integrar FolderTree
    - Botão para criar nova pasta
    - Menu de contexto para renomear/excluir
    - _Requirements: 2.3, 3.1, 3.3, 3.4_

  - [ ]* 17.3 Escrever testes de propriedade para persistência de UI
    - **Property 9: Persistência de estado de UI**
    - **Validates: Requirements 2.5**
    - Verificar restauração de estado após recarregamento

- [x] 18. Implementar Dashboard principal
  - [x] 18.1 Criar componente ProjectGrid
    - Grid responsivo de cards de projeto
    - Suporte a modo lista (opcional)
    - Ordenação por data de modificação
    - _Requirements: 2.1_

  - [x] 18.2 Criar componente ProjectCard
    - Exibir thumbnail, nome e data de modificação
    - Menu de contexto para renomear/duplicar/mover/excluir
    - Duplo clique para abrir projeto
    - _Requirements: 2.1, 2.2, 5.2, 5.3, 5.4, 5.5_

  - [x] 18.3 Criar Dashboard container
    - Integrar Sidebar e ProjectGrid
    - Gerenciar estado de pasta selecionada
    - Botão para criar novo projeto
    - Persistir preferências de visualização
    - _Requirements: 2.1, 2.3, 2.5_

  - [x] 18.4 Implementar navegação por teclado
    - Setas para navegar entre projetos/pastas
    - Enter para abrir projeto selecionado
    - Delete para excluir (com confirmação)
    - _Requirements: 8.5_

- [x] 19. Implementar diálogos de confirmação
  - [x] 19.1 Criar diálogos para operações destrutivas
    - Confirmar exclusão de pasta (aviso sobre cascade)
    - Confirmar exclusão de projeto
    - _Requirements: 8.6_

- [x] 20. Checkpoint - Dashboard funcional
  - Testar navegação na árvore de pastas
  - Testar CRUD de projetos pelo Dashboard
  - Verificar persistência de estado de UI
  - Perguntar ao usuário se há dúvidas antes de prosseguir

---

### Fase 5: Integração do Excalidraw Canvas

- [x] 21. Instalar e configurar Excalidraw
  - [x] 21.1 Instalar pacote @excalidraw/excalidraw
    - Instalar dependência
    - Configurar bundler para Excalidraw (chunks, workers)
    - _Requirements: 1.1_

  - [x] 21.2 Criar página de editor
    - Criar pages/project/[id].tsx
    - Configurar rota protegida
    - Exibir botão de retorno ao Dashboard
    - _Requirements: 8.2_

- [x] 22. Implementar ExcalidrawCanvas wrapper
  - [x] 22.1 Criar componente ExcalidrawCanvas
    - Renderizar componente Excalidraw
    - Receber projectId e initialData como props
    - Expor API para controle externo
    - _Requirements: 1.1, 1.2_

  - [x] 22.2 Implementar carregamento de projeto
    - Buscar projeto do banco via API
    - Carregar canvasData inicial no Excalidraw
    - Tratar projeto não encontrado
    - _Requirements: 1.3, 6.6_

  - [x] 22.3 Implementar exportação de projeto
    - Usar exportToBlob para gerar arquivo .excalidraw
    - Disponibilizar botão de export
    - _Requirements: 1.4_

  - [ ]* 22.4 Escrever testes de propriedade para round-trip de serialização
    - **Property 1: Round-trip de serialização Excalidraw**
    - **Validates: Requirements 1.3, 1.4, 1.5**
    - Verificar que dados serializados/deserializados mantêm equivalência

- [x] 23. Checkpoint - Canvas básico funcional
  - Testar carregamento de projeto existente
  - Testar criação de novo projeto
  - Testar exportação de arquivo .excalidraw
  - Perguntar ao usuário se há dúvidas antes de prosseguir

---

### Fase 6: Auto-Save e Sincronização

- [x] 24. Implementar hook useAutoSave
  - [x] 24.1 Criar hook de auto-save com debounce
    - Debounce de 2 segundos (configurável)
    - Cancelar saves pendentes em novas alterações
    - Estados: isSaving, lastSaved, error
    - _Requirements: 6.1, 6.3_

  - [x] 24.2 Integrar auto-save com ExcalidrawCanvas
    - Escutar evento onChange do Excalidraw
    - Disparar auto-save com canvasData atualizado
    - Exibir indicador visual de salvamento
    - _Requirements: 6.2, 6.4, 8.3_

  - [ ]* 24.3 Escrever testes de propriedade para auto-save
    - **Property 4: Auto-save com debounce**
    - **Validates: Requirements 6.1, 6.3**
    - Simular múltiplas alterações rápidas e verificar único save

- [x] 25. Implementar tratamento de erros de salvamento
  - [x] 25.1 Implementar resiliência a falhas
    - Manter dados localmente (localStorage) em caso de falha
    - Exibir indicador visual de erro
    - Tentar novamente automaticamente a cada 10s
    - _Requirements: 6.5_

  - [ ]* 25.2 Escrever testes de propriedade para resiliência
    - **Property 12: Resiliência a falhas de persistência**
    - **Validates: Requirements 5.6, 6.5**
    - Simular falhas de rede e verificar preservação de dados

- [x] 26. Checkpoint - Auto-save funcional
  - Testar salvamento automático após alterações
  - Testar comportamento com falha de rede
  - Verificar debounce funcionando corretamente
  - Perguntar ao usuário se há dúvidas antes de prosseguir

---

### Fase 7: Thumbnails Automáticos

- [x] 27. Implementar gerador de thumbnails
  - [x] 27.1 Criar função generateThumbnail
    - Usar exportToBlob do Excalidraw
    - Configurar dimensões 200x150 pixels (aspect ratio 4:3)
    - Formato PNG com fundo branco
    - _Requirements: 4.2_

  - [x] 27.2 Criar endpoint de upload de thumbnail
    - POST /api/projects/:id/thumbnail
    - Armazenar como Base64 no banco
    - _Requirements: 4.2_

  - [x] 27.3 Integrar geração com auto-save
    - Gerar thumbnail após salvamento bem-sucedido
    - Otimização: não bloquear thread principal
    - Atualizar thumbnail apenas se conteúdo mudou
    - _Requirements: 4.5_

  - [ ]* 27.4 Escrever testes de propriedade para geração de thumbnail
    - **Property 6: Geração de thumbnail**
    - **Validates: Requirements 4.2, 4.5**
    - Verificar dimensões e formato para canvases variados

- [x] 28. Checkpoint - Thumbnails funcionais
  - Verificar geração automática após desenho
  - Verificar exibição correta no Dashboard
  - Perguntar ao usuário se há dúvidas antes de prosseguir

---

### Fase 8: Testes e Refinamentos

- [ ] 29. Implementar testes de integração
  - [ ] 29.1 Configurar ambiente de testes
    - Banco de dados de teste dedicado
    - Prisma migrate antes de cada suite
    - Cleanup entre testes
    - _Requirements: All_

  - [ ] 29.2 Escrever testes de integração para APIs
    - Testar CRUD de folders com banco real
    - Testar CRUD de projects com banco real
    - Testar isolamento entre usuários
    - _Requirements: 3.1-3.6, 5.1-5.6, 10.1-10.8_

  - [ ] 29.3 Escrever testes de integração para autenticação
    - Testar fluxo de cadastro
    - Testar fluxo de login
    - Testar proteção de rotas
    - _Requirements: 9.1-9.8_

- [ ] 30. Implementar testes E2E
  - [ ] 30.1 Configurar Playwright
    - Instalar e configurar Playwright
    - Configurar browser para testes
    - _Requirements: All_

  - [ ] 30.2 Escrever cenários E2E principais
    - Cadastro → Login → Criar projeto → Desenhar → Verificar auto-save → Logout
    - Login → Criar hierarquia de pastas → Mover projeto → Excluir pasta
    - Login → Duplicar projeto → Renomear → Verificar isolamento
    - _Requirements: All_

- [ ] 31. Escrever testes de propriedade restantes
  - [ ]* 31.1 Property 5: Exclusão em cascata de pastas
    - **Validates: Requirements 3.4, 10.8**
    - Verificar que exclusão remove todos os descendentes

  - [ ]* 31.2 Property 10: Validação de nomes
    - **Validates: Requirements 5.2, 4.3**
    - Verificar rejeição de strings com apenas whitespace

  - [ ]* 31.3 Property 11: Timestamp de modificação
    - **Validates: Requirements 3.3, 4.4, 5.4**
    - Verificar que updatedAt aumenta após modificações

- [ ] 32. Refinamentos finais
  - [ ] 32.1 Revisar mensagens de erro
    - Implementar todas as mensagens definidas no design
    - Internacionalização preparada (opcional)
    - _Requirements: 5.6, 8.3, 9.4_

  - [ ] 32.2 Revisar acessibilidade
    - Verificar navegação por teclado
    - Verificar labels e aria-labels
    - Verificar contraste de cores
    - _Requirements: 8.5_

  - [ ] 32.3 Otimização de performance
    - Code splitting para Excalidraw
    - Lazy loading de pastas na Sidebar
    - Otimização de queries Prisma
    - _Requirements: NFR-Desempenho 1, 2_

- [ ] 33. Checkpoint Final - Sistema completo
  - Executar todos os testes
  - Verificar cobertura de requisitos
  - Documentar quaisquer limitações conhecidas
  - Perguntar ao usuário se está pronto para deploy

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes baseados em propriedades validam comportamentos universais
- Testes unitários validam casos específicos e edge cases

## Requisitos de Segurança Implementados

- **HTTP em desenvolvimento**: Permitido quando NODE_ENV=development
- **HTTPS em produção**: Obrigatório quando NODE_ENV=production
- **Isolamento de dados**: Todas as queries filtradas por userId
- **Variáveis de ambiente**: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY nunca expostas no cliente
- **Validação de tokens**: JWT validado em cada requisição protegida
