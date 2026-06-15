'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { AnalysisState } from '@/lib/store';

const steps = [
  { label: 'Analisando site', status: 'scraping' },
  { label: 'Identificando marca e nicho', status: 'analyzing' },
  { label: 'Buscando anúncios dos concorrentes', status: 'competitors' },
  { label: 'Gerando copies com Claude', status: 'ads' },
  { label: 'Gerando 10 imagens com DALL-E 3', status: 'generating' },
  { label: 'Concluído', status: 'done' },
];

export default function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<AnalysisState | null>(null);
  const router = useRouter();

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/analyze/${id}`);
        if (!res.ok) return;
        const data = await res.json() as AnalysisState;
        setState(data);
        if (data.status === 'done') router.push(`/results/${id}`);
      } catch { /* keep polling */ }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [id, router]);

  function getStepState(stepStatus: string): 'pending' | 'current' | 'done' {
    if (!state) return 'pending';
    if (state.status === 'done') return 'done';
    const currentIndex = steps.findIndex((s) => s.status === state.status);
    const stepIndex = steps.findIndex((s) => s.status === stepStatus);
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Analisando sua marca</h1>
          <p className="text-slate-400 text-sm">{state?.url}</p>
        </div>

        {state?.status === 'error' ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-3">
            <div className="text-red-400 text-lg font-semibold">Falha na análise</div>
            <p className="text-red-300 text-sm">{state.error}</p>
            <button onClick={() => router.push('/')} className="text-blue-400 hover:text-blue-300 text-sm underline">Tentar novamente</button>
          </div>
        ) : (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 space-y-4">
            {steps.map((step, index) => {
              const ss = getStepState(step.status);
              return (
                <div key={step.status} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    {ss === 'done' && (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {ss === 'current' && (
                      <div className="w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                    )}
                    {ss === 'pending' && (
                      <div className="w-8 h-8 border-2 border-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-slate-600 text-xs font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <span className={ss === 'done' ? 'text-green-400 font-medium' : ss === 'current' ? 'text-white font-medium' : 'text-slate-500'}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {state?.stepLabel && state.status !== 'error' && (
          <p className="text-center text-slate-400 text-sm animate-pulse">{state.stepLabel}</p>
        )}
        <p className="text-center text-slate-600 text-xs">Geração de 10 imagens com DALL-E 3 leva ~3 minutos</p>
      </div>
    </main>
  );
}
