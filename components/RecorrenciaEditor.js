"use client";

import { TIPOS_RECORRENCIA, UNIDADES_PRAZO, DIAS_SEMANA, POSICOES_MES } from "@/lib/demandaUtils";

const REGRA_PADRAO = {
  intervalo: { tipo: "intervalo", intervalo: 1, unidade: "semanas" },
  semanal_dias: { tipo: "semanal_dias", dias_semana: [1] },
  mensal_dia_fixo: { tipo: "mensal_dia_fixo", dia_mes: 1 },
  mensal_posicional: { tipo: "mensal_posicional", posicao: -1, dia_semana_pos: 5 },
};

export default function RecorrenciaEditor({ regra, onChange }) {
  const tipo = regra?.tipo || "";

  function mudarTipo(novoTipo) {
    onChange(novoTipo ? REGRA_PADRAO[novoTipo] : null);
  }

  function atualizarCampo(campo, valor) {
    onChange({ ...regra, [campo]: valor });
  }

  function alternarDiaSemana(dia) {
    const atuais = regra.dias_semana || [];
    const novos = atuais.includes(dia) ? atuais.filter((d) => d !== dia) : [...atuais, dia].sort();
    atualizarCampo("dias_semana", novos);
  }

  return (
    <div className="space-y-2.5">
      <div>
        <label className="label">Repetir</label>
        <select className="input" value={tipo} onChange={(e) => mudarTipo(e.target.value)}>
          {TIPOS_RECORRENCIA.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {tipo === "intervalo" && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-marine-500 shrink-0">A cada</span>
          <input
            type="number"
            min={1}
            className="input w-20"
            value={regra.intervalo}
            onChange={(e) => atualizarCampo("intervalo", Number(e.target.value))}
          />
          <select className="input" value={regra.unidade} onChange={(e) => atualizarCampo("unidade", e.target.value)}>
            {UNIDADES_PRAZO.map((u) => (
              <option key={u.valor} value={u.valor}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {tipo === "semanal_dias" && (
        <div className="flex gap-1.5 flex-wrap">
          {DIAS_SEMANA.map((d) => (
            <button
              key={d.valor}
              type="button"
              onClick={() => alternarDiaSemana(d.valor)}
              className={`text-xs rounded-full px-3 py-1.5 border ${
                (regra.dias_semana || []).includes(d.valor)
                  ? "bg-tide-600 text-white border-tide-600"
                  : "border-marine-200 text-marine-500 hover:bg-marine-50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {tipo === "mensal_dia_fixo" && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-marine-500 shrink-0">Todo mês, dia</span>
          <input
            type="number"
            min={1}
            max={31}
            className="input w-20"
            value={regra.dia_mes}
            onChange={(e) => atualizarCampo("dia_mes", Number(e.target.value))}
          />
        </div>
      )}

      {tipo === "mensal_posicional" && (
        <div className="flex gap-2 items-center flex-wrap">
          <select
            className="input w-32"
            value={regra.posicao}
            onChange={(e) => atualizarCampo("posicao", Number(e.target.value))}
          >
            {POSICOES_MES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            className="input w-36"
            value={regra.dia_semana_pos}
            onChange={(e) => atualizarCampo("dia_semana_pos", Number(e.target.value))}
          >
            {DIAS_SEMANA.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.label}-feira
              </option>
            ))}
          </select>
          <span className="text-sm text-marine-500">do mês</span>
        </div>
      )}
    </div>
  );
}
