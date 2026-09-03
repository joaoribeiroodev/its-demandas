"use client";

import { useState } from "react";
import { somarDiasISO, proximaSegundaISO } from "@/lib/demandaUtils";

export default function SnoozeMenu({ onAdiar }) {
  const [aberto, setAberto] = useState(false);

  const opcoes = [
    { label: "Amanhã", dataAlvo: somarDiasISO(1) },
    { label: "Próxima semana", dataAlvo: proximaSegundaISO() },
    { label: "Tirar do Meu Dia", dataAlvo: null },
  ];

  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto((a) => !a)} className="btn-ghost text-xs">
        Adiar ▾
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 mt-1 w-44 card z-20 py-1">
            {opcoes.map((op) => (
              <button
                key={op.label}
                type="button"
                onClick={() => {
                  onAdiar(op.dataAlvo);
                  setAberto(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-marine-700 hover:bg-marine-50"
              >
                {op.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
