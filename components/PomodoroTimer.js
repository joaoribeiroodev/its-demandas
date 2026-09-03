"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [
  { minutos: 25, label: "Foco 25min" },
  { minutos: 5, label: "Pausa 5min" },
  { minutos: 15, label: "Pausa 15min" },
];

const MIN_MINUTOS = 1;
const MAX_MINUTOS = 180;

export default function PomodoroTimer() {
  const [duracaoMin, setDuracaoMin] = useState(25);
  const [segundosRestantes, setSegundosRestantes] = useState(25 * 60);
  const [rodando, setRodando] = useState(false);
  const [ciclosConcluidos, setCiclosConcluidos] = useState(0);
  const [editando, setEditando] = useState(false);
  const [valorEditado, setValorEditado] = useState("25");
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!rodando) return;
    intervalRef.current = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRodando(false);
          setCiclosConcluidos((c) => c + 1);
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("Tempo esgotado!", { body: "Pomodoro concluído — hora de uma pausa." });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [rodando]);

  useEffect(() => {
    if (editando) inputRef.current?.select();
  }, [editando]);

  function escolherPreset(minutos) {
    setRodando(false);
    setDuracaoMin(minutos);
    setSegundosRestantes(minutos * 60);
  }

  function alternar() {
    if (segundosRestantes === 0) {
      setSegundosRestantes(duracaoMin * 60);
    }
    setRodando((r) => !r);
  }

  function reiniciar() {
    setRodando(false);
    setSegundosRestantes(duracaoMin * 60);
  }

  function abrirEdicao() {
    if (rodando) return;
    setValorEditado(String(duracaoMin));
    setEditando(true);
  }

  function confirmarEdicao() {
    const novoValor = Math.min(MAX_MINUTOS, Math.max(MIN_MINUTOS, Number(valorEditado) || duracaoMin));
    setDuracaoMin(novoValor);
    setSegundosRestantes(novoValor * 60);
    setEditando(false);
  }

  function handleKeyDownEdicao(e) {
    if (e.key === "Enter") confirmarEdicao();
    if (e.key === "Escape") setEditando(false);
  }

  const minutos = Math.floor(segundosRestantes / 60)
    .toString()
    .padStart(2, "0");
  const segundos = (segundosRestantes % 60).toString().padStart(2, "0");

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-marine-800">Modo Foco</span>
        {ciclosConcluidos > 0 && (
          <span className="text-[11px] text-marine-400">{ciclosConcluidos} ciclo(s) hoje</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {editando ? (
          <div className="flex items-baseline gap-1">
            <input
              ref={inputRef}
              type="number"
              min={MIN_MINUTOS}
              max={MAX_MINUTOS}
              value={valorEditado}
              onChange={(e) => setValorEditado(e.target.value)}
              onBlur={confirmarEdicao}
              onKeyDown={handleKeyDownEdicao}
              className="font-display text-3xl font-bold text-marine-900 w-20 border-b-2 border-tide-500 outline-none bg-transparent"
            />
            <span className="text-sm text-marine-400">min</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={abrirEdicao}
            disabled={rodando}
            title={rodando ? "Pause para editar a duração" : "Clique para editar a duração"}
            className="font-display text-3xl font-bold text-marine-900 tabular-nums disabled:cursor-not-allowed hover:text-tide-700 transition-colors"
          >
            {minutos}:{segundos}
          </button>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={alternar} className="btn-primary text-xs px-3 py-1.5">
            {rodando ? "Pausar" : segundosRestantes === 0 ? "Reiniciar" : "Iniciar"}
          </button>
          <button type="button" onClick={reiniciar} className="btn-ghost text-xs px-3 py-1.5">
            Zerar
          </button>
        </div>
      </div>
      {!editando && !rodando && (
        <p className="text-[11px] text-marine-400 mt-1">Clique no tempo para digitar uma duração personalizada.</p>
      )}

      <div className="flex gap-1.5 mt-3">
        {PRESETS.map((p) => (
          <button
            key={p.minutos}
            type="button"
            onClick={() => escolherPreset(p.minutos)}
            className={`text-[11px] rounded-full px-2.5 py-1 border ${
              duracaoMin === p.minutos
                ? "bg-tide-600 text-white border-tide-600"
                : "border-marine-200 text-marine-500 hover:bg-marine-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
