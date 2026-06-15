import { store, AnalysisState } from './store';
import { scrapeWebsite } from './scraper';
import { analyzeBrand, generateAdInsights, generateAdCopies, generateCompetitorAdData } from './claude';
import { generateBrandCreatives } from './openai';

function updateState(id: string, updates: Partial<AnalysisState>) {
  const current = store.get(id);
  if (current) store.set(id, { ...current, ...updates });
}

async function getCompetitorAds(competitors: string[], niche: string) {
  // Try Playwright agent first (real FB Ad Library)
  try {
    const { scrapeAdLibrary } = await import('./fbAdAgent');
    const ads = await scrapeAdLibrary(competitors, 'BR', 3);
    if (ads.length > 0) {
      console.log(`[pipeline] Got ${ads.length} real ads from FB Ad Library via Playwright`);
      return ads;
    }
  } catch (err) {
    console.warn('[pipeline] Playwright unavailable, falling back to Claude:', err instanceof Error ? err.message : err);
  }

  // Fallback: Claude generates representative ad data
  const fallback = await generateCompetitorAdData(niche, competitors);
  return fallback.map((ad) => ({ ...ad, imageUrl: '' }));
}

export async function runPipeline(id: string, url: string) {
  try {
    // Step 1: Scrape website — extract colors, fonts, logo, product images
    updateState(id, { status: 'scraping', step: 1, stepLabel: 'Analisando site e extraindo elementos visuais...' });
    const scraped = await scrapeWebsite(url);

    // Step 2: Claude identifies niche, tone, audience, competitors
    updateState(id, { status: 'analyzing', step: 2, stepLabel: 'Identificando marca, nicho e concorrentes...' });
    const brandAnalysis = await analyzeBrand(scraped.title, scraped.description, scraped.bodyText);
    const brandbook = {
      title: scraped.title,
      description: scraped.description,
      colors: scraped.colors.length > 0 ? scraped.colors : ['#6366f1', '#8b5cf6'],
      fonts: scraped.fonts.length > 0 ? scraped.fonts : ['sans-serif'],
      logoUrl: scraped.logoUrl,
      productImages: scraped.productImages,
      niche: brandAnalysis.niche,
      tone: brandAnalysis.tone,
      audience: brandAnalysis.audience,
    };
    updateState(id, { brandbook, competitorNames: brandAnalysis.competitors });

    // Step 3: Open browser → scrape FB Ad Library → get real ads + insights in parallel
    updateState(id, { status: 'competitors', step: 3, stepLabel: 'Abrindo Biblioteca de Anúncios do Facebook...' });
    const [adInsights, competitorAds] = await Promise.all([
      generateAdInsights(brandAnalysis.niche, brandAnalysis.competitors),
      getCompetitorAds(brandAnalysis.competitors, brandAnalysis.niche),
    ]);

    // Sort all fetched ads by longevity descending
    competitorAds.sort((a, b) => b.daysRunning - a.daysRunning);
    updateState(id, { adInsights, competitorAds });

    // Step 4: Claude generates 10 ad copies inspired by top competitor ads
    updateState(id, { status: 'ads', step: 4, stepLabel: 'Gerando 10 copies baseados nos anúncios de maior longevidade...' });
    const copies = await generateAdCopies(
      brandAnalysis.niche,
      brandAnalysis.tone,
      brandAnalysis.audience,
      brandbook.colors,
      adInsights,
      scraped.productImages
    );

    // Step 5: DALL-E generates 10 brand creative images in 2 batches of 5
    updateState(id, { status: 'generating', step: 5, stepLabel: 'Gerando 10 criativos com DALL-E 3 (~3 min)...' });
    const imageUrls = await generateBrandCreatives(
      copies,
      brandAnalysis.niche,
      brandbook.colors,
      scraped.productImages
    );

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
