# Documento de Requisitos

## Introdução

Sistema de quadro branco virtual baseado no Excalidraw Open Source com funcionalidades de gerenciamento de projetos em nuvem. A aplicação permite criar, organizar e sincronizar desenhos hierárquicos entre pastas e projetos, com persistência em PostgreSQL via Supabase.

## Glossário

- **Sistema**: A aplicação Excalidraw Clone com módulos de desenho e gerenciamento de projetos
- **Canvas**: Área de trabalho do Excalidraw onde os elementos são desenhados
- **Projeto**: Um arquivo de desenho salvo contendo dados do canvas e metadados
- **Pasta**: Contêiner hierárquico para organizar projetos e outras pastas
- **Dashboard**: Interface principal de gerenciamento de arquivos (file manager)
- **Thumbnail**: Imagem miniatura gerada automaticamente a partir do canvas
- **Auto-save**: Mecanismo de salvamento automático com debounce para otimização
- **Prisma**: ORM utilizado para comunicação com PostgreSQL
- **Supabase**: Plataforma de backend que hospeda o PostgreSQL e fornece autenticação
- **CanvasData**: Dados serializados do canvas no formato Excalidraw
- **CRUD**: Operações de Criar, Ler, Atualizar e Deletar
- **Usuário**: Indivíduo cadastrado no sistema com credenciais únicas
- **Isolamento de Dados**: Garantia de que usuários não acessam dados de outros usuários

---

## Requisitos

### Requisito 1: Integração do Excalidraw Core

**User Story:** Como usuário, quero acessar todas as ferramentas de desenho do Excalidraw para criar diagramas e ilustrações.

#### Acceptance Criteria

1. THE Canvas SHALL exibir o componente Excalidraw com todas as ferramentas de desenho padrão (retângulos, elipses, setas, texto, linhas, desenho livre)
2. THE Canvas SHALL suportar bibliotecas de formas (shape libraries) do Excalidraw
3. WHEN um arquivo .excalidraw for importado, THE Sistema SHALL carregar seu conteúdo no Canvas
4. WHEN o usuário exportar um desenho, THE Sistema SHALL gerar um arquivo .excalidraw válido
5. THE Canvas SHALL manter compatibilidade com o formato de arquivo do Excalidraw OSS

---

### Requisito 2: Dashboard Principal

**User Story:** Como usuário, quero visualizar e gerenciar todos os meus projetos salvos em uma interface centralizada.

#### Acceptance Criteria

1. THE Dashboard SHALL exibir a lista de projetos salvos com nome, data de modificação e thumbnail
2. WHEN um projeto for selecionado no Dashboard, THE Sistema SHALL carregar o projeto no Canvas
3. THE Dashboard SHALL exibir a estrutura hierárquica de pastas no painel lateral (sidebar)
4. WHEN uma pasta for expandida, THE Sidebar SHALL mostrar suas subpastas e projetos contidos
5. THE Dashboard SHALL persistir o estado da interface (pasta selecionada, modo de visualização) entre sessões

---

### Requisito 3: Estrutura de Pastas Hierárquica

**User Story:** Como usuário, quero organizar meus projetos em pastas aninhadas para manter meu trabalho estruturado.

#### Acceptance Criteria

1. WHEN uma nova pasta for criada, THE Sistema SHALL persisti-la no banco de dados com nome, ID do pai e timestamps
2. THE Sistema SHALL suportar aninhamento de pastas até no mínimo 5 níveis de profundidade
3. WHEN uma pasta for renomeada, THE Sistema SHALL atualizar seu nome e a data de modificação
4. WHEN uma pasta for excluída, THE Sistema SHALL remover recursivamente todas as subpastas e projetos contidos
5. THE Sistema SHALL impedir que uma pasta seja movida para dentro de si mesma ou de seus descendentes
6. WHEN uma pasta for movida, THE Sistema SHALL atualizar seu ID do pai mantendo a integridade da hierarquia

---

### Requisito 4: Metadados de Projetos

**User Story:** Como usuário, quero que meus projetos tenham informações claras e thumbnails automáticos para fácil identificação.

#### Acceptance Criteria

1. WHEN um novo projeto for criado, THE Sistema SHALL gerar um ID único, timestamps de criação e modificação
2. WHEN um projeto for salvo, THE Sistema SHALL gerar automaticamente um thumbnail em formato PNG com dimensões de 200x150 pixels
3. THE Sistema SHALL armazenar o nome do projeto com limite de 255 caracteres
4. WHEN um projeto for modificado, THE Sistema SHALL atualizar o timestamp de modificação
5. THE Sistema SHALL atualizar o thumbnail automaticamente quando o conteúdo do canvas for alterado e salvo

---

### Requisito 5: Operações CRUD de Projetos

**User Story:** Como usuário, quero gerenciar completamente meus projetos com operações de criar, renomear, duplicar, mover e excluir.

#### Acceptance Criteria

1. WHEN um novo projeto for criado, THE Sistema SHALL inicializar um canvas vazio e persistir os metadados no banco de dados
2. WHEN um projeto for renomeado, THE Sistema SHALL validar que o nome não está vazio e atualizar no banco de dados
3. WHEN um projeto for duplicado, THE Sistema SHALL criar uma cópia com nome sufixado "(cópia)", mesmo conteúdo e novo ID
4. WHEN um projeto for excluído, THE Sistema SHALL remover permanentemente seus dados do banco de dados
5. WHEN um projeto for movido entre pastas, THE Sistema SHALL atualizar seu ID da pasta pai no banco de dados
6. IF uma operação CRUD falhar, THE Sistema SHALL exibir uma mensagem de erro descritiva e manter o estado anterior

---

### Requisito 6: Sincronização e Persistência

**User Story:** Como usuário, quero que minhas alterações sejam salvas automaticamente na nuvem sem necessidade de intervenção manual.

#### Acceptance Criteria

1. WHEN o conteúdo do canvas for alterado, THE Sistema SHALL iniciar o auto-save após 2 segundos de inatividade (debounce)
2. WHEN o auto-save for executado, THE Sistema SHALL persistir o CanvasData no PostgreSQL via Prisma
3. IF múltiplas alterações ocorrerem em sequência, THE Sistema SHALL cancelar saves pendentes e agendar um novo save
4. WHEN um projeto for salvo com sucesso, THE Sistema SHALL atualizar o timestamp de modificação sem interromper o usuário
5. IF a conexão com o banco de dados falhar durante o save, THE Sistema SHALL exibir indicador visual de erro e tentar novamente
6. WHEN o usuário alternar entre projetos, THE Sistema SHALL carregar os dados do projeto selecionado do banco de dados

---

### Requisito 7: Modelagem de Dados e Schema Prisma

**User Story:** Como desenvolvedor, quero um schema de banco de dados bem definido para garantir integridade e performance.

#### Acceptance Criteria

1. THE Prisma Schema SHALL definir o modelo User com campos: id, email, createdAt, updatedAt (gerenciado pelo Supabase Auth)
2. THE Prisma Schema SHALL definir o modelo Folder com campos: id, name, parentId, userId, createdAt, updatedAt
3. THE Prisma Schema SHALL definir o modelo Project com campos: id, name, folderId, userId, canvasData, thumbnail, createdAt, updatedAt
4. THE Folder model SHALL ter relação opcional com Folder (auto-referência) para suportar hierarquia
5. THE Project model SHALL ter relação obrigatória com Folder para garantir organização
6. THE Folder e Project models SHALL ter relação obrigatória com User para garantir isolamento de dados
7. THE Prisma Schema SHALL usar o provider postgresql conectado à DATABASE_URL do arquivo .env
8. WHEN as migrations forem executadas, THE Prisma SHALL criar as tabelas no PostgreSQL com índices apropriados para consultas por folderId, userId e updatedAt
9. THE canvasData field SHALL armazenar dados JSON compatíveis com o formato de arquivo .excalidraw

---

### Requisito 8: Interface e Experiência do Usuário

**User Story:** Como usuário, quero uma interface intuitiva e responsiva que siga o padrão visual do Excalidraw.

#### Acceptance Criteria

1. THE Dashboard SHALL seguir o design minimalista do Excalidraw com fundo claro e elementos sutis
2. WHEN o usuário estiver editando um projeto, THE Sistema SHALL exibir botão de retorno ao Dashboard
3. THE Sistema SHALL exibir indicador visual durante operações de salvamento (loading state)
4. WHEN uma operação CRUD estiver em andamento, THE Sistema SHALL desabilitar ações concorrentes sobre o mesmo recurso
5. THE Sistema SHALL suportar navegação por teclado no Dashboard (setas, Enter, Delete)
6. THE Dashboard SHALL exibir diálogos de confirmação para operações destrutivas (excluir pasta, excluir projeto)

---

### Requisito 9: Sistema de Autenticação Básico

**User Story:** Como usuário, quero fazer login na aplicação para que meus projetos sejam salvos e protegidos de outros usuários.

#### Acceptance Criteria

1. WHEN um usuário não autenticado acessar a aplicação, THE Sistema SHALL redirecioná-lo para a tela de login
2. WHEN um novo usuário se cadastrar, THE Sistema SHALL criar uma conta com email e senha utilizando Supabase Auth
3. WHEN um usuário realizar login com credenciais válidas, THE Sistema SHALL autenticá-lo e redirecioná-lo ao Dashboard
4. WHEN um usuário realizar login com credenciais inválidas, THE Sistema SHALL exibir mensagem de erro apropriada
5. WHEN um usuário clicar em "Sair", THE Sistema SHALL encerrar a sessão e redirecioná-lo para a tela de login
6. THE Sistema SHALL persistir a sessão do usuário entre recarregamentos de página (session storage ou cookies)
7. THE Sistema SHALL validar que o email fornecido está em formato válido durante o cadastro
8. THE Sistema SHALL exigir senha com no mínimo 8 caracteres durante o cadastro

---

### Requisito 10: Isolamento de Dados entre Usuários

**User Story:** Como usuário, quero que meus projetos e pastas sejam privados e inacessíveis a outros usuários do sistema.

#### Acceptance Criteria

1. WHEN um usuário acessar o Dashboard, THE Sistema SHALL exibir apenas os projetos e pastas pertencentes àquele usuário
2. WHEN um usuário tentar acessar um projeto de outro usuário (via URL direta), THE Sistema SHALL negar o acesso e exibir erro 403
3. WHEN um usuário tentar acessar uma pasta de outro usuário (via URL direta), THE Sistema SHALL negar o acesso e exibir erro 403
4. THE Prisma Schema SHALL incluir campo `userId` nos modelos Folder e Project para associar dados ao usuário proprietário
5. WHEN uma pasta for criada, THE Sistema SHALL associá-la automaticamente ao usuário autenticado
6. WHEN um projeto for criado, THE Sistema SHALL associá-lo automaticamente ao usuário autenticado
7. THE Sistema SHALL filtrar automaticamente todas as consultas ao banco de dados pelo ID do usuário autenticado
8. WHEN um usuário for excluído, THE Sistema SHALL remover todos os seus projetos e pastas em cascata

---

## Requisitos Não-Funcionais

### Desempenho

1. THE auto-save SHALL ter debounce de no mínimo 2 segundos para evitar sobrecarga de requisições
2. THE thumbnail generation SHALL ser otimizada para não bloquear a thread principal

### Segurança

3. THE DATABASE_URL SHALL ser mantida em variáveis de ambiente, nunca exposta no código cliente
4. THE Sistema SHALL sanitizar nomes de pastas e projetos para prevenir injeção de código
5. WHEN NODE_ENV for "production", THE Sistema SHALL usar HTTPS para todas as comunicações entre cliente e servidor
6. WHEN NODE_ENV for "development", THE Sistema SHALL permitir HTTP para facilitar testes locais
7. THE Sistema SHALL hashear senhas utilizando algoritmos seguros fornecidos pelo Supabase Auth
8. THE Sistema SHALL validar tokens JWT em cada requisição autenticada

### Confiabilidade

5. IF uma operação de salvamento falhar, THE Sistema SHALL preservar os dados localmente até sincronização bem-sucedida
6. THE Sistema SHALL manter integridade referencial ao excluir pastas com projetos

---

## Dependências Técnicas

- React.js ^18.x
- TypeScript ^5.x
- Excalidraw (última versão estável do OSS)
- Prisma ^5.x
- PostgreSQL (via Supabase)
- Node.js ^18.x (ambiente de desenvolvimento)

---

## Restrições

- Não implementar colaboração em tempo real entre usuários (sincronização apenas local-servidor)
- Não implementar compartilhamento de projetos entre usuários
- Não implementar recuperação de senha por email nesta fase
- Não implementar login social (Google, GitHub, etc.) nesta fase
- Compatibilidade apenas com navegadores modernos (Chrome, Firefox, Safari, Edge últimas 2 versões)
