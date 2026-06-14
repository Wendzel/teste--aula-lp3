"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) throw new Error("Falha ao iniciar análise");

      const data = await res.json();
      router.push(`/analyze/${data.id}`);
    } catch {
      setError("Erro ao iniciar análise. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Powered by Claude + DALL-E 3</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Criativos que{" "}
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            convertem
          </span>
          ,<br />gerados em segundos
        </h1>

        <p className="text-lg text-gray-400 mb-12 max-w-lg mx-auto">
          Cole a URL do seu site. A IA analisa seus concorrentes, identifica o que
          está performando e gera criativos prontos para veicular.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://seusite.com.br"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-xl transition-all whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Iniciando...
              </span>
            ) : (
              "Gerar Criativos →"
            )}
          </button>
        </form>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { icon: "🎨", title: "Brandbook automático", desc: "Extrai cores, fontes e identidade visual do seu site" },
            { icon: "🔍", title: "Análise de concorrentes", desc: "Identifica quais anúncios performam mais no seu nicho" },
            { icon: "⚡", title: "Criativos prontos", desc: "3 variações de imagem + copy geradas por IA em minutos" },
          ].map((f) => (
            <div key={f.title} className="bg-white/3 border border-white/8 rounded-xl p-5 hover:bg-white/5 transition-all">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-white font-medium mb-1">{f.title}</div>
              <div className="text-gray-500 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
