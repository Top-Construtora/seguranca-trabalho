# Sistema de Índice de Saúde e Segurança do Trabalho

Sistema web para gestão e avaliação de condições de saúde e segurança em obras e alojamentos, com geração de relatórios e planos de ação.

## 🚀 Funcionalidades Principais

- **Gestão de Obras**: Cadastro e gerenciamento de obras/locais de trabalho
- **Avaliações de Segurança**: Sistema de questionários com pontuação ponderada
- **Planos de Ação**: Criação de planos corretivos para não conformidades
- **Relatórios**: Geração de relatórios em PDF e Excel
- **Dashboard**: Visualização de métricas e indicadores
- **Sistema de Logs**: Auditoria completa de todas as ações
- **Autenticação**: Sistema de login com diferentes níveis de acesso (Admin/Avaliador)

## 📋 Pré-requisitos

- Node.js (v18 ou superior)
- PostgreSQL (via Supabase)
- pnpm (gerenciador de pacotes)

## 🛠️ Tecnologias Utilizadas

### Backend
- NestJS
- TypeORM
- PostgreSQL (Supabase)
- JWT Authentication
- Swagger API Documentation

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Radix UI
- React Query
- React Hook Form
- Zod (validação)

## ⚙️ Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd seguranca-trabalho
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:

### Backend (.env)
```env
# Database
DATABASE_URL=
# ou
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

# JWT
JWT_SECRET=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=s
```

### Frontend (.env)
```env
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

4. Configure o banco de dados:

O schema do banco está em `backend/src/database/schema.sql`. Execute-o no seu banco PostgreSQL.

5. Popule dados iniciais (opcional):
```bash
pnpm --filter backend seed
```

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento (ambos frontend e backend):
```bash
pnpm dev
```

### Apenas Backend:
```bash
pnpm --filter backend dev
```

### Apenas Frontend:
```bash
pnpm --filter frontend dev
```

### Build para produção:
```bash
pnpm build
```

## 📁 Estrutura do Projeto

```
seguranca-trabalho/
├── backend/                # API NestJS
│   ├── src/
│   │   ├── modules/       # Módulos da aplicação
│   │   │   ├── auth/      # Autenticação
│   │   │   ├── users/     # Gestão de usuários
│   │   │   ├── works/     # Gestão de obras
│   │   │   ├── questions/ # Questionários
│   │   │   ├── evaluations/ # Avaliações
│   │   │   ├── action-plans/ # Planos de ação
│   │   │   ├── reports/   # Relatórios
│   │   │   └── logs/      # Sistema de logs
│   │   ├── database/      # Configuração e schema
│   │   └── common/        # Serviços compartilhados
│   └── package.json
│
├── frontend/              # Interface React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── services/    # Serviços de API
│   │   ├── hooks/       # React Hooks customizados
│   │   └── contexts/    # Contextos React
│   └── package.json
│
└── package.json          # Configuração do workspace
```

## 📱 Páginas Principais

- **Login**: Autenticação de usuários
- **Dashboard**: Visão geral do sistema
- **Obras**: Gestão de locais de trabalho
- **Avaliações**: Realizar e visualizar avaliações
- **Planos de Ação**: Criar e gerenciar planos corretivos
- **Relatórios**: Gerar e exportar relatórios
- **Usuários**: Gestão de usuários (Admin)

## 🔐 Níveis de Acesso

- **Administrador**: Acesso total ao sistema
- **Avaliador**: Pode realizar avaliações e criar planos de ação

## 📊 Funcionalidades de Avaliação

O sistema calcula automaticamente:
- Pontuação total baseada em pesos das questões
- Identificação de não conformidades
- Sugestões de planos de ação
- Histórico de avaliações

## 📝 Planos de Ação

- Criação automática para questões não conformes
- Upload de arquivos de evidência
- Definição de prazos
- Acompanhamento de status

## 📈 Relatórios

- Exportação em PDF e Excel
- Relatórios por obra
- Relatórios consolidados
- Histórico de avaliações

## 🧪 Testes

### Backend:
```bash
pnpm --filter backend test        # Testes unitários
pnpm --filter backend test:e2e    # Testes E2E
pnpm --filter backend test:cov    # Coverage
```

### Frontend:
```bash
pnpm --filter frontend test
```

## 📚 Documentação da API

A documentação da API está disponível via Swagger em:
```
http://localhost:3000/api
```

## 🚢 Deploy

O sistema está configurado para deploy na Vercel (frontend) e Render (backend).

### Deploy Frontend (Vercel):
```bash
pnpm --filter frontend build
```

### Deploy Backend (Render):
```bash
pnpm --filter backend build
pnpm --filter backend start:prod
```

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.


---

**Nota**: Certifique-se de configurar corretamente as variáveis de ambiente antes de executar o sistema em produção.
