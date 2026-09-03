-- =========================================================
-- Migração 005 — Setor Direcionado
-- Rode no SQL Editor do Supabase (não apaga nada existente).
--
-- Contexto: o campo "setor" já existente passa a se chamar, na interface,
-- "Setor Responsável" (o setor que executa/é dono da demanda — mesmo
-- comportamento de sempre, só mudou o rótulo). Este campo novo,
-- "setor_direcionado", guarda o setor que PEDIU/precisa da demanda (o
-- setor solicitante) — é só informativo, não afeta visibilidade nem
-- permissões.
-- =========================================================

alter table demandas add column if not exists setor_direcionado text;

-- =========================================================
-- Fim da migração 005.
-- =========================================================
