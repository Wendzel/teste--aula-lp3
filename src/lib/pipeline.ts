import { store, AnalysisState } from './store';
import { scrapeWebsite } from './scraper';
import { analyzeBrand, generateAdInsights, generateAdCopy } from './claude';
import { generateAdImages } from './openai';

function updateState(id: string, updates: Partial<AnalysisState>) {
  const current = store.get(id);
  if (current) {
    store.set(id, { ...current, ...updates });
  }
}

export async function runPipeline(id: string, url: string) {
  try {
    // Step 1: Scraping
    updateState(id, {
      status: 'scraping',
      step: 1,
      stepLabel: 'Scraping website...',
    });

    const scraped = await scrapeWebsite(url);

    // Step 2: Analyzing brand
    updateState(id, {
      status: 'analyzing',
      step: 2,
      stepLabel: 'Analyzing brand identity...',
    });

    const brandAnalysis = await analyzeBrand(
      scraped.title,
      scraped.description,
      scraped.bodyText
    );

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

    updateState(id, { brandbook });

    // Step 3: Competitor research
    updateState(id, {
      status: 'competitors',
      step: 3,
      stepLabel: 'Researching competitors...',
    });

    const adInsights = await generateAdInsights(
      brandAnalysis.niche,
      brandAnalysis.competitors
    );

    const competitors = brandAnalysis.competitors.map((name) => ({
      name,
      adPatterns: `Based on industry analysis for ${name} in the ${brandAnalysis.niche} space.`,
    }));

    updateState(id, { competitors, adInsights });

    // Step 4: Generating creatives
    updateState(id, {
      status: 'generating',
      step: 4,
      stepLabel: 'Generating ad creatives...',
    });

    const [imageUrls, adCopies] = await Promise.all([
      generateAdImages(brandAnalysis.niche, brandbook.colors, adInsights),
      generateAdCopy(
        brandAnalysis.niche,
        brandAnalysis.tone,
        brandAnalysis.audience,
        brandbook.colors,
        adInsights
      ),
    ]);

    const creatives = adCopies.map((copy, i) => ({
      imageUrl: imageUrls[i] || '',
      headline: copy.headline,
      body: copy.body,
      cta: copy.cta,
    }));

    updateState(id, {
      status: 'done',
      step: 5,
      stepLabel: 'Complete!',
      creatives,
    });
  } catch (error) {
    updateState(id, {
      status: 'error',
      stepLabel: 'Error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
