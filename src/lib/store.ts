export interface CompetitorAd {
  pageName: string;
  headline: string;
  body: string;
  imageUrl: string;
  cta: string;
  daysRunning: number;
  adLibraryUrl: string;
}

export interface AnalysisState {
  id: string;
  status: 'pending' | 'scraping' | 'analyzing' | 'competitors' | 'ads' | 'generating' | 'done' | 'error';
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
    productImages: string[];
    niche: string;
    tone: string;
    audience: string;
  };
  competitorNames?: string[];
  competitorAds?: CompetitorAd[];
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
