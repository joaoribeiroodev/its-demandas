// Cria (ou atualiza) o usuário administrador inicial.
// Uso:
//   1. Preencha .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
//   2. Rode: npm run seed
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";

// Carrega .env.local manualmente (dotenv/config só lê .env por padrão)
if (existsSync(".env.local")) {
  const lines = readFileSync(".env.local", "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltam variáveis de ambiente. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const ADMIN = {
  nome: "TI Salvador",
  email: "tisalvador@internacionalmaritima.com.br",
  login: "ti.salvador",
  senha: process.env.SEED_ADMIN_SENHA || "tisalvador@26",
  setor: "TI",
  permissao: "admin",
};

async function main() {
  const senha_hash = await bcrypt.hash(ADMIN.senha, 10);

  const { data: existente } = await supabase
    .from("usuarios")
    .select("id")
    .or(`email.eq.${ADMIN.email},login.eq.${ADMIN.login}`)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("usuarios")
      .update({
        nome: ADMIN.nome,
        email: ADMIN.email,
        login: ADMIN.login,
        senha_hash,
        setor: ADMIN.setor,
        permissao: ADMIN.permissao,
        ativo: true,
      })
      .eq("id", existente.id);
    if (error) throw error;
    console.log("Usuário administrador atualizado com sucesso.");
  } else {
    const { error } = await supabase.from("usuarios").insert({
      nome: ADMIN.nome,
      email: ADMIN.email,
      login: ADMIN.login,
      senha_hash,
      setor: ADMIN.setor,
      permissao: ADMIN.permissao,
      ativo: true,
    });
    if (error) throw error;
    console.log("Usuário administrador criado com sucesso.");
  }

  console.log(`Login: ${ADMIN.login}  |  Email: ${ADMIN.email}`);
}

main().catch((err) => {
  console.error("Erro ao criar usuário administrador:", err.message);
  process.exit(1);
});
