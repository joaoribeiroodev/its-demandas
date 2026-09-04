-- =========================================================
-- Schema completo — ITS-Demandas
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (em um projeto novo, ou depois de rodar drop_all.sql).
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- USUARIOS
-- ---------------------------------------------------------
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  login text not null unique,
  senha_hash text not null,
  setor text not null default 'TI',
  permissao text not null default 'colaborador'
    check (permissao in ('admin', 'gestor', 'colaborador')),
  ativo boolean not null default true,

  -- Segurança de login: bloqueio por tentativas incorretas (força bruta).
  tentativas_login_falhas integer not null default 0,
  bloqueado_ate timestamptz,

  -- Incrementar este número invalida imediatamente qualquer sessão já
  -- aberta desse usuário (o token antigo guarda a versão anterior e deixa
  -- de bater com este valor). Disparado ao trocar senha, desativar, ou
  -- manualmente pelo botão "Encerrar sessões".
  sessao_versao integer not null default 1,
  ultimo_login timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_usuarios_setor on usuarios (setor);

-- ---------------------------------------------------------
-- PROJETOS (agrupamento dinâmico de demandas, com progresso %)
-- ---------------------------------------------------------
create table projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text not null default '#1a9e6e',
  criado_por uuid references usuarios(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- DEMANDAS
-- ---------------------------------------------------------
create table demandas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text default '',       -- Markdown (título + notas de contexto)

  -- Organização (opcionais: um item recém-capturado no Inbox pode não ter nada disso ainda)
  -- "setor" é o Setor Responsável (quem executa/é dono da demanda — nome de
  -- coluna mantido por compatibilidade, embora a interface o chame de
  -- "Setor Responsável"). "setor_direcionado" é o setor que pediu/precisa
  -- da demanda (o solicitante) — só informativo, não afeta visibilidade.
  setor text,
  setor_direcionado text,
  projeto_id uuid references projetos(id) on delete set null,
  responsavel_id uuid references usuarios(id) on delete set null,
  tags text[] not null default '{}',

  -- Demanda de equipe: pertence a um setor inteiro (todo mundo daquele
  -- setor visualiza e usa), não a uma pessoa. Só gestor/admin pode criar,
  -- excluir ou atribuir (responsavel_id) uma demanda de equipe — mas ela
  -- continua pertencendo ao setor mesmo depois de atribuída.
  equipe boolean not null default false,

  -- Priorização e esforço
  prioridade text not null default 'media'
    check (prioridade in ('baixa', 'media', 'alta')),
  energia text
    check (energia is null or energia in ('leve', 'moderada', 'profunda')),
  duracao_estimada_min integer
    check (duracao_estimada_min is null or duracao_estimada_min > 0),

  -- Prazo (data-limite) — opcional
  prazo_valor integer check (prazo_valor is null or prazo_valor > 0),
  prazo_unidade text check (prazo_unidade is null or prazo_unidade in ('dias', 'semanas', 'meses')),
  prazo_data date,

  -- "Meu Dia": data em que o usuário planejou executar a tarefa
  foco_dia_data date,

  -- Fluxo. "inbox" = ainda não triado; não aparece no quadro Kanban.
  status text not null default 'inbox'
    check (status in ('inbox', 'backlog', 'todo', 'em_andamento', 'revisao', 'concluido')),

  -- "Concluído" é uma coluna do Kanban como qualquer outra; "encerrada" é
  -- um passo extra e opcional de arquivamento: ao encerrar, a demanda sai
  -- do quadro Kanban (todas as colunas) e passa a existir só no Logbook,
  -- com a possibilidade de ser reaberta por lá (o que zera este campo).
  encerrada boolean not null default false,

  -- Recorrência. Ao concluir uma demanda recorrente, o backend cria
  -- automaticamente a próxima ocorrência com base em recorrencia_regra.
  -- recorrencia_regra guarda um destes formatos (campo "tipo" decide o resto):
  --   {"tipo":"intervalo", "intervalo":2, "unidade":"semanas"}              -> a cada 2 semanas
  --   {"tipo":"semanal_dias", "dias_semana":[1,3,5]}                        -> toda seg/qua/sex (0=domingo)
  --   {"tipo":"mensal_dia_fixo", "dia_mes":10}                             -> todo dia 10 do mês
  --   {"tipo":"mensal_posicional", "posicao":-1, "dia_semana_pos":5}       -> toda última sexta-feira do mês
  --                                                                           (posicao: 1..4 = primeira..quarta, -1 = última)
  recorrente boolean not null default false,
  recorrencia_regra jsonb,

  criado_por uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint demandas_equipe_setor_check check (not equipe or setor is not null)
);

create index idx_demandas_status on demandas (status);
create index idx_demandas_setor on demandas (setor);
create index idx_demandas_responsavel on demandas (responsavel_id);
create index idx_demandas_projeto on demandas (projeto_id);
create index idx_demandas_foco_dia on demandas (foco_dia_data);
create index idx_demandas_tags on demandas using gin (tags);
create index idx_demandas_equipe on demandas (equipe);
create index idx_demandas_encerrada on demandas (encerrada);

-- ---------------------------------------------------------
-- SUBTAREFAS (checklist dentro de uma demanda)
-- ---------------------------------------------------------
create table demanda_subtarefas (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid not null references demandas(id) on delete cascade,
  titulo text not null,
  concluida boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_subtarefas_demanda on demanda_subtarefas (demanda_id);

-- ---------------------------------------------------------
-- COMENTARIOS (historico de acompanhamento de cada demanda)
-- ---------------------------------------------------------
create table demanda_comentarios (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid not null references demandas(id) on delete cascade,
  autor_id uuid references usuarios(id) on delete set null,
  mensagem text not null,
  created_at timestamptz not null default now()
);

create index idx_comentarios_demanda on demanda_comentarios (demanda_id);

-- ---------------------------------------------------------
-- ANEXOS (arquivos vinculados a uma demanda ou a um projeto)
-- ---------------------------------------------------------

-- Bucket privado no Supabase Storage. Todo acesso passa pelo backend
-- (rotas /api) usando a service_role key — nunca é acessado direto pelo
-- navegador, mesma lógica de segurança do restante do sistema.
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

create table arquivos (
  id uuid primary key default gen_random_uuid(),
  nome_original text not null,
  caminho_storage text not null unique,
  tipo_mime text,
  tamanho_bytes bigint,

  -- Um arquivo pertence a UMA demanda OU a UM projeto, nunca os dois.
  demanda_id uuid references demandas(id) on delete cascade,
  projeto_id uuid references projetos(id) on delete cascade,

  enviado_por uuid references usuarios(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint arquivos_vinculo_check check (
    (demanda_id is not null and projeto_id is null) or
    (demanda_id is null and projeto_id is not null)
  )
);

create index idx_arquivos_demanda on arquivos (demanda_id);
create index idx_arquivos_projeto on arquivos (projeto_id);

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

create trigger trg_usuarios_updated_at
  before update on usuarios
  for each row execute function set_updated_at();

create trigger trg_projetos_updated_at
  before update on projetos
  for each row execute function set_updated_at();

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
alter table projetos enable row level security;
alter table demandas enable row level security;
alter table demanda_subtarefas enable row level security;
alter table demanda_comentarios enable row level security;
alter table arquivos enable row level security;

-- =========================================================
-- Depois de rodar este arquivo, crie o usuário administrador
-- executando `npm run seed` (ver README.md) — ele gera o hash
-- da senha corretamente com bcrypt.
-- =========================================================
