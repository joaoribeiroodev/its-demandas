"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { getNavLinks, ICONS } from "./navLinksConfig";

export default function NavLinks({ usuario, onNavigate, className, linkClassName }) {
  const pathname = usePathname();
  const links = getNavLinks(usuario);

  return (
    <nav className={className}>
      {links.map((link) => {
        const ativo = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              ativo ? "bg-tide-600 text-white" : "text-marine-200 hover:bg-marine-800 hover:text-white",
              linkClassName
            )}
          >
            {ICONS[link.icon]}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
