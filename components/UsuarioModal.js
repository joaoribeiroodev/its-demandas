"use client";

import { useState } from "react";
import { PERMISSOES, SETORES_SUGERIDOS } from "@/lib/demandaUtils";

const VAZIO = { nome: "", email: "", login: "", senha: "", setor: "", permissao: "colaborador" };

export default function UsuarioModal({ usuario, onFechar, onSalvo }) {
  const editando = Boolean(usuario);
  const [form, setForm] = useState(
    editando
      ? { ...VAZIO, nome: usuario.nome, email: usuario.email, login: usuario.login, setor: usuario.setor, permissao: usuario.permissao }
      : VAZIO
  );
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!form.nome || !form.email || !form.login || !form.setor || !form.permissao) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!editando && !form.senha) {
      setErro("Defina uma senha para o novo usuário.");
      return;
    }

    setSalvando(true);
    try {
      const payload = { ...form };
      if (!payload.senha) delete payload.senha;

      const res = await fetch(editando ? `/api/usuarios/${usuario.id}` : "/api/usuarios", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível salvar.");
        return;
      }
      onSalvo(data.usuario);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-marine-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="card w-full max-w-lg my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-marine-100">
          <h2 className="font-display font-semibold text-marine-900">
            {editando ? "Editar usuário" : "Novo usuário"}
          </h2>
          <button onClick={onFechar} className="text-marine-400 hover:text-marine-700 text-xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome completo</label>
              <input className="input" value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} required />
            </div>
            <div>
              <label className="label">Setor</label>
              <input
                className="input"
                list="setores-sugeridos-usuario"
                value={form.setor}
                onChange={(e) => atualizar("setor", e.target.value)}
                required
              />
              <datalist id="setores-sugeridos-usuario">
                {SETORES_SUGERIDOS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => atualizar("email", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Login</label>
              <input className="input" value={form.login} onChange={(e) => atualizar("login", e.target.value)} required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{editando ? "Nova senha (opcional)" : "Senha"}</label>
              <input
                type="password"
                className="input"
                value={form.senha}
                onChange={(e) => atualizar("senha", e.target.value)}
                placeholder={editando ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
              />
            </div>
            <div>
              <label className="label">Permissão</label>
              <select className="input" value={form.permissao} onChange={(e) => atualizar("permissao", e.target.value)}>
                {PERMISSOES.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onFechar} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
