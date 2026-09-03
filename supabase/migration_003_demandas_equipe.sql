-- =========================================================
-- Migração 003 — Demandas em equipe
-- Rode no SQL Editor do Supabase (não apaga nada existente).
-- =========================================================

-- Marca uma demanda como "de equipe": pertence a um setor inteiro, não a
-- uma pessoa. Só gestores/administradores podem criar, excluir ou atribuir
-- uma demanda de equipe a uma pessoa específica — mas ela continua visível
-- e utilizável por todo mundo do setor mesmo depois de atribuída.
alter table demandas add column if not exists equipe boolean not null default false;

-- Uma demanda de equipe precisa ter um setor definido (é o que define quem
-- enxerga ela). Isso não afeta demandas pessoais, que continuam com setor
-- opcional.
alter table demandas drop constraint if exists demandas_equipe_setor_check;
alter table demandas add constraint demandas_equipe_setor_check
  check (not equipe or setor is not null);

create index if not exists idx_demandas_equipe on demandas (equipe);

-- =========================================================
-- Fim da migração 003.
-- =========================================================
