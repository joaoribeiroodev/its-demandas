-- =========================================================
-- Migração 006 — Encerrar demanda (arquivamento)
-- Rode no SQL Editor do Supabase (não apaga nada existente).
--
-- Contexto: até agora, "Concluído" era só mais uma coluna do Kanban — a
-- demanda continuava aparecendo lá para sempre. Agora existe um passo
-- extra: depois de mover para "Concluído", um botão "Concluir Demanda"
-- encerra de vez o item — ele sai do quadro Kanban (todas as colunas) e
-- passa a existir só no Logbook, com a opção de ser reaberto por lá.
-- =========================================================

alter table demandas add column if not exists encerrada boolean not null default false;

create index if not exists idx_demandas_encerrada on demandas (encerrada);

-- =========================================================
-- Fim da migração 006.
-- =========================================================
