/** @type {import('next').NextConfig} */
const nextConfig = {
  // O React 18 Strict Mode faz o React renderizar cada componente duas vezes
  // em desenvolvimento (mount -> unmount -> mount) para detectar efeitos
  // colaterais indevidos. Isso quebra o @hello-pangea/dnd (o drag-and-drop do
  // quadro Kanban simplesmente não inicia, sem erro visível). É um problema
  // conhecido da biblioteca (e do react-beautiful-dnd, do qual ela deriva)
  // e não tem correção do lado da biblioteca até o momento — por isso
  // desativamos o Strict Mode aqui. Isso só afeta o modo de desenvolvimento;
  // não muda nada no build de produção usado na Vercel.
  reactStrictMode: false,

  // Cabeçalhos de segurança HTTP aplicados a toda resposta. Deliberadamente
  // NÃO incluímos Content-Security-Policy aqui: várias dependências do
  // projeto (recharts, @hello-pangea/dnd, o próprio Next.js) dependem de
  // estilos/scripts inline para funcionar, e uma CSP mal calibrada quebra
  // essas bibliotecas de forma sutil (o drag-and-drop, por exemplo, já foi
  // uma fonte de bug difícil de diagnosticar neste projeto). Adicionar CSP
  // exige testar de verdade num navegador antes de habilitar em produção —
  // ver README para os detalhes.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
