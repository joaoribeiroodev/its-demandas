-- =========================================================
-- Migração 004 — Anexos (arquivos vinculados a demandas ou projetos)
-- Rode no SQL Editor do Supabase (não apaga nada existente).
-- =========================================================

-- Bucket privado no Supabase Storage. Fica privado de propósito: assim
-- como o resto do sistema, todo acesso passa pelo backend (rotas /api)
-- usando a service_role key — nunca é acessado direto pelo navegador.
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- ARQUIVOS
-- ---------------------------------------------------------
create table if not exists arquivos (
  id uuid primary key default gen_random_uuid(),
  nome_original text not null,
  caminho_storage text not null unique,
  tipo_mime text,
  tamanho_bytes bigint,

  -- Vínculo: um arquivo pertence a UMA demanda OU a UM projeto, nunca os dois.
  demanda_id uuid references demandas(id) on delete cascade,
  projeto_id uuid references projetos(id) on delete cascade,

  enviado_por uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint arquivos_vinculo_check check (
    (demanda_id is not null and projeto_id is null) or
    (demanda_id is null and projeto_id is not null)
  )
);

create index if not exists idx_arquivos_demanda on arquivos (demanda_id);
create index if not exists idx_arquivos_projeto on arquivos (projeto_id);

alter table arquivos enable row level security;

-- =========================================================
-- Fim da migração 004.
-- =========================================================
