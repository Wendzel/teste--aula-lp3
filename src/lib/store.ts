export interface AnalysisState {
  id: string;
  status: 'pending' | 'scraping' | 'analyzing' | 'competitors' | 'generating' | 'done' | 'error';
  step: number;
  totalSteps: number;
  stepLabel: string;
  url: string;
  brandbook?: {
    title: string;
    description: string;
    colors: string[];
    fonts: string[];
    logoUrl: string;
    niche: string;
    tone: string;
    audience: string;
  };
  competitors?: Array<{
    name: string;
    adPatterns: string;
  }>;
  adInsights?: string;
  creatives?: Array<{
    imageUrl: string;
    headline: string;
    body: string;
    cta: string;
  }>;
  error?: string;
}

const store = new Map<string, AnalysisState>();
export { store };
