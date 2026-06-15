'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisState } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<AnalysisState | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/analyze/${id}`)
      .then((r) => r.json())
      .then((data) => setState(data as AnalysisState))
      .catch(console.error);
  }, [id]);

  if (!state || state.status !== 'done') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Carregando resultados...</div>
      </main>
    );
  }

  const { brandbook, competitorNames, competitorAds, adInsights, creatives } = state;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Resultados da Análise</h1>
            <p className="text-slate-400 text-sm mt-1">{state.url}</p>
          </div>
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm border border-slate-700 rounded-lg px-4 py-2 hover:border-slate-500 transition-colors">
            ← Nova análise
          </button>
        </div>

        {/* Brandbook */}
        {brandbook && (
          <section className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 space-y-5">
            <h2 className="text-xl font-semibold text-white">🎨 Brandbook</h2>
            <p className="text-slate-300">{brandbook.description || brandbook.title}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">{brandbook.niche}</Badge>
              <Badge variant="outline" className="border-violet-500/30 text-violet-400">{brandbook.tone}</Badge>
              <Badge variant="outline" className="border-green-500/30 text-green-400">{brandbook.audience}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {brandbook.colors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Cores extraídas</p>
                  <div className="flex flex-wrap gap-3">
                    {brandbook.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg border border-slate-600 shadow-lg" style={{ backgroundColor: color }} />
                        <span className="text-slate-400 text-xs font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {brandbook.fonts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Fontes</p>
                  <div className="flex flex-wrap gap-2">
                    {brandbook.fonts.map((font, i) => (
                      <Badge key={i} className="bg-slate-700 text-slate-300 hover:bg-slate-700">{font}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Competitor Ads */}
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              🔍 Anúncios dos Concorrentes
              <span className="text-xs font-normal text-slate-500">via Facebook Ad Library</span>
            </h2>
            {competitorNames && (
              <div className="flex flex-wrap gap-2 mt-2">
                {competitorNames.map((name) => (
                  <Badge key={name} className="bg-slate-700 text-slate-300 hover:bg-slate-700">{name}</Badge>
                ))}
              </div>
            )}
          </div>

          {competitorAds && competitorAds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitorAds.map((ad, i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors">
                  {/* FB-style ad header */}
                  <div className="p-3 flex items-center gap-2 border-b border-slate-700/50">
                    <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {ad.pageName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{ad.pageName}</p>
                      <p className="text-slate-500 text-xs">Patrocinado · Facebook</p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                      ⏱ {ad.daysRunning}d
                    </div>
                  </div>

                  {/* Ad body text */}
                  {ad.body && (
                    <div className="px-3 pt-3 pb-2">
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{ad.body}</p>
                    </div>
                  )}

                  {/* Ad image */}
                  {ad.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.imageUrl} alt={ad.headline} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="mx-3 mb-3 rounded-lg aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center gap-1 px-4">
                      <div className="text-slate-300 text-sm font-semibold text-center">{ad.headline || ad.pageName}</div>
                      <div className="text-slate-500 text-xs text-center">Imagem do anúncio</div>
                    </div>
                  )}

                  {/* CTA bar */}
                  <div className="mx-3 mb-3 mt-2 flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-2">
                    {ad.headline && <span className="text-white text-xs font-medium truncate mr-2">{ad.headline}</span>}
                    <span className="text-slate-300 text-xs bg-slate-600 rounded px-2 py-1 whitespace-nowrap flex-shrink-0">{ad.cta}</span>
                  </div>

                  {ad.adLibraryUrl && ad.adLibraryUrl.includes('id=') && (
                    <div className="px-3 pb-3">
                      <a href={ad.adLibraryUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">
                        Ver na Biblioteca de Anúncios →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6 text-center text-slate-500 text-sm">
              Dados carregados via análise de IA (Facebook Ad Library bloqueou o acesso direto)
            </div>
          )}

          {adInsights && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
              <p className="text-blue-300 text-sm font-medium mb-2">💡 Padrões dos anúncios de maior longevidade</p>
              <p className="text-slate-300 text-sm leading-relaxed">{adInsights}</p>
            </div>
          )}
        </section>

        {/* Generated Creatives — 10 images */}
        {creatives && (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              ⚡ Criativos Gerados com DALL-E 3
              <Badge className="bg-purple-600 text-white">{creatives.length} variações</Badge>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {creatives.map((creative, i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden hover:border-purple-500/40 transition-all group">
                  {creative.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creative.imageUrl}
                      alt={creative.headline}
                      className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center p-3">
                      <div className="text-center">
                        <div className="text-white text-xs font-bold mb-1 line-clamp-2">{creative.headline}</div>
                        <div className="text-slate-400 text-xs line-clamp-3">{creative.body}</div>
                      </div>
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <h3 className="text-white font-bold text-xs leading-tight line-clamp-2">{creative.headline}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{creative.body}</p>
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7">
                      {creative.cta}
                    </Button>
                    {creative.imageUrl && (
                      <a
                        href={creative.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-slate-500 hover:text-slate-300 text-xs underline"
                      >
                        ↓ Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
