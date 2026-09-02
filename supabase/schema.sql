-- =========================================================
-- Schema: Gerenciador de Demandas (Scrum/Kanban)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- USUARIOS
-- ---------------------------------------------------------
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  login text not null unique,
  senha_hash text not null,
  setor text not null default 'TI',
  permissao text not null default 'colaborador'
    check (permissao in ('admin', 'gestor', 'colaborador')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_usuarios_setor on usuarios (setor);

-- ---------------------------------------------------------
-- DEMANDAS
-- ---------------------------------------------------------
create table if not exists demandas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text default '',
  setor text not null,
  prioridade text not null default 'media'
    check (prioridade in ('baixa', 'media', 'alta')),
  prazo_valor integer not null default 1 check (prazo_valor > 0),
  prazo_unidade text not null default 'dias'
    check (prazo_unidade in ('dias', 'semanas', 'meses')),
  prazo_data date,
  status text not null default 'backlog'
    check (status in ('backlog', 'todo', 'em_andamento', 'revisao', 'concluido')),
  responsavel_id uuid references usuarios(id) on delete set null,
  criado_por uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_demandas_status on demandas (status);
create index if not exists idx_demandas_setor on demandas (setor);
create index if not exists idx_demandas_responsavel on demandas (responsavel_id);

-- ---------------------------------------------------------
-- COMENTARIOS (historico de acompanhamento de cada demanda)
-- ---------------------------------------------------------
create table if not exists demanda_comentarios (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid not null references demandas(id) on delete cascade,
  autor_id uuid references usuarios(id) on delete set null,
  mensagem text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comentarios_demanda on demanda_comentarios (demanda_id);

-- ---------------------------------------------------------
-- updated_at automatico
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_usuarios_updated_at on usuarios;
create trigger trg_usuarios_updated_at
  before update on usuarios
  for each row execute function set_updated_at();

drop trigger if exists trg_demandas_updated_at on demandas;
create trigger trg_demandas_updated_at
  before update on demandas
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- RLS: nenhuma política é criada de propósito.
-- Toda a aplicação acessa o banco pelo backend (rotas /api)
-- usando a SUPABASE_SERVICE_ROLE_KEY, que ignora RLS.
-- Isso impede qualquer acesso direto ao banco vindo do navegador.
-- ---------------------------------------------------------
alter table usuarios enable row level security;
alter table demandas enable row level security;
alter table demanda_comentarios enable row level security;

-- =========================================================
-- Depois de rodar este arquivo, crie o usuário administrador
-- executando `npm run seed` (ver README.md) — ele gera o hash
-- da senha corretamente com bcrypt.
-- =========================================================
