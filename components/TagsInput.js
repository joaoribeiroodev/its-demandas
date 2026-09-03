"use client";

import { useState } from "react";

export default function TagsInput({ tags, onChange }) {
  const [texto, setTexto] = useState("");

  function adicionar() {
    const limpa = texto.trim().replace(/^#/, "").toLowerCase();
    if (!limpa || tags.includes(limpa)) {
      setTexto("");
      return;
    }
    onChange([...tags, limpa]);
    setTexto("");
  }

  function remover(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      adicionar();
    } else if (e.key === "Backspace" && !texto && tags.length) {
      remover(tags[tags.length - 1]);
    }
  }

  return (
    <div className="input flex flex-wrap items-center gap-1.5 py-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-marine-100 text-marine-700 text-xs font-medium px-2 py-0.5"
        >
          #{tag}
          <button type="button" onClick={() => remover(tag)} className="text-marine-400 hover:text-marine-700">
            &times;
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
        placeholder={tags.length ? "" : "adicionar tag..."}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={adicionar}
      />
    </div>
  );
}
