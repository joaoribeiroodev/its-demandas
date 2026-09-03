import { redirect } from "next/navigation";
import Image from "next/image";
import { getUsuarioAtual } from "@/lib/authServer";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const usuario = await getUsuarioAtual();
  if (usuario) redirect("/dashboard");

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-marine-800 text-white p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #8ac640 0%, transparent 45%), radial-gradient(circle at 80% 70%, #2c72ad 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/logo.png" alt="Internacional Travessias Salvador" width={44} height={44} className="rounded-full" />
          <span className="font-display font-bold text-lg tracking-tight">ITS-Demandas</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">
            Cada demanda, no seu devido lugar.
          </h1>
          <p className="text-marine-200 text-sm leading-relaxed">
            Organize prioridades, prazos e responsáveis de cada setor em um único quadro —
            do backlog até a conclusão.
          </p>
        </div>
        <div className="relative z-10 flex gap-6 text-xs text-marine-200">
          <span>Prioridade</span>
          <span>Prazo</span>
          <span>Setor</span>
          <span>Responsável</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex flex-col items-center text-center gap-3">
            <Image src="/logo.png" alt="Internacional Travessias Salvador" width={64} height={64} className="rounded-full" />
            <span className="font-display font-bold text-xl text-marine-900">ITS-Demandas</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-marine-900 mb-1">Entrar</h2>
          <p className="text-sm text-marine-500 mb-8">Acesse com seu login ou e-mail corporativo.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
