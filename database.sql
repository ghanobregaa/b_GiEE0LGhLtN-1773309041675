-- ============================================================
-- Database Schema for Project Management System
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- Criar tipos ENUM (ignora erro se já existirem)
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('Novo', 'Em curso', 'Concluído', 'Suspenso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('Pendente', 'Em curso', 'Concluído');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE phase_type AS ENUM ('Requisitos', 'Desenvolvimento', 'Testes', 'Documentação');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE company_name AS ENUM ('SAVOY', 'AFA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tabela PROJECTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT NOT NULL,
    status project_status DEFAULT 'Novo',
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    planned_hours FLOAT DEFAULT 0,
    actual_start_date DATE,
    actual_end_date DATE,
    actual_hours FLOAT DEFAULT 0,
    company company_name NOT NULL DEFAULT 'SAVOY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Tabela PHASES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type phase_type NOT NULL,
    name TEXT NOT NULL,
    technician_id UUID REFERENCES users(id), -- Alterado para ID
    technician TEXT, -- Manter temporariamente para compatibilidade
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    planned_hours FLOAT DEFAULT 0,
    actual_start_date DATE,
    actual_end_date DATE,
    actual_hours FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
 Broadway
-- ─── Tabela TASKS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ticket TEXT,
    technician_id UUID REFERENCES users(id), -- Alterado para ID
    technician TEXT, -- Manter temporariamente para compatibilidade
    requester TEXT NOT NULL,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    planned_hours FLOAT DEFAULT 0,
    actual_start_date DATE,
    actual_end_date DATE,
    actual_hours FLOAT DEFAULT 0,
    status task_status DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
 Broadway
-- ─── Desactivar RLS (usamos service_role key no backend) ────
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- ─── Adicionar phase_id a tasks (run this if table already exists) ──────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES phases(id) ON DELETE SET NULL;

-- ─── Adicionar company a projects (run this if table already exists) ────────
DO $$ BEGIN
    CREATE TYPE company_name AS ENUM ('SAVOY', 'AFA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company company_name NOT NULL DEFAULT 'SAVOY';

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('técnico', 'visitante');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tabela USERS ───────────────────────────────────────────
-- Simplificado para apenas uma password de sistema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL DEFAULT 'admin',
    password_hash TEXT NOT NULL,
    name TEXT DEFAULT 'Utilizador',
    color TEXT DEFAULT '#6366f1',
    role user_role DEFAULT 'técnico',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Password inicial: devafa
INSERT INTO users (username, password_hash, name, color)
VALUES ('admin', 'scrypt:32768:8:1$Wqry7vzss6iRvfsR$23cc1d6ad356a088319eb4906c700beca02630fb3065b9f9efc00e044a1d3d7e7c1cb771e8389fee4b292423ea47989af33a42b97ae6f94ebe208ba4ae33ed0c', 'Gestor', '#6366f1')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ─── Tabela MEETINGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TEXT DEFAULT '09:00',
    duration_hours FLOAT DEFAULT 0,
    technicians JSONB DEFAULT '[]'::jsonb,
    attendees TEXT,
    notes TEXT,
    checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
