"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { AnalysisResult, AnalysisStep } from "@/lib/store";

const STEPS: { key: AnalysisStep; label: string; desc: string }[] = [
  { key: "scraping", label: "Analisando seu site", desc: "Extraindo cores, fontes e identidade visual" },
  { key: "analyzing", label: "Identificando nicho", desc: "Claude analisa seu mercado e público-alvo" },
  { key: "competitors", label: "Pesquisando concorrentes", desc: "Mapeando marcas que dominam o seu nicho" },
  { key: "ads", label: "Estudando anúncios", desc: "Identificando padrões dos anúncios de maior longevidade" },
  { key: "generating", label: "Gerando criativos", desc: "DALL-E 3 criando suas imagens personalizadas" },
];

const ORDER: AnalysisStep[] = ["pending", "scraping", "analyzing", "competitors", "ads", "generating", "done"];

function stepIndex(step: AnalysisStep): number {
  return ORDER.indexOf(step);
}

export default function AnalyzePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!id) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyze/${id}`);
        if (!res.ok) return;
        const json: AnalysisResult = await res.json();
        setData(json);

        if (json.step === "done") {
          clearInterval(poll);
          router.push(`/results/${id}`);
        } else if (json.step === "error") {
          clearInterval(poll);
        }
      } catch {
        // keep polling
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [id, router]);

  const currentIndex = data ? stepIndex(data.step) : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Analisando sua marca</h2>
          <p className="text-gray-500 text-sm">{data?.url}</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isDone = currentIndex > i + 1;
            const isActive = currentIndex === i + 1;
            const isPending = currentIndex < i + 1;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isActive
                    ? "bg-purple-600/10 border-purple-500/40"
                    : isDone
                    ? "bg-white/3 border-white/8"
                    : "bg-white/1 border-white/5 opacity-40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDone
                      ? "bg-green-500"
                      : isActive
                      ? "bg-purple-600"
                      : "bg-white/10"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="text-gray-500 text-xs">{i + 1}</span>
                  )}
                </div>
                <div>
                  <div className={`font-medium text-sm ${isPending ? "text-gray-600" : "text-white"}`}>
                    {step.label}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {data?.step === "error" && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm font-medium">Erro na análise</p>
            <p className="text-red-500/70 text-xs mt-1">{data.error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-3 text-sm text-red-400 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-8">
          Isso pode levar 1–2 minutos enquanto geramos suas imagens com DALL-E 3
        </p>
      </div>
    </main>
  );
}
