import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/authServer";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const usuario = await getUsuarioAtual();
  if (usuario) redirect("/dashboard");

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-marine-900 text-white p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #1a9e6e 0%, transparent 45%), radial-gradient(circle at 80% 70%, #2c72ad 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10">
          <span className="font-display font-bold text-lg tracking-tight">Internacional Marítima</span>
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
        <div className="relative z-10 flex gap-6 text-xs text-marine-300">
          <span>Prioridade</span>
          <span>Prazo</span>
          <span>Setor</span>
          <span>Responsável</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display font-bold text-xl text-marine-900">Internacional Marítima</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-marine-900 mb-1">Entrar</h2>
          <p className="text-sm text-marine-500 mb-8">Acesse com seu login ou e-mail corporativo.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
