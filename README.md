# Sistema de Saúde e Segurança do Trabalho (SST)

![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169e1?logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/Licenca-Privado-red)

Sistema web para gestao e avaliacao de condicoes de saude e seguranca em obras e alojamentos, com registro de acidentes, planos de acao, relatorios e auditoria completa. Monorepo com frontend React e backend NestJS, ambos em TypeScript.

---

## Funcionalidades

### Avaliacoes de Seguranca
- **Questionarios ponderados** por tipo (obra / alojamento) com pesos de 1 a 4
- **Calculo automatico** de pontuacao, penalidades e nao conformidades
- **Tabela de penalidades** escalonada por quantidade de funcionarios
- **Rascunho e finalizacao** de avaliacoes
- **Historico completo** por obra

### Gestao de Acidentes
- **Registro de acidentes/incidentes** com severidade (leve, moderado, grave, fatal)
- **Tipos**: queda de altura, choque eletrico, queimadura, esmagamento, etc.
- **Silhueta corporal** interativa para marcar partes do corpo afetadas
- **Upload de evidencias** (fotos, documentos)
- **Investigacoes** com causa raiz, achados e recomendacoes
- **Acoes corretivas** com responsavel, prazo e acompanhamento
- **Dashboard analitico** de acidentes

### Planos de Acao
- Criacao automatica para questoes nao conformes
- Upload de arquivos de evidencia
- Definicao de prazos e responsaveis
- Acompanhamento de status

### Relatorios & Exportacao
- **Relatorios por obra** e consolidados
- Exportacao em **PDF** (PDFKit) e **Excel** (ExcelJS)
- **Ranking** de obras por indice de seguranca
- **Dashboard** com metricas e graficos (Chart.js, Recharts)
- Filtros avancados e comparativos

### Gestao Organizacional
- **Obras** com endereco, responsavel e contato
- **Alojamentos** vinculados a obras (N:N)
- **Usuarios** com 2 papeis: Admin e Avaliador
- **Documentos** por obra
- **Auditoria** completa de todas as acoes (logs)
- **Tema escuro/claro**

---

## Arquitetura

```
seguranca-trabalho/
├── frontend/          # React 18 + Vite + Tailwind + Radix UI
├── backend/           # NestJS 10 + TypeORM + PostgreSQL
├── docs/              # Documentacao de modulos
├── pnpm-workspace.yaml
└── package.json       # Scripts do monorepo
```

**Gerenciador de pacotes**: pnpm

---

## Pre-requisitos

- [Node.js](https://nodejs.org/) >= 18.x
- [pnpm](https://pnpm.io/) >= 8.x
- Conta no [Supabase](https://supabase.com/) com projeto PostgreSQL

## Instalacao

```bash
# Instalar todas as dependencias
pnpm install

# Configurar banco de dados (executar no Supabase SQL Editor)
# Schema em: backend/src/database/schema.sql

# Popular dados iniciais (admin, alojamentos, tabela de penalidades)
pnpm --filter backend seed
```

## Executando

```bash
# Frontend + Backend simultaneamente (recomendado)
pnpm dev

# Apenas frontend (http://localhost:3000)
pnpm --filter frontend dev

# Apenas backend (http://localhost:3333)
pnpm --filter backend dev
```

## Build & Deploy

```bash
# Build completo
pnpm build

# Build individual
pnpm --filter frontend build    # Gera dist/ estatico
pnpm --filter backend build     # Compila TypeScript para dist/

# Producao (backend)
pnpm --filter backend start:prod
```

## Testes

```bash
# Backend
pnpm --filter backend test          # Testes unitarios (Jest)
pnpm --filter backend test:watch    # Watch mode
pnpm --filter backend test:cov      # Com cobertura
pnpm --filter backend test:e2e      # Testes E2E

# Lint e formatacao
pnpm lint
pnpm format
```

---

## Frontend

### Estrutura

```
frontend/src/
├── components/
│   ├── ui/                  # 16 componentes Radix UI customizados
│   │   ├── Button, Input, Select, Dialog, Card, Tabs...
│   │   ├── AlertDialog, Badge, Checkbox, Progress...
│   │   └── ImageModal, Pagination, Skeleton, Toaster
│   ├── accidents/           # AccidentCard, AccidentForm, BodySilhouette,
│   │                          AccidentFilters, EvidenceUploadModal, CorrectiveActionModal
│   ├── evaluations/         # EvaluationForm, EvaluationsList, ActionPlanTab, QuestionForm
│   ├── reports/             # ReportCharts, ReportComparison, ReportFilters,
│   │                          ReportMetrics, StatsCard, SimpleBarChart
│   ├── charts/              # BarChart, ChartModal
│   ├── works/               # WorkForm, WorksList
│   ├── auth/                # ChangePasswordModal, ForceChangePasswordModal
│   ├── layouts/             # DashboardLayout
│   └── ProtectedRoute.tsx
├── pages/                   # 18+ paginas
│   ├── LoginPage
│   ├── DashboardPage
│   ├── WorksPage
│   ├── EvaluationsPage / EvaluationEditPage / EvaluationReportPage
│   ├── RankingPage
│   ├── ReportsPage (3 variantes com filtros avancados)
│   ├── ActionPlansPage
│   ├── AccidentsPage / AccidentFormPage / AccidentDetailsPage / AccidentDashboardPage
│   ├── CorrectiveActionsPage
│   ├── UsersPage / UserFormPage
│   ├── ProfilePage
│   └── documents/ (ListDocuments, CreateDocument, EditDocument)
├── services/                # 11 servicos de API
│   ├── api.ts                      # Axios com interceptor JWT
│   ├── auth.service.ts
│   ├── accidents.service.ts
│   ├── evaluations.service.ts
│   ├── questions.service.ts
│   ├── works.service.ts
│   ├── users.service.ts
│   ├── reports.service.ts
│   ├── documents.service.ts
│   ├── files.service.ts
│   └── actionPlanFiles.service.ts
├── hooks/                   # 10 hooks customizados
│   ├── useAccidents, useEvaluations, useWorks, useUsers
│   ├── useQuestions, useActionPlans, useAccommodations
│   └── useTypingEffect, use-toast
├── contexts/
│   ├── AuthContext.tsx       # JWT + sessionStorage
│   └── ThemeContext.tsx      # Tema escuro/claro
├── types/                   # Definicoes TypeScript
├── utils/                   # penaltyCalculator, date, currency
└── lib/                     # Supabase client, utils
```

### Principais Bibliotecas

| Biblioteca | Uso |
|---|---|
| **React 18** | Framework UI |
| **Vite** | Build tool com HMR |
| **Tailwind CSS** | Estilizacao utility-first |
| **Radix UI** | Componentes acessiveis sem estilo |
| **React Query** (TanStack) | Cache e estado do servidor |
| **React Hook Form** + **Zod** | Formularios com validacao |
| **Axios** | Cliente HTTP com interceptors |
| **Chart.js** + **Recharts** | Graficos e visualizacoes |
| **Lucide React** | Icones SVG |
| **Sonner** | Notificacoes toast |
| **date-fns** | Manipulacao de datas |

### Variaveis de Ambiente (frontend)

Crie `frontend/.env`:

```env
VITE_API_URL=http://localhost:3333
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

---

## Backend

### Estrutura

```
backend/src/
├── main.ts                  # Bootstrap NestJS (porta 3333)
├── app.module.ts            # Registro de todos os modulos
├── config/
│   └── database.config.ts   # TypeORM + PostgreSQL
├── modules/
│   ├── auth/                # JWT + Passport (login, logout, troca de senha)
│   │   ├── strategies/      # jwt.strategy.ts
│   │   ├── guards/          # jwt-auth.guard.ts, roles.guard.ts
│   │   └── decorators/      # @CurrentUser, @Public, @Roles
│   ├── users/               # CRUD de usuarios (admin/avaliador)
│   ├── works/               # CRUD de obras + alojamentos
│   ├── questions/           # Questionarios com pesos e reordenacao
│   ├── evaluations/         # Avaliacoes + respostas + planos de acao
│   ├── reports/             # Geracao de PDF e Excel
│   ├── accidents/           # Acidentes + investigacoes + acoes corretivas
│   ├── files/               # Upload de arquivos (Multer, 10MB)
│   ├── documents/           # Documentos por obra
│   └── logs/                # Auditoria de acoes
├── database/
│   ├── schema.sql           # Schema completo PostgreSQL
│   ├── seed.ts              # Script de inicializacao
│   └── seeds/               # admin-user, accommodations, penalty-table
└── common/                  # Servicos compartilhados
```

### Endpoints da API

#### Autenticacao (`/api/auth`)
| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/login` | Login com email/senha |
| POST | `/logout` | Logout |
| GET | `/profile` | Perfil do usuario autenticado |
| POST | `/change-password` | Trocar senha |

#### Usuarios (`/api/users`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar usuarios |
| POST | `/` | Criar usuario |
| GET | `/:id` | Detalhes do usuario |
| PUT | `/:id` | Atualizar usuario |
| DELETE | `/:id` | Remover usuario |

#### Obras (`/api/works`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar obras |
| POST | `/` | Criar obra |
| GET | `/:id` | Detalhes da obra |
| PUT | `/:id` | Atualizar obra |
| DELETE | `/:id` | Remover obra |

#### Avaliacoes (`/api/evaluations`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar avaliacoes |
| POST | `/` | Criar avaliacao |
| GET | `/:id` | Detalhes da avaliacao |
| PUT | `/:id` | Atualizar avaliacao |
| POST | `/:id/answers` | Salvar respostas |
| PUT | `/:id/answers` | Atualizar respostas |

#### Planos de Acao (`/api/action-plans`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar planos de acao |
| GET | `/:id` | Detalhes do plano |
| PUT | `/:id` | Atualizar plano |
| POST | `/:id/files` | Upload de evidencia |

#### Acidentes (`/api/accidents`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Listar acidentes (com filtros) |
| POST | `/` | Registrar acidente |
| GET | `/:id` | Detalhes do acidente |
| PUT | `/:id` | Atualizar acidente |
| DELETE | `/:id` | Remover acidente |
| POST | `/:id/evidence` | Upload de evidencia |
| POST | `/:id/corrective-actions` | Criar acao corretiva |
| POST | `/:id/investigations` | Criar investigacao |
| GET | `/dashboard` | Dashboard analitico |

#### Relatorios (`/api/reports`)
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/` | Relatorio geral com filtros |
| GET | `/pdf` | Exportar PDF |
| GET | `/excel` | Exportar Excel |
| GET | `/ranking` | Ranking de obras |

#### Outros
| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/api/questions` | Listar questionarios |
| CRUD | `/api/documents` | Documentos por obra |
| GET | `/api/health` | Health check |

### Documentacao Swagger

Disponivel em `http://localhost:3333/api` com todos os endpoints documentados.

### Variaveis de Ambiente (backend)

Crie `backend/.env`:

```env
# Servidor
PORT=3333
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Banco de dados (opcao 1: connection string)
DATABASE_URL=postgresql://user:pass@host:5432/database

# Banco de dados (opcao 2: parametros individuais)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua-senha
DB_NAME=seguranca_trabalho

# JWT
JWT_SECRET=sua-chave-secreta

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-key

# E-mail (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
```

---

## Banco de Dados

### Tabelas principais

| Grupo | Tabelas |
|---|---|
| **Usuarios** | `users` (admin, avaliador) |
| **Obras** | `works`, `accommodations`, `accommodation_works` |
| **Avaliacoes** | `evaluations`, `questions`, `answers`, `penalty_table`, `action_plans` |
| **Acidentes** | `accidents`, `accident_body_parts`, `accident_evidence`, `accident_corrective_actions`, `accident_investigations` |
| **Documentos** | `documents` |
| **Auditoria** | `logs` |

### Entidades principais

| Entidade | Campos chave |
|---|---|
| **User** | id, name, email, password_hash, role (admin/avaliador), is_active, must_change_password |
| **Work** | id, name, address, responsible, responsible_email, number |
| **Evaluation** | id, work_id, user_id, type (obra/alojamento), employees_count, status, total_penalty |
| **Question** | id, text, weight (1-4), type, is_active, order |
| **Answer** | id, evaluation_id, question_id, answer, observation, evidence_urls |
| **Accident** | id, title, accident_date, severity, type, status, days_away, victim_name |
| **ActionPlan** | id, evaluation_id, question_id, status |
| **Document** | id, work_id, title, file_url, uploaded_by |

### Niveis de Acesso

| Papel | Acesso |
|---|---|
| **Admin** | Acesso total: usuarios, obras, avaliacoes, acidentes, relatorios, configuracoes |
| **Avaliador** | Avaliacoes, planos de acao, registro de acidentes, visualizacao de relatorios |

---

## Seguranca

- **Helmet** para headers HTTP seguros
- **CORS** com whitelist de origens permitidas
- **Rate Limiting** contra abuso de requisicoes
- **JWT** com Passport strategies
- **bcrypt** para hash de senhas
- **Guards de rota** por papel no frontend e backend
- **class-validator** para validacao de DTOs
- **Auditoria** completa de todas as acoes com IP e user-agent

## Deploy

| Componente | Plataforma |
|---|---|
| Frontend | Vercel (build estatico) |
| Backend | Render (Node.js) |
| Banco de dados | Supabase (PostgreSQL gerenciado) |
| Arquivos | `/uploads` local ou Supabase Storage |

---

Desenvolvido para **Top Construtora**
