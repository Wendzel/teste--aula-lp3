import { updateAnalysis } from "./store";
import { scrapeWebsite } from "./scraper";
import { analyzeNiche, analyzeAdPatterns, generateAdCopies } from "./claude";
import { generateCreativeImage } from "./openai";

export async function runPipeline(id: string, url: string): Promise<void> {
  try {
    // Step 1: Scrape website
    updateAnalysis(id, { step: "scraping" });
    const brandbook = await scrapeWebsite(url);
    updateAnalysis(id, { brandbook });

    // Step 2: Analyze with Claude
    updateAnalysis(id, { step: "analyzing" });
    const { niche, tone, audience, competitors: competitorNames } = await analyzeNiche(brandbook, url);
    updateAnalysis(id, { niche, tone, audience });

    // Step 3: Analyze competitors and ad patterns
    updateAnalysis(id, { step: "competitors" });
    const { competitors, insights } = await analyzeAdPatterns(niche, competitorNames, tone);
    updateAnalysis(id, { competitors, adInsights: insights });

    // Step 4: Generate ad copies
    updateAnalysis(id, { step: "ads" });
    const copies = await generateAdCopies(brandbook, niche, insights, tone, audience);

    // Step 5: Generate creative images
    updateAnalysis(id, { step: "generating" });
    const creatives = await Promise.all(
      copies.map(async (copy) => {
        const imageUrl = await generateCreativeImage(copy.visualPrompt, brandbook, niche);
        return {
          headline: copy.headline,
          body: copy.body,
          cta: copy.cta,
          imageUrl,
        };
      })
    );

    updateAnalysis(id, { step: "done", creatives });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    updateAnalysis(id, { step: "error", error: message });
  }
}
