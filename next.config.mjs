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
};

export default nextConfig;
