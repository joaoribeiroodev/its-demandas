# ITS-Demandas — Internacional Travessias Salvador

Ferramenta de organização pessoal e produtividade individual no ambiente de
trabalho — captura rápida, foco diário, quadro Kanban, projetos e histórico.
**Não é** um sistema de chamados/tickets entre pessoas: cada usuário organiza
a própria rotina, ainda que dentro de um workspace compartilhado da empresa.
Feito para rodar **somente** com deploy na **Vercel** e banco de dados **Supabase**.

## Stack

- **Next.js 14** (App Router) — frontend + backend (API Routes) em um único projeto Node.js
- **Supabase** (Postgres) — banco de dados, acessado só pelo backend via *service role key*
- **Tailwind CSS** — estilização (paleta verde/branco/azul)
- **@hello-pangea/dnd** — arrastar e soltar no quadro Kanban
- **marked** — renderização de notas em Markdown (sem serviço externo, 100% local)
- Autenticação própria (login + senha com hash `bcrypt`, sessão via cookie `httpOnly` assinado com JWT) — não usa o Supabase Auth, então o login pode ser feito por **login de usuário** (`ti.salvador`) ou **e-mail**.

## Funcionalidades

**Captura e organização**
- **Inbox**: captura rápida de qualquer coisa, sem precisar categorizar na hora. Suporta atalhos de texto: `#tag` (contexto), `!alta`/`!media`/`!baixa` (prioridade), `/hoje`/`/amanha`/`/semana` (data), `~15min`/`~1h` (duração estimada)
- **Meu Dia**: visão isolada com só as tarefas planejadas para hoje, separado do resto do backlog
- **Quadro Kanban**: Backlog → A Fazer → Em Andamento → Em Revisão → Concluído, com arrastar e soltar. Chegar em "Concluído" não é o fim — um botão **"Concluir Demanda"** (no card ou no modal) encerra de vez o item, tirando-o do Kanban e mandando pro Logbook. Demandas recorrentes se encerram sozinhas quando a próxima ocorrência é criada.
- **Projetos**: agrupamento dinâmico de demandas com progresso % automático (atualizado ao vivo). Cada projeto tem um botão **"Demandas"** para ver tudo que está vinculado a ele, vincular uma demanda existente ou desvincular — além de vincular pelo próprio lado da demanda, no campo "Projeto" do modal. Pode ser arquivado (some da lista, mas preserva tudo) ou **excluído definitivamente** (irreversível, restrito a gestor/admin — as demandas vinculadas não são apagadas, só perdem a referência ao projeto; anexos do projeto são removidos)
- **Logbook**: histórico de tudo que foi concluído, agrupado por mês, com todos os detalhes de cada item (clique para abrir) — inclusive a opção de **reabrir** uma demanda encerrada, trazendo ela de volta pro Kanban
- **Arquivos**: aba central com todos os anexos (de demandas e projetos) que você tem acesso, com busca por nome e filtro por origem

**Em cada demanda**
- Prioridade (baixa/média/alta), prazo (dias/semanas/meses, com data-alvo calculada), duração estimada e nível de energia/concentração necessário (leve, moderada, alta concentração)
- Tags de contexto livres (`#reuniao`, `#computador`, `#ligacao`...)
- Setor Responsável (quem executa/é dono da demanda) e Setor Direcionado (quem pediu/precisa dela) — ambos opcionais, texto livre com sugestões
- Direcionado a (pessoa responsável) — opcional, para quando a tarefa envolve outra pessoa do time
- Checklist de subtarefas com barra de progresso
- Anexos: arquivos de até 5 MB, guardados no Supabase Storage, vinculados à demanda (ou diretamente a um projeto, pela aba Projetos)
- Notas em Markdown (com preview) para minutas, links e contexto
- Recorrência simples (todo dia / toda semana / a cada 2 semanas / todo mês) — ao concluir, a próxima ocorrência é criada automaticamente
- Modo Foco com timer Pomodoro embutido
- Snooze rápido ("Amanhã", "Próxima semana", "Tirar do Meu Dia")
- Comentários/histórico de acompanhamento

**Administração**
- Aba **Usuários** (visível apenas para Administradores): cria, edita, desativa e reativa usuários, definindo nome, e-mail, login, senha, setor e permissão (Administrador / Gestor / Colaborador)

**Não incluído de propósito** (avaliar depois, exigem infraestrutura/custo externo):
time blocking sincronizado com Google/Outlook Calendar (requer app OAuth aprovado por terceiros) e conversão automática de e-mail/Slack/Teams em tarefa (requer serviço pago de e-mail inbound e/ou app Slack/Teams registrado).

## 1. Configurar o Supabase

**Projeto novo** (banco vazio):
1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** e rode todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) — já cria tudo (usuários, demandas, projetos, subtarefas, comentários, demandas de equipe).

**Banco já existente** (você já rodou o `schema.sql` antes, numa versão anterior do sistema):
1. Rode [`supabase/migration_003_demandas_equipe.sql`](./supabase/migration_003_demandas_equipe.sql) — adiciona só o suporte a demandas de equipe. Não apaga nada.
2. Rode [`supabase/migration_004_anexos.sql`](./supabase/migration_004_anexos.sql) — adiciona a tabela de anexos e cria o bucket `anexos` no Storage. Não apaga nada.
3. Rode [`supabase/migration_005_setor_direcionado.sql`](./supabase/migration_005_setor_direcionado.sql) — adiciona o campo Setor Direcionado. Não apaga nada.
4. Rode [`supabase/migration_006_encerrar_demanda.sql`](./supabase/migration_006_encerrar_demanda.sql) — adiciona o campo de demanda encerrada (arquivamento). Não apaga nada.

**Recomeçar do zero** (apaga tudo):
1. Rode [`supabase/drop_all.sql`](./supabase/drop_all.sql).
2. Rode `schema.sql` de novo.
3. Rode `npm run seed` para recriar o usuário administrador.

Depois disso, vá em **Project Settings → API** e copie:
- `Project URL` → variável `NEXT_PUBLIC_SUPABASE_URL`
- `service_role` key (em "Project API keys") → variável `SUPABASE_SERVICE_ROLE_KEY`

⚠️ A `service_role` key tem acesso total ao banco e **nunca** deve ser exposta no navegador. Neste projeto ela só é usada dentro das rotas `/api/**`, que rodam no servidor — nunca a coloque em um componente `"use client"`.

## 2. Configurar variáveis de ambiente localmente

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
AUTH_SECRET=uma-string-longa-e-aleatoria   # gere com: openssl rand -base64 48
```

## 3. Instalar dependências e criar o usuário administrador

```bash
npm install
npm run seed
```

O script `npm run seed` cria (ou atualiza, se já existir) o usuário administrador inicial com os dados abaixo, gerando corretamente o hash `bcrypt` da senha:

| Campo | Valor |
|---|---|
| Nome | SEU NOME |
| E-mail | seuemail@xxxx.com.br |
| Login | seu.login |
| Senha | suasenha |
| Setor | TI |
| Permissão | Administrador |

> Recomendo trocar essa senha pelo próprio sistema (aba **Usuários → Editar**) logo após o primeiro login.

## 4. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

## 5. Deploy na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. A Vercel detecta automaticamente que é um projeto Next.js — não é preciso configurar build command manualmente.
4. Em **Environment Variables**, adicione as mesmas três variáveis do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_SECRET`
5. Clique em **Deploy**.
6. Depois do primeiro deploy, rode `npm run seed` **localmente** (apontando para o mesmo Supabase de produção, usando o `.env.local` com as credenciais de produção) para criar o usuário administrador direto no banco. Você só precisa fazer isso uma vez.

Depois disso, o sistema estará disponível na URL da Vercel, pronto para login com `ti.salvador`.

## Estrutura do projeto

```
app/
  login/                      página de login
  dashboard/                  layout com sidebar (Inbox, Meu Dia, Quadro, Projetos, Logbook, Usuários)
  dashboard/inbox/            captura rápida e triagem
  dashboard/meu-dia/          foco diário
  dashboard/(root)/           quadro Kanban
  dashboard/projetos/         projetos com progresso
  dashboard/logbook/          histórico de concluídas
  dashboard/arquivos/         aba central de anexos
  dashboard/usuarios/         gerenciamento de usuários (protegido, só admin)
  api/                        todas as rotas de backend (auth, demandas, subtarefas, projetos, usuarios, equipe)
components/                   componentes de UI reutilizáveis
lib/                          Supabase admin client, sessão/JWT, utilitários de domínio (inclui o parser de atalhos da captura rápida)
supabase/schema.sql                          schema completo e atualizado (rodar num projeto novo)
supabase/migration_003_demandas_equipe.sql   migração incremental p/ bancos já existentes (demandas de equipe)
supabase/migration_004_anexos.sql            migração incremental p/ bancos já existentes (anexos + bucket de storage)
supabase/migration_005_setor_direcionado.sql migração incremental p/ bancos já existentes (campo Setor Direcionado)
supabase/migration_006_encerrar_demanda.sql  migração incremental p/ bancos já existentes (encerrar/reabrir demanda)
supabase/drop_all.sql                        apaga tudo, para recomeçar do zero
scripts/seed-admin.mjs        script para criar/atualizar o usuário administrador
middleware.js                 protege rotas /dashboard e /api por sessão e permissão
```

## Permissões

- **Administrador**: acesso total — aba Usuários, vê e exclui qualquer demanda de qualquer setor, cria/exclui/atribui demandas de equipe de qualquer setor.
- **Gestor**: enxerga as demandas (pessoais e de equipe) do **próprio setor** — pode alternar no Quadro e no Logbook entre "ver o setor inteiro" e "ver só as minhas". Pode excluir qualquer demanda do seu setor e criar/excluir/atribuir demandas de equipe do seu setor. Não vê outros setores nem acessa a aba Usuários.
- **Colaborador**: cria e edita demandas livremente; só enxerga as próprias demandas pessoais (criadas por ele ou atribuídas a ele) e as demandas de equipe do seu setor; só pode **excluir as demandas pessoais que ele mesmo criou**.

### Demandas de equipe

Além das demandas pessoais (de sempre), um gestor ou administrador pode marcar uma demanda como **"Demanda em equipe"** e vinculá-la a um setor. A partir daí:

- Todo mundo cujo setor (`usuarios.setor`) bate com o setor da demanda enxerga e pode editar essa demanda normalmente — título, descrição, prioridade, prazo, tags, subtarefas, comentários, status no quadro etc.
- Só gestor/admin pode **excluir** a demanda de equipe ou **trocar o responsável** (`Direcionado a`) dela.
- Atribuir a demanda a uma pessoa específica não tira ela do setor — ela continua aparecendo pra todo mundo do time, só passa a mostrar quem ficou responsável.

### Visibilidade — quem vê o quê

| | Demandas pessoais | Demandas de equipe |
|---|---|---|
| **Admin** | Todas, de todo mundo | Todas, de qualquer setor |
| **Gestor** | As de quem é do seu setor | As do seu setor |
| **Colaborador** | Só as próprias (criadas por ele ou atribuídas a ele) | As do seu setor |

No Quadro e no Logbook, o gestor tem um alternador (**"Setor · [nome do setor]"** / **"Só minhas demandas"**) para filtrar entre ver tudo que tem acesso ou só o que é dele. "Meu Dia" é sempre estritamente pessoal, independente do papel — nunca mistura tarefas de outras pessoas, mesmo que o gestor tenha acesso mais amplo no Quadro.

### Anexos

- Um arquivo pertence a **uma demanda OU um projeto**, nunca aos dois — o vínculo é definido no momento do envio.
- A visibilidade de um arquivo segue a mesma regra da demanda onde ele está anexado (tabela acima). Arquivos de projeto são visíveis a qualquer usuário autenticado, já que projetos hoje não têm restrição de visibilidade.
- Qualquer pessoa com acesso à demanda/projeto pode anexar arquivos.
- Só quem enviou o arquivo, ou gestor/admin, pode removê-lo.
- Limite de 5 MB por arquivo; alguns tipos de arquivo (executáveis e scripts) são bloqueados por segurança.
- Os arquivos ficam guardados no **Supabase Storage**, num bucket privado (`anexos`) — o mesmo modelo de segurança do resto do sistema: nada é acessado direto pelo navegador, tudo passa pelo backend.

> **Nota de segurança:** a exclusão de demanda e a troca de responsável/setor de uma demanda de equipe já checam o setor de quem está pedindo (não só a permissão). O que ainda **não** é checado: um `PATCH` mudando outros campos (título, status, prioridade etc.) de uma demanda específica não confere se quem pediu tinha "direito de ver" aquele ID — só confere login. Isso só seria explorável por alguém que já soubesse adivinhar o UUID de uma demanda de outro setor, o que é bem improvável, mas é uma camada a mais que dá pra reforçar se algum dia isso importar.

## Segurança

- Senhas nunca são armazenadas em texto puro — apenas o hash `bcrypt`.
- A tabela do Supabase tem Row Level Security (RLS) habilitada e nenhuma política pública é criada de propósito: o banco só é acessado pelo backend Next.js usando a `service_role` key, nunca diretamente pelo navegador.
- A sessão é um JWT assinado (`AUTH_SECRET`) guardado em cookie `httpOnly`, `SameSite=Lax` e `Secure` em produção.

## O que ficou fora de escopo (de propósito)

- **Time blocking com Google Calendar/Outlook**: precisa de um app OAuth registrado e aprovado por Google/Microsoft, tela de consentimento, refresh tokens armazenados com segurança e manutenção contínua da integração. Quando quiserem investir nisso, o ponto de entrada natural é uma nova rota `/api/integracoes/calendario` com OAuth2 + biblioteca oficial de cada provedor.
- **E-mail/Slack/Teams → tarefa automática**: exige um serviço pago de e-mail inbound (ex.: SendGrid Inbound Parse, Postmark) ou um app Slack/Teams registrado com bot token. O ponto de entrada seria um webhook `/api/webhooks/entrada` que valida a origem e cria a demanda com `status: "inbox"`.
- **Recorrência avançada** (ex.: "toda última sexta-feira do mês"): a recorrência implementada cobre intervalos regulares (todo dia / toda semana / a cada N semanas / todo mês), que resolve a maioria dos casos. Regras mais elaboradas exigiriam um motor de regras tipo RRULE (iCalendar), que é bem mais código para um ganho menor.
