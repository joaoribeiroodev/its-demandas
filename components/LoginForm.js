"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [tentativasRestantes, setTentativasRestantes] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setTentativasRestantes(null);
    setBloqueado(false);
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível entrar.");
        setBloqueado(res.status === 429);
        if (typeof data.tentativasRestantes === "number") setTentativasRestantes(data.tentativasRestantes);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  const corAviso = bloqueado
    ? "text-red-600 bg-red-50 border-red-100"
    : tentativasRestantes !== null && tentativasRestantes <= 2
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="identificador">Login ou e-mail</label>
        <input
          id="identificador"
          className="input"
          placeholder="seu.login ou email"
          value={identificador}
          onChange={(e) => {
            setIdentificador(e.target.value);
            setBloqueado(false);
          }}
          autoFocus
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          className="input"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
      </div>

      {erro && <p className={`text-sm border rounded-lg px-3 py-2 ${corAviso}`}>{erro}</p>}

      <button type="submit" className="btn-primary w-full" disabled={carregando || bloqueado}>
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
