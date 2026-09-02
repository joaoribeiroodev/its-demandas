import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/authServer";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function DashboardLayout({ children }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar usuario={usuario} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar usuario={usuario} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
