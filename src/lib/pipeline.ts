import { store, AnalysisState } from './store';
import { scrapeWebsite } from './scraper';
import { analyzeBrand, generateAdInsights, generateAdCopies, generateCompetitorAdData } from './claude';
import { generateAllCompetitorImages, generateBrandCreatives } from './openai';

function updateState(id: string, updates: Partial<AnalysisState>) {
  const current = store.get(id);
  if (current) store.set(id, { ...current, ...updates });
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

    // Step 3: Claude generates competitor ad data + insights in parallel
    updateState(id, { status: 'competitors', step: 3, stepLabel: 'Analisando anúncios de maior longevidade dos concorrentes...' });
    const [adInsights, competitorAdData] = await Promise.all([
      generateAdInsights(brandAnalysis.niche, brandAnalysis.competitors),
      generateCompetitorAdData(brandAnalysis.niche, brandAnalysis.competitors),
    ]);
    updateState(id, { adInsights });

    // Step 4: Generate DALL-E images for competitor ads
    updateState(id, { status: 'ads', step: 4, stepLabel: `Gerando imagens para ${competitorAdData.length} anúncios dos concorrentes...` });
    const competitorImageUrls = await generateAllCompetitorImages(
      competitorAdData.map((ad) => ({ pageName: ad.pageName, body: ad.body, visualStyle: ad.visualStyle })),
      brandAnalysis.niche
    );
    const competitorAds = competitorAdData.map((ad, i) => ({
      pageName: ad.pageName,
      headline: ad.headline,
      body: ad.body,
      cta: ad.cta,
      daysRunning: ad.daysRunning,
      adLibraryUrl: ad.adLibraryUrl,
      imageUrl: competitorImageUrls[i] || '',
    }));
    updateState(id, { competitorAds });

    // Step 5: Claude generates 10 ad copies with specific visual prompts
    updateState(id, { status: 'generating', step: 5, stepLabel: 'Gerando 10 variações de copy baseadas nos concorrentes...' });
    const copies = await generateAdCopies(
      brandAnalysis.niche,
      brandAnalysis.tone,
      brandAnalysis.audience,
      brandbook.colors,
      adInsights,
      scraped.productImages
    );

    // Step 6: Generate 10 brand creative images with DALL-E (2 batches of 5)
    updateState(id, { status: 'generating', step: 6, stepLabel: 'Gerando 10 criativos da sua marca com DALL-E 3 (~3 min)...' });
    const imageUrls = await generateBrandCreatives(copies, brandAnalysis.niche, brandbook.colors, scraped.productImages);

    const creatives = copies.map((copy, i) => ({
      imageUrl: imageUrls[i] || '',
      headline: copy.headline,
      body: copy.body,
      cta: copy.cta,
    }));

    updateState(id, { status: 'done', step: 7, stepLabel: 'Concluído!', creatives });
  } catch (error) {
    updateState(id, {
      status: 'error',
      stepLabel: 'Erro',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
