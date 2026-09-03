"use client";

import { useRouter } from "next/navigation";
import MobileNav from "./MobileNav";

export default function Topbar({ usuario }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const iniciais = usuario.nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 shrink-0 border-b border-marine-100 bg-white flex items-center justify-between px-3 sm:px-6 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <MobileNav usuario={usuario} />
        <span className="lg:hidden font-display font-bold text-marine-900 truncate">Demandas</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-tide-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
          {iniciais}
        </div>
        <span className="hidden sm:block text-sm font-medium text-marine-800">{usuario.nome}</span>
        <button onClick={handleLogout} className="btn-ghost text-xs shrink-0">
          Sair
        </button>
      </div>
    </header>
  );
}
