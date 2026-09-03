"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import NavLinks from "./NavLinks";
import { labelPermissao } from "./navLinksConfig";

export default function MobileNav({ usuario }) {
  const [aberto, setAberto] = useState(false);

  // Trava o scroll do fundo enquanto o menu está aberto, e fecha com Esc —
  // boas práticas padrão para drawers/menus mobile.
  useEffect(() => {
    if (!aberto) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e) {
      if (e.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu de navegação"
        aria-expanded={aberto}
        className="lg:hidden -ml-1.5 p-2 rounded-lg text-marine-700 hover:bg-marine-50"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" strokeLinecap="round" />
        </svg>
      </button>

      {aberto && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-marine-900/50 backdrop-blur-sm"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-marine-900 text-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 pt-6 pb-5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Image src="/logo.png" alt="Internacional Travessias Salvador" width={34} height={34} className="rounded-full shrink-0" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-display font-bold text-base leading-tight">ITS-Demandas</span>
                  <span className="text-xs text-marine-300 truncate">Internacional Travessias</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="p-1.5 rounded-lg text-marine-300 hover:bg-marine-800 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <NavLinks usuario={usuario} onNavigate={() => setAberto(false)} className="flex flex-col gap-1 px-3" />

            <div className="mt-auto px-5 py-5 text-xs text-marine-400 border-t border-marine-800">
              <p className="font-medium text-marine-200">{usuario.nome}</p>
              <p>{usuario.setor} · {labelPermissao(usuario.permissao)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
