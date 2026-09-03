"use client";

import { useState } from "react";
import UsuarioModal from "@/components/UsuarioModal";
import { PERMISSOES } from "@/lib/demandaUtils";

const PERMISSAO_LABEL = Object.fromEntries(PERMISSOES.map((p) => [p.valor, p.label]));

export default function UsuariosClient({ usuarioAtualId, dadosIniciais }) {
  const [usuarios, setUsuarios] = useState(dadosIniciais?.usuarios || []);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  function handleSalvo(usuarioSalvo) {
    setUsuarios((atual) => {
      const existe = atual.some((u) => u.id === usuarioSalvo.id);
      return existe ? atual.map((u) => (u.id === usuarioSalvo.id ? usuarioSalvo : u)) : [...atual, usuarioSalvo];
    });
    setModalAberto(false);
    setUsuarioEditando(null);
  }

  async function handleAlternarAtivo(usuario) {
    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !usuario.ativo }),
    });
    const data = await res.json();
    if (res.ok) handleSalvo(data.usuario);
    else alert(data.erro || "Não foi possível atualizar o usuário.");
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-marine-900">Usuários</h1>
          <p className="text-sm text-marine-500 mt-1">Crie e gerencie o acesso da equipe ao sistema.</p>
        </div>
        <button
          onClick={() => {
            setUsuarioEditando(null);
            setModalAberto(true);
          }}
          className="btn-primary self-start sm:self-auto"
        >
          + Novo usuário
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-marine-50 text-marine-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-4 py-3">Nome</th>
              <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Login / E-mail</th>
              <th className="text-left font-medium px-4 py-3">Setor</th>
              <th className="text-left font-medium px-4 py-3">Permissão</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-marine-50">
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-marine-400 py-8">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-marine-50/60">
                <td className="px-4 py-3 font-medium text-marine-900">{u.nome}</td>
                <td className="px-4 py-3 text-marine-500 hidden sm:table-cell">
                  {u.login} · {u.email}
                </td>
                <td className="px-4 py-3 text-marine-600">{u.setor}</td>
                <td className="px-4 py-3 text-marine-600">{PERMISSAO_LABEL[u.permissao]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      u.ativo ? "bg-tide-50 text-tide-700" : "bg-marine-100 text-marine-500"
                    }`}
                  >
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => {
                      setUsuarioEditando(u);
                      setModalAberto(true);
                    }}
                    className="btn-ghost text-xs"
                  >
                    Editar
                  </button>
                  {u.id !== usuarioAtualId && (
                    <button onClick={() => handleAlternarAtivo(u)} className="btn-ghost text-xs">
                      {u.ativo ? "Desativar" : "Reativar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <UsuarioModal
          usuario={usuarioEditando}
          onFechar={() => {
            setModalAberto(false);
            setUsuarioEditando(null);
          }}
          onSalvo={handleSalvo}
        />
      )}
    </div>
  );
}
