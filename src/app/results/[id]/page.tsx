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
        <div className="text-white">Loading results...</div>
      </main>
    );
  }

  const { brandbook, competitors, adInsights, creatives } = state;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
          >
            Back
          </button>
          <h1 className="text-2xl font-bold text-white">Brand Analysis Results</h1>
        </div>

        {/* Brandbook */}
        {brandbook && (
          <section className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Brand Book</h2>
            <p className="text-slate-300">{brandbook.description || brandbook.title}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                {brandbook.niche}
              </Badge>
              <Badge variant="outline" className="border-violet-500/30 text-violet-400">
                {brandbook.tone}
              </Badge>
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                {brandbook.audience}
              </Badge>
            </div>

            {brandbook.colors.length > 0 && (
              <div className="space-y-2">
                <p className="text-slate-400 text-sm font-medium">Brand Colors</p>
                <div className="flex flex-wrap gap-2">
                  {brandbook.colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-md border border-slate-600"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-slate-400 text-xs font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {brandbook.fonts.length > 0 && (
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">Fonts</p>
                <div className="flex flex-wrap gap-2">
                  {brandbook.fonts.map((font, i) => (
                    <Badge key={i} className="bg-slate-700 text-slate-300 hover:bg-slate-700">
                      {font}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Competitor Insights */}
        {competitors && (
          <section className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Competitor Analysis</h2>
            <div className="flex flex-wrap gap-2">
              {competitors.map((c) => (
                <Badge key={c.name} className="bg-slate-700 text-slate-300 hover:bg-slate-700">
                  {c.name}
                </Badge>
              ))}
            </div>
            {adInsights && (
              <div className="space-y-2">
                <p className="text-slate-400 text-sm font-medium">Ad Pattern Insights</p>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {adInsights}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Creatives */}
        {creatives && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Generated Ad Creatives</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creatives.map((creative, i) => (
                <div
                  key={i}
                  className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden space-y-4"
                >
                  {creative.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creative.imageUrl}
                      alt={`Ad creative ${i + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-slate-700/50 flex items-center justify-center">
                      <span className="text-slate-500 text-sm">Image unavailable</span>
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="text-white font-bold text-lg">{creative.headline}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{creative.body}</p>
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {creative.cta}
                    </Button>
                    {creative.imageUrl && (
                      <a
                        href={creative.imageUrl}
                        download={`creative-${i + 1}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-slate-400 hover:text-white text-xs underline"
                      >
                        Download Image
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
