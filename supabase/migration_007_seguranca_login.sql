-- =========================================================
-- Migração 007 — Segurança de login
-- Rode no SQL Editor do Supabase (não apaga nada existente).
-- =========================================================

-- Bloqueio por tentativas de login incorretas (proteção contra força bruta).
alter table usuarios add column if not exists tentativas_login_falhas integer not null default 0;
alter table usuarios add column if not exists bloqueado_ate timestamptz;

-- Versão da sessão: incrementar este número invalida IMEDIATAMENTE todas
-- as sessões já abertas daquele usuário (mesmo antes do token expirar
-- sozinho), porque o número gravado dentro do token deixa de bater com o
-- valor atual no banco. Disparado automaticamente ao trocar a senha, ao
-- desativar o usuário, ou manualmente pelo botão "Encerrar sessões".
alter table usuarios add column if not exists sessao_versao integer not null default 1;

-- Registro do último login bem-sucedido, para o administrador identificar
-- contas ativas, esquecidas ou com uso suspeito.
alter table usuarios add column if not exists ultimo_login timestamptz;

-- =========================================================
-- Fim da migração 007.
-- =========================================================
