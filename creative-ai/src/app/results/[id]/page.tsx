"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { AnalysisResult } from "@/lib/store";
import Image from "next/image";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/analyze/${id}`)
      .then((r) => r.json())
      .then((json: AnalysisResult) => {
        if (json.step !== "done") {
          router.push(`/analyze/${id}`);
        } else {
          setData(json);
        }
      })
      .catch(() => router.push("/"));
  }, [id, router]);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Seus Criativos</h1>
            <p className="text-gray-500 text-sm mt-1">{data.url}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg px-4 py-2 transition-all hover:bg-white/5"
          >
            ← Nova análise
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Brandbook */}
          <div className="space-y-4">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>🎨</span> Brandbook
              </h2>

              {data.brandbook?.logoUrl && (
                <div className="mb-4 flex items-center gap-3">
                  <Image
                    src={data.brandbook.logoUrl}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-lg object-contain bg-white/10 p-1"
                    unoptimized
                  />
                  <div>
                    <div className="text-white text-sm font-medium">{data.brandbook.title}</div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Cores</div>
                <div className="flex flex-wrap gap-2">
                  {data.brandbook?.colors.map((color) => (
                    <div key={color} className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-md border border-white/10"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-gray-400 text-xs font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Fontes</div>
                <div className="flex flex-wrap gap-2">
                  {data.brandbook?.fonts.map((font) => (
                    <span key={font} className="text-xs bg-white/5 border border-white/10 rounded-md px-2 py-1 text-gray-300">
                      {font}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Descrição</div>
                <p className="text-gray-400 text-sm leading-relaxed">{data.brandbook?.description}</p>
              </div>
            </div>

            {/* Niche & Audience */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-3">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>🎯</span> Posicionamento
              </h2>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Nicho</div>
                <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-full px-3 py-1 text-sm">
                  {data.niche}
                </span>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Tom de voz</div>
                <span className="bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-full px-3 py-1 text-sm">
                  {data.tone}
                </span>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Público-alvo</div>
                <p className="text-gray-400 text-sm">{data.audience}</p>
              </div>
            </div>

            {/* Competitors */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>🔍</span> Concorrentes
              </h2>
              <div className="space-y-3">
                {data.competitors?.map((c) => (
                  <div key={c.name} className="border border-white/8 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-gray-500">{c.adCount} anúncios</span>
                    </div>
                    <div className="text-xs text-green-400 mb-2">
                      ⏱ Média: {c.avgDaysRunning} dias de veiculação
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.topPatterns.map((p) => (
                        <span key={p} className="text-xs bg-white/5 text-gray-400 rounded px-1.5 py-0.5">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Insights */}
            {data.adInsights && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span> Insights
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{data.adInsights}</p>
              </div>
            )}
          </div>

          {/* Right: Creatives */}
          <div className="lg:col-span-2">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span> Criativos Gerados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.creatives?.map((creative, i) => (
                <div key={i} className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all group">
                  {creative.imageUrl ? (
                    <div className="relative aspect-square">
                      <Image
                        src={creative.imageUrl}
                        alt={creative.headline}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-white/5 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">Imagem indisponível</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="text-white font-bold text-sm mb-1">{creative.headline}</div>
                    <div className="text-gray-400 text-xs mb-3 leading-relaxed">{creative.body}</div>
                    <div className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs rounded-lg px-3 py-1.5 text-center font-medium">
                      {creative.cta}
                    </div>

                    {creative.imageUrl && (
                      <a
                        href={creative.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Full insights card */}
            {data.adInsights && (
              <div className="mt-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl p-6">
                <h3 className="text-white font-medium mb-2">📊 Por que esses criativos vão performar</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{data.adInsights}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
