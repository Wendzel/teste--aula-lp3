export type AnalysisStep =
  | "pending"
  | "scraping"
  | "analyzing"
  | "competitors"
  | "ads"
  | "generating"
  | "done"
  | "error";

export interface AdCreative {
  headline: string;
  body: string;
  cta: string;
  imageUrl: string;
}

export interface Competitor {
  name: string;
  adCount: number;
  avgDaysRunning: number;
  topPatterns: string[];
}

export interface Brandbook {
  colors: string[];
  fonts: string[];
  logoUrl: string;
  title: string;
  description: string;
}

export interface AnalysisResult {
  id: string;
  url: string;
  step: AnalysisStep;
  error?: string;
  brandbook?: Brandbook;
  niche?: string;
  tone?: string;
  audience?: string;
  competitors?: Competitor[];
  adInsights?: string;
  creatives?: AdCreative[];
  createdAt: number;
}

const store = new Map<string, AnalysisResult>();

export function getAnalysis(id: string): AnalysisResult | undefined {
  return store.get(id);
}

export function setAnalysis(id: string, data: AnalysisResult): void {
  store.set(id, data);
}

export function updateAnalysis(
  id: string,
  updates: Partial<AnalysisResult>
): void {
  const existing = store.get(id);
  if (existing) {
    store.set(id, { ...existing, ...updates });
  }
}
