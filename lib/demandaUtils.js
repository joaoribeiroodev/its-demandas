export const SELECT_DEMANDA =
  "*, responsavel:responsavel_id(id, nome, setor), criador:criado_por(id, nome), projeto:projeto_id(id, nome, cor), subtarefas:demanda_subtarefas(id, titulo, concluida, ordem)";

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

// Colunas do quadro Kanban. "inbox" não entra aqui de propósito — itens
// não triados ficam só na tela de Inbox até serem processados.
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
  "Arrecadação",
  "Financeiro",
  "RH",
  "Logística",
  "Marítimo",
  "Diretoria",
];

export const NIVEIS_ENERGIA = [
  { valor: "leve", label: "Rotina leve", cor: "tide" },
  { valor: "moderada", label: "Moderada", cor: "amber" },
  { valor: "profunda", label: "Alta concentração", cor: "marine" },
];

export const DURACOES_RAPIDAS = [
  { valor: 15, label: "15 min" },
  { valor: 30, label: "30 min" },
  { valor: 60, label: "1 h" },
  { valor: 120, label: "2 h" },
];

export const TIPOS_RECORRENCIA = [
  { valor: "", label: "Não repete" },
  { valor: "intervalo", label: "A cada N dias/semanas/meses" },
  { valor: "semanal_dias", label: "Em dias específicos da semana" },
  { valor: "mensal_dia_fixo", label: "Todo mês, num dia fixo" },
  { valor: "mensal_posicional", label: "Todo mês, numa posição (ex.: última sexta)" },
];

export const DIAS_SEMANA = [
  { valor: 0, label: "Dom" },
  { valor: 1, label: "Seg" },
  { valor: 2, label: "Ter" },
  { valor: 3, label: "Qua" },
  { valor: 4, label: "Qui" },
  { valor: 5, label: "Sex" },
  { valor: 6, label: "Sáb" },
];

export const POSICOES_MES = [
  { valor: 1, label: "Primeira" },
  { valor: 2, label: "Segunda" },
  { valor: 3, label: "Terceira" },
  { valor: 4, label: "Quarta" },
  { valor: -1, label: "Última" },
];

function diasNoMes(ano, mes0) {
  return new Date(ano, mes0 + 1, 0).getDate();
}

/** N-ésima (ou última) ocorrência de um dia da semana num mês. mes0 é 0-indexado. */
function nEsimoDiaSemanaDoMes(ano, mes0, diaSemana, posicao) {
  if (posicao === -1) {
    const ultimoDia = new Date(ano, mes0 + 1, 0);
    const diff = (ultimoDia.getDay() - diaSemana + 7) % 7;
    ultimoDia.setDate(ultimoDia.getDate() - diff);
    return ultimoDia;
  }
  const primeiroDia = new Date(ano, mes0, 1);
  const diff = (diaSemana - primeiroDia.getDay() + 7) % 7;
  const dia = 1 + diff + (posicao - 1) * 7;
  return new Date(ano, mes0, dia);
}

/**
 * Calcula a próxima ocorrência (estritamente depois de `base`) de uma regra
 * de recorrência. `regra` é o objeto salvo em `recorrencia_regra` (jsonb).
 * Retorna um objeto Date, ou null se a regra for inválida/ausente.
 */
export function calcularProximaOcorrencia(regra, base = new Date()) {
  if (!regra || !regra.tipo) return null;
  const dataBase = new Date(base);
  dataBase.setHours(0, 0, 0, 0);

  if (regra.tipo === "intervalo") {
    return calcularPrazoData(regra.intervalo, regra.unidade, dataBase);
  }

  if (regra.tipo === "semanal_dias" && regra.dias_semana?.length) {
    for (let i = 1; i <= 7; i++) {
      const candidato = new Date(dataBase);
      candidato.setDate(candidato.getDate() + i);
      if (regra.dias_semana.includes(candidato.getDay())) return candidato;
    }
    return null;
  }

  if (regra.tipo === "mensal_dia_fixo" && regra.dia_mes) {
    let ano = dataBase.getFullYear();
    let mes0 = dataBase.getMonth();
    let candidato = new Date(ano, mes0, Math.min(regra.dia_mes, diasNoMes(ano, mes0)));
    if (candidato <= dataBase) {
      mes0 += 1;
      if (mes0 > 11) {
        mes0 = 0;
        ano += 1;
      }
      candidato = new Date(ano, mes0, Math.min(regra.dia_mes, diasNoMes(ano, mes0)));
    }
    return candidato;
  }

  if (regra.tipo === "mensal_posicional" && regra.posicao && regra.dia_semana_pos !== undefined) {
    let ano = dataBase.getFullYear();
    let mes0 = dataBase.getMonth();
    let candidato = nEsimoDiaSemanaDoMes(ano, mes0, regra.dia_semana_pos, regra.posicao);
    if (candidato <= dataBase) {
      mes0 += 1;
      if (mes0 > 11) {
        mes0 = 0;
        ano += 1;
      }
      candidato = nEsimoDiaSemanaDoMes(ano, mes0, regra.dia_semana_pos, regra.posicao);
    }
    return candidato;
  }

  return null;
}

/** Descrição legível de uma regra de recorrência, para mostrar na UI. */
export function descreverRecorrencia(regra) {
  if (!regra || !regra.tipo) return null;
  if (regra.tipo === "intervalo") {
    const unidadeLabel = UNIDADES_PRAZO.find((u) => u.valor === regra.unidade)?.label || regra.unidade;
    return regra.intervalo === 1 ? `Todo(a) ${unidadeLabel.replace("(s)", "")}` : `A cada ${regra.intervalo} ${unidadeLabel}`;
  }
  if (regra.tipo === "semanal_dias") {
    const dias = (regra.dias_semana || []).map((d) => DIAS_SEMANA.find((x) => x.valor === d)?.label).join(", ");
    return `Toda(o) ${dias}`;
  }
  if (regra.tipo === "mensal_dia_fixo") {
    return `Todo mês, dia ${regra.dia_mes}`;
  }
  if (regra.tipo === "mensal_posicional") {
    const posicaoLabel = POSICOES_MES.find((p) => p.valor === regra.posicao)?.label || "";
    const diaLabel = DIAS_SEMANA.find((d) => d.valor === regra.dia_semana_pos)?.label || "";
    return `${posicaoLabel} ${diaLabel}-feira do mês`;
  }
  return null;
}

export function calcularPrazoData(prazoValor, prazoUnidade, dataBase = new Date()) {
  if (!prazoValor || !prazoUnidade) return null;
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

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function somarDiasISO(dias, base = new Date()) {
  const data = new Date(base);
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

/** Próxima segunda-feira a partir de hoje (para o atalho "semana que vem"). */
export function proximaSegundaISO(base = new Date()) {
  const data = new Date(base);
  const diaSemana = data.getDay(); // 0 = domingo
  const diasAteSegunda = ((8 - diaSemana) % 7) || 7;
  data.setDate(data.getDate() + diasAteSegunda);
  return data.toISOString().slice(0, 10);
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

export function formatarDuracao(minutos) {
  if (!minutos) return null;
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h${resto}` : `${horas}h`;
}

/**
 * Interpreta atalhos de texto digitados na captura rápida, ex.:
 *   "Ligar pro fornecedor #ligacao #urgente /amanha !alta ~15min"
 * Retorna o título limpo (sem os atalhos) e os campos extraídos.
 */
export function parseCapturaRapida(textoOriginal) {
  let texto = textoOriginal;
  const tags = [];
  let prioridade = null;
  let dataAlvo = null;
  let duracaoEstimadaMin = null;
  let energia = null;

  // #tag (contexto livre)
  texto = texto.replace(/#([a-zA-Z0-9\u00C0-\u017F_-]+)/g, (_, tag) => {
    tags.push(tag.toLowerCase());
    return "";
  });

  // !alta / !media / !baixa (prioridade)
  texto = texto.replace(/!(alta|media|média|baixa)\b/gi, (_, p) => {
    prioridade = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return "";
  });

  // ~15min / ~1h / ~2h30 (duração estimada)
  texto = texto.replace(/~(\d+)h(\d+)?|~(\d+)min/gi, (match, h, hmin, min) => {
    if (min) duracaoEstimadaMin = Number(min);
    else duracaoEstimadaMin = Number(h) * 60 + (hmin ? Number(hmin) : 0);
    return "";
  });

  // /hoje /amanha /semana (data alvo + entra automaticamente no Meu Dia quando /hoje ou /amanha)
  texto = texto.replace(/\/(hoje|amanha|amanhã|semana)\b/gi, (_, atalho) => {
    const normalizado = atalho.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (normalizado === "hoje") dataAlvo = hojeISO();
    else if (normalizado === "amanha") dataAlvo = somarDiasISO(1);
    else if (normalizado === "semana") dataAlvo = proximaSegundaISO();
    return "";
  });

  // Energia: /leve /moderada /profunda (opcional, mesma sintaxe de barra)
  texto = texto.replace(/\/(leve|moderada|profunda)\b/gi, (_, e) => {
    energia = e.toLowerCase();
    return "";
  });

  return {
    titulo: texto.replace(/\s{2,}/g, " ").trim(),
    tags,
    prioridade,
    dataAlvo,
    duracaoEstimadaMin,
    energia,
  };
}

/**
 * Calcula métricas de desempenho pessoal a partir de uma lista de demandas
 * já filtrada para o usuário (criadas por ele e/ou atribuídas a ele).
 */
export function calcularMetricasDesempenho(minhasDemandas) {
  const total = minhasDemandas.length;
  const concluidas = minhasDemandas.filter((d) => d.status === "concluido");
  const totalConcluidas = concluidas.length;
  const taxaConclusao = total ? Math.round((totalConcluidas / total) * 100) : 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const emAtraso = minhasDemandas.filter(
    (d) => d.status !== "concluido" && d.prazo_data && new Date(d.prazo_data + "T00:00:00") < hoje
  ).length;

  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const concluidasUltimos7Dias = concluidas.filter((d) => new Date(d.updated_at) >= seteDiasAtras).length;

  const temposConclusao = concluidas
    .filter((d) => d.created_at && d.updated_at)
    .map((d) => (new Date(d.updated_at) - new Date(d.created_at)) / (1000 * 60 * 60 * 24));
  const tempoMedioDias = temposConclusao.length
    ? Math.round((temposConclusao.reduce((a, b) => a + b, 0) / temposConclusao.length) * 10) / 10
    : null;

  return { total, totalConcluidas, taxaConclusao, emAtraso, concluidasUltimos7Dias, tempoMedioDias };
}

/** Agrupa demandas concluídas por semana (as últimas `semanas` semanas), para o gráfico de evolução. */
export function evolucaoSemanal(minhasDemandas, semanas = 8) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const buckets = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - inicio.getDay() - i * 7); // domingo daquela semana
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);
    buckets.push({
      label: `${String(inicio.getDate()).padStart(2, "0")}/${String(inicio.getMonth() + 1).padStart(2, "0")}`,
      inicio,
      fim,
      quantidade: 0,
    });
  }

  for (const d of minhasDemandas) {
    if (d.status !== "concluido" || !d.updated_at) continue;
    const dataConclusao = new Date(d.updated_at);
    const bucket = buckets.find((b) => dataConclusao >= b.inicio && dataConclusao < b.fim);
    if (bucket) bucket.quantidade += 1;
  }

  return buckets.map((b) => ({ semana: b.label, concluidas: b.quantidade }));
}

/** Distribuição das demandas concluídas por prioridade. */
export function distribuicaoPorPrioridade(minhasDemandas) {
  const concluidas = minhasDemandas.filter((d) => d.status === "concluido");
  return PRIORIDADES.map((p) => ({
    prioridade: p.label,
    quantidade: concluidas.filter((d) => d.prioridade === p.valor).length,
  }));
}

/** Formata bytes em KB/MB legível, para exibir o tamanho de um anexo. */
export function formatarTamanhoArquivo(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Emoji de ícone conforme o tipo do arquivo, para a lista de anexos. */
export function iconeArquivo(nomeOuTipo) {
  const valor = (nomeOuTipo || "").toLowerCase();
  if (valor.includes("pdf")) return "📄";
  if (valor.match(/\.(png|jpe?g|gif|webp|svg)$|^image\//)) return "🖼️";
  if (valor.match(/\.(xls|xlsx|csv)$|spreadsheet/)) return "📊";
  if (valor.match(/\.(doc|docx)$|wordprocessing/)) return "📝";
  if (valor.match(/\.(zip|rar|7z)$|zip|compressed/)) return "🗜️";
  if (valor.match(/\.(ppt|pptx)$|presentation/)) return "📽️";
  return "📎";
}

/** Dias entre duas datas ISO (ou timestamps), para mostrar quanto tempo uma demanda levou até ser concluída. */
export function diasEntreDatas(dataInicioISO, dataFimISO) {
  if (!dataInicioISO || !dataFimISO) return null;
  const inicio = new Date(dataInicioISO);
  const fim = new Date(dataFimISO);
  return Math.max(0, Math.round((fim - inicio) / (1000 * 60 * 60 * 24)));
}
