-- =========================================================
-- DROP ALL — apaga completamente as tabelas deste sistema
-- Rode no SQL Editor do Supabase quando quiser recomeçar do zero.
--
-- ⚠️ ISSO APAGA TODOS OS DADOS (usuários, demandas, projetos,
-- subtarefas, comentários) PERMANENTEMENTE. Não há como desfazer.
-- Depois de rodar este script, rode o novo `schema.sql` completo
-- para recriar as tabelas do zero, e depois `npm run seed` para
-- recriar o usuário administrador.
-- =========================================================

drop table if exists demanda_comentarios cascade;
drop table if exists demanda_subtarefas cascade;
drop table if exists demandas cascade;
drop table if exists projetos cascade;
drop table if exists usuarios cascade;

drop function if exists set_updated_at() cascade;

-- =========================================================
-- Fim. O banco está vazio. Rode supabase/schema.sql em seguida.
-- =========================================================
