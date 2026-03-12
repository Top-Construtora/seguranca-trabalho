-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  evaluation_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer USER-DEFINED NOT NULL,
  observation text,
  evidence_urls ARRAY DEFAULT '{}'::text[],
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT answers_pkey PRIMARY KEY (id),
  CONSTRAINT answers_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.evaluations(id),
  CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.evaluations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  work_id uuid NOT NULL,
  accommodation_id uuid,
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  date date NOT NULL,
  employees_count integer NOT NULL,
  notes text,
  status USER-DEFINED DEFAULT 'draft'::evaluation_status,
  total_penalty numeric,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id),
  CONSTRAINT evaluations_accommodation_id_fkey FOREIGN KEY (accommodation_id) REFERENCES public.accommodations(id),
  CONSTRAINT evaluations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action USER-DEFINED NOT NULL,
  entity character varying NOT NULL,
  entity_id character varying,
  details jsonb,
  ip_address character varying NOT NULL,
  user_agent text NOT NULL,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT logs_pkey PRIMARY KEY (id),
  CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.penalty_table (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employees_min integer NOT NULL,
  employees_max integer NOT NULL,
  weight integer NOT NULL CHECK (weight >= 1 AND weight <= 4),
  min_value numeric NOT NULL,
  max_value numeric NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT penalty_table_pkey PRIMARY KEY (id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  text text NOT NULL,
  weight integer NOT NULL CHECK (weight >= 1 AND weight <= 4),
  type USER-DEFINED NOT NULL,
  is_active boolean DEFAULT true,
  order integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  role USER-DEFINED DEFAULT 'avaliador'::user_role,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.works (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  address text NOT NULL,
  responsible character varying NOT NULL,
  responsible_email character varying NOT NULL,
  responsible_phone character varying NOT NULL,
  number character varying NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT works_pkey PRIMARY KEY (id)
);
CREATE TABLE public.accommodations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT accommodations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.accommodation_works (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  accommodation_id uuid NOT NULL,
  work_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT accommodation_works_pkey PRIMARY KEY (id),
  CONSTRAINT accommodation_works_accommodation_id_fkey FOREIGN KEY (accommodation_id) REFERENCES public.accommodations(id) ON DELETE CASCADE,
  CONSTRAINT accommodation_works_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE,
  CONSTRAINT accommodation_works_unique UNIQUE (accommodation_id, work_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_work_id ON public.evaluations(work_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON public.evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_accommodation_id ON public.evaluations(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON public.evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON public.evaluations(type);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON public.evaluations(date);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON public.evaluations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_answers_evaluation_id ON public.answers(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);

CREATE INDEX IF NOT EXISTS idx_questions_type_active ON public.questions(type, is_active);

CREATE INDEX IF NOT EXISTS idx_penalty_table_weight ON public.penalty_table(weight, employees_min, employees_max);

CREATE INDEX IF NOT EXISTS idx_works_is_active ON public.works(is_active);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_accommodation_works_work_id ON public.accommodation_works(work_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_works_accommodation_id ON public.accommodation_works(accommodation_id);