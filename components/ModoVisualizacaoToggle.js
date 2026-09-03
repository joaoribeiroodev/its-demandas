export default function ModoVisualizacaoToggle({ modo, onMudar, labelEquipe = "Minha equipe" }) {
  return (
    <div className="inline-flex rounded-lg border border-marine-200 p-0.5 bg-white">
      <button
        type="button"
        onClick={() => onMudar("equipe")}
        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
          modo === "equipe" ? "bg-marine-800 text-white" : "text-marine-500 hover:bg-marine-50"
        }`}
      >
        {labelEquipe}
      </button>
      <button
        type="button"
        onClick={() => onMudar("minhas")}
        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
          modo === "minhas" ? "bg-marine-800 text-white" : "text-marine-500 hover:bg-marine-50"
        }`}
      >
        Só minhas demandas
      </button>
    </div>
  );
}
