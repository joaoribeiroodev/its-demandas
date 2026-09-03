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
- **Quadro Kanban**: Backlog → A Fazer → Em Andamento → Em Revisão → Concluído, com arrastar e soltar
- **Projetos**: agrupamento dinâmico de demandas com progresso % automático
- **Logbook**: histórico de tudo que foi concluído, agrupado por mês

**Em cada demanda**
- Prioridade (baixa/média/alta), prazo (dias/semanas/meses, com data-alvo calculada), duração estimada e nível de energia/concentração necessário (leve, moderada, alta concentração)
- Tags de contexto livres (`#reuniao`, `#computador`, `#ligacao`...)
- Setor e responsável (pessoa direcionada) — opcionais, para quando a tarefa envolve outra pessoa do time
- Checklist de subtarefas com barra de progresso
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

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** e rode, **nesta ordem**:
   1. Todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) — cria as tabelas `usuarios`, `demandas` e `demanda_comentarios`.
   2. Todo o conteúdo de [`supabase/migration_002_produtividade_pessoal.sql`](./supabase/migration_002_produtividade_pessoal.sql) — adiciona Inbox, tags, energia, duração estimada, Meu Dia, projetos, subtarefas e recorrência. (Se você já tinha rodado só o `schema.sql` antes, rode a migração agora; ela não apaga nada do que já existe.)
3. Vá em **Project Settings → API** e copie:
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
| E-mail | seuemail@xxx.com.br |
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
  dashboard/usuarios/         gerenciamento de usuários (protegido, só admin)
  api/                        todas as rotas de backend (auth, demandas, subtarefas, projetos, usuarios, equipe)
components/                   componentes de UI reutilizáveis
lib/                          Supabase admin client, sessão/JWT, utilitários de domínio (inclui o parser de atalhos da captura rápida)
supabase/schema.sql                          schema original (usuarios, demandas, comentarios)
supabase/migration_002_produtividade_pessoal.sql  migração com Inbox/tags/energia/projetos/subtarefas/recorrência
scripts/seed-admin.mjs        script para criar/atualizar o usuário administrador
middleware.js                 protege rotas /dashboard e /api por sessão e permissão
```

## Permissões

- **Administrador**: acesso total, incluindo a aba Usuários (criar/editar/desativar usuários) e exclusão de demandas.
- **Gestor**: cria, edita e exclui demandas de qualquer setor.
- **Colaborador**: cria e edita demandas, mas não pode excluí-las nem acessar a aba Usuários.

## Segurança

- Senhas nunca são armazenadas em texto puro — apenas o hash `bcrypt`.
- A tabela do Supabase tem Row Level Security (RLS) habilitada e nenhuma política pública é criada de propósito: o banco só é acessado pelo backend Next.js usando a `service_role` key, nunca diretamente pelo navegador.
- A sessão é um JWT assinado (`AUTH_SECRET`) guardado em cookie `httpOnly`, `SameSite=Lax` e `Secure` em produção.

## O que ficou fora de escopo (de propósito)

- **Time blocking com Google Calendar/Outlook**: precisa de um app OAuth registrado e aprovado por Google/Microsoft, tela de consentimento, refresh tokens armazenados com segurança e manutenção contínua da integração. Quando quiserem investir nisso, o ponto de entrada natural é uma nova rota `/api/integracoes/calendario` com OAuth2 + biblioteca oficial de cada provedor.
- **E-mail/Slack/Teams → tarefa automática**: exige um serviço pago de e-mail inbound (ex.: SendGrid Inbound Parse, Postmark) ou um app Slack/Teams registrado com bot token. O ponto de entrada seria um webhook `/api/webhooks/entrada` que valida a origem e cria a demanda com `status: "inbox"`.
- **Recorrência avançada** (ex.: "toda última sexta-feira do mês"): a recorrência implementada cobre intervalos regulares (todo dia / toda semana / a cada N semanas / todo mês), que resolve a maioria dos casos. Regras mais elaboradas exigiriam um motor de regras tipo RRULE (iCalendar), que é bem mais código para um ganho menor.
