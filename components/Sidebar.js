import Image from "next/image";
import NavLinks from "./NavLinks";
import { labelPermissao } from "./navLinksConfig";

export default function Sidebar({ usuario }) {
  return (
    <aside className="hidden lg:flex lg:w-64 shrink-0 bg-marine-900 text-white flex-col">
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <Image src="/logo.png" alt="Internacional Travessias Salvador" width={40} height={40} className="rounded-full shrink-0" />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-display font-bold text-base leading-tight">ITS-Demandas</span>
          <span className="text-xs text-marine-300 truncate">Internacional Travessias</span>
        </div>
      </div>

      <NavLinks usuario={usuario} className="flex flex-col gap-1 px-3" />

      <div className="mt-auto px-6 py-6 text-xs text-marine-400 border-t border-marine-800">
        <p className="font-medium text-marine-200">{usuario.nome}</p>
        <p>{usuario.setor} · {labelPermissao(usuario.permissao)}</p>
      </div>
    </aside>
  );
}
