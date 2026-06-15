import { store, AnalysisState } from './store';
import { scrapeWebsite } from './scraper';
import { analyzeBrand, generateAdInsights, generateAdCopies, generateFallbackAds } from './claude';
import { generateAdImages } from './openai';
import { fetchAllCompetitorAds } from './adlibrary';

function updateState(id: string, updates: Partial<AnalysisState>) {
  const current = store.get(id);
  if (current) store.set(id, { ...current, ...updates });
}

export async function runPipeline(id: string, url: string) {
  try {
    // Step 1: Scrape website
    updateState(id, { status: 'scraping', step: 1, stepLabel: 'Analisando site...' });
    const scraped = await scrapeWebsite(url);

    // Step 2: Analyze brand with Claude
    updateState(id, { status: 'analyzing', step: 2, stepLabel: 'Identificando marca e nicho...' });
    const brandAnalysis = await analyzeBrand(scraped.title, scraped.description, scraped.bodyText);
    const brandbook = {
      title: scraped.title,
      description: scraped.description,
      colors: scraped.colors.length > 0 ? scraped.colors : ['#000000', '#ffffff'],
      fonts: scraped.fonts.length > 0 ? scraped.fonts : ['sans-serif'],
      logoUrl: scraped.logoUrl,
      niche: brandAnalysis.niche,
      tone: brandAnalysis.tone,
      audience: brandAnalysis.audience,
    };
    updateState(id, { brandbook, competitorNames: brandAnalysis.competitors });

    // Step 3: Fetch competitor ads from Facebook Ad Library + get insights
    updateState(id, { status: 'competitors', step: 3, stepLabel: 'Buscando anúncios na biblioteca do Facebook...' });
    const [adInsights, realAds] = await Promise.all([
      generateAdInsights(brandAnalysis.niche, brandAnalysis.competitors),
      fetchAllCompetitorAds(brandAnalysis.competitors),
    ]);

    // Fallback to Claude-generated ads if FB Ad Library is blocked
    const competitorAds = realAds.length > 0
      ? realAds
      : await generateFallbackAds(brandAnalysis.niche, brandAnalysis.competitors);

    updateState(id, { adInsights, competitorAds });

    // Step 4: Generate 10 ad copies with Claude
    updateState(id, { status: 'ads', step: 4, stepLabel: 'Gerando 10 variações de copy...' });
    const copies = await generateAdCopies(
      brandAnalysis.niche,
      brandAnalysis.tone,
      brandAnalysis.audience,
      brandbook.colors,
      adInsights
    );

    // Step 5: Generate 10 images with DALL-E 3 (2 batches of 5)
    updateState(id, { status: 'generating', step: 5, stepLabel: 'Gerando 10 criativos com DALL-E 3 (~2 min)...' });
    const imageUrls = await generateAdImages(copies, brandAnalysis.niche, brandbook.colors);

    const creatives = copies.map((copy, i) => ({
      imageUrl: imageUrls[i] || '',
      headline: copy.headline,
      body: copy.body,
      cta: copy.cta,
    }));

    updateState(id, { status: 'done', step: 6, stepLabel: 'Concluído!', creatives });
  } catch (error) {
    updateState(id, {
      status: 'error',
      stepLabel: 'Erro',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
