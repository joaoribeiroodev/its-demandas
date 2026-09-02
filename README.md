# Gerenciador de Demandas — Internacional Marítima

Sistema web de gerenciamento de demandas por setor, baseado em Scrum/Kanban.
Feito para rodar **somente** com deploy na **Vercel** e banco de dados **Supabase**.

## Stack

- **Next.js 14** (App Router) — frontend + backend (API Routes) em um único projeto Node.js
- **Supabase** (Postgres) — banco de dados, acessado só pelo backend via *service role key*
- **Tailwind CSS** — estilização (paleta verde/branco/azul)
- **@hello-pangea/dnd** — arrastar e soltar no quadro Kanban
- Autenticação própria (login + senha com hash `bcrypt`, sessão via cookie `httpOnly` assinado com JWT) — não usa o Supabase Auth, então o login pode ser feito por **login de usuário** (`ti.salvador`) ou **e-mail**.

## Funcionalidades

- Quadro Kanban com colunas: Backlog, A Fazer, Em Andamento, Em Revisão, Concluído
- Demandas com: título, descrição, setor, prioridade (baixa/média/alta), prazo (dias/semanas/meses, com data-alvo calculada automaticamente) e responsável (pessoa direcionada)
- Arrastar o card entre colunas atualiza o status automaticamente
- Filtros por setor, prioridade, responsável e busca por título
- Comentários/histórico de acompanhamento em cada demanda
- Aba **Usuários** (visível apenas para Administradores): cria, edita, desativa e reativa usuários, definindo nome, e-mail, login, senha, setor e permissão (Administrador / Gestor / Colaborador)

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** e rode todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql). Isso cria as tabelas `usuarios`, `demandas` e `demanda_comentarios`.
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
| Nome | TI Salvador |
| E-mail | tisalvador@internacionalmaritima.com.br |
| Login | ti.salvador |
| Senha | tisalvador@26 |
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
  login/            página de login
  dashboard/         quadro Kanban (protegido)
  dashboard/usuarios/ gerenciamento de usuários (protegido, só admin)
  api/                todas as rotas de backend (auth, demandas, usuarios, equipe)
components/           componentes de UI reutilizáveis
lib/                  Supabase admin client, sessão/JWT, utilitários de domínio
supabase/schema.sql   schema completo do banco
scripts/seed-admin.mjs script para criar/atualizar o usuário administrador
middleware.js          protege rotas /dashboard e /api por sessão e permissão
```

## Permissões

- **Administrador**: acesso total, incluindo a aba Usuários (criar/editar/desativar usuários) e exclusão de demandas.
- **Gestor**: cria, edita e exclui demandas de qualquer setor.
- **Colaborador**: cria e edita demandas, mas não pode excluí-las nem acessar a aba Usuários.

## Segurança

- Senhas nunca são armazenadas em texto puro — apenas o hash `bcrypt`.
- A tabela do Supabase tem Row Level Security (RLS) habilitada e nenhuma política pública é criada de propósito: o banco só é acessado pelo backend Next.js usando a `service_role` key, nunca diretamente pelo navegador.
- A sessão é um JWT assinado (`AUTH_SECRET`) guardado em cookie `httpOnly`, `SameSite=Lax` e `Secure` em produção.
