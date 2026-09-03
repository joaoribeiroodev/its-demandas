const ICONS = {
  inbox: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h4.5l1.5 3h6l1.5-3H21" />
      <path d="M5 12 3.5 6.4A1.5 1.5 0 0 1 5 4.5h14a1.5 1.5 0 0 1 1.5 1.9L19 12v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18v-6Z" />
    </svg>
  ),
  meuDia: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
    </svg>
  ),
  quadro: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="7" height="16" rx="1.5" />
      <rect x="13" y="4" width="8" height="9" rx="1.5" />
      <rect x="13" y="16" width="8" height="4" rx="1.5" />
    </svg>
  ),
  projetos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4l1.5 2h8A1.5 1.5 0 0 1 20.5 7.5v11A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13Z" />
    </svg>
  ),
  logbook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3.5h11A1.5 1.5 0 0 1 18.5 5v15L15 18l-3 2-3-2-3 2V5A1.5 1.5 0 0 1 7.5 3.5H6Z" />
      <path d="M8.5 8h6M8.5 11.5h6" />
    </svg>
  ),
  usuarios: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" />
      <circle cx="17.5" cy="8.5" r="2.6" />
      <path d="M15.5 14.3c2.9.3 5 2.6 5 5.7" />
    </svg>
  ),
};

export function getNavLinks(usuario) {
  const isAdmin = usuario?.permissao === "admin";
  return [
    { href: "/dashboard/inbox", label: "Inbox", icon: "inbox" },
    { href: "/dashboard/meu-dia", label: "Meu Dia", icon: "meuDia" },
    { href: "/dashboard", label: "Quadro", icon: "quadro" },
    { href: "/dashboard/projetos", label: "Projetos", icon: "projetos" },
    { href: "/dashboard/logbook", label: "Logbook", icon: "logbook" },
    ...(isAdmin ? [{ href: "/dashboard/usuarios", label: "Usuários", icon: "usuarios" }] : []),
  ];
}

export function labelPermissao(permissao) {
  if (permissao === "admin") return "Administrador";
  if (permissao === "gestor") return "Gestor";
  return "Colaborador";
}

export { ICONS };
