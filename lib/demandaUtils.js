export const PRIORIDADES = [
  { valor: "baixa", label: "Baixa" },
  { valor: "media", label: "Média" },
  { valor: "alta", label: "Alta" },
];

export const UNIDADES_PRAZO = [
  { valor: "dias", label: "dia(s)" },
  { valor: "semanas", label: "semana(s)" },
  { valor: "meses", label: "mês(es)" },
];

export const STATUS_COLUNAS = [
  { valor: "backlog", label: "Backlog" },
  { valor: "todo", label: "A Fazer" },
  { valor: "em_andamento", label: "Em Andamento" },
  { valor: "revisao", label: "Em Revisão" },
  { valor: "concluido", label: "Concluído" },
];

export const PERMISSOES = [
  { valor: "admin", label: "Administrador" },
  { valor: "gestor", label: "Gestor" },
  { valor: "colaborador", label: "Colaborador" },
];

export const SETORES_SUGERIDOS = [
  "TI",
  "Operações",
  "Comercial",
  "Financeiro",
  "RH",
  "Logística",
  "Marítimo",
  "Diretoria",
];

export function calcularPrazoData(prazoValor, prazoUnidade, dataBase = new Date()) {
  const data = new Date(dataBase);
  const valor = Number(prazoValor) || 1;
  if (prazoUnidade === "dias") data.setDate(data.getDate() + valor);
  else if (prazoUnidade === "semanas") data.setDate(data.getDate() + valor * 7);
  else if (prazoUnidade === "meses") data.setMonth(data.getMonth() + valor);
  return data;
}

export function formatarData(dataISO) {
  if (!dataISO) return "—";
  const data = new Date(dataISO + (dataISO.length === 10 ? "T00:00:00" : ""));
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function diasRestantes(dataISO) {
  if (!dataISO) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(dataISO + "T00:00:00");
  const diffMs = alvo.getTime() - hoje.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function prazoStatusLabel(dataISO, status) {
  if (status === "concluido") return { texto: "Concluída", tom: "neutro" };
  const dias = diasRestantes(dataISO);
  if (dias === null) return { texto: "Sem prazo", tom: "neutro" };
  if (dias < 0) return { texto: `Atrasada há ${Math.abs(dias)}d`, tom: "critico" };
  if (dias === 0) return { texto: "Vence hoje", tom: "alerta" };
  if (dias <= 2) return { texto: `Vence em ${dias}d`, tom: "alerta" };
  return { texto: `${dias}d restantes`, tom: "ok" };
}
