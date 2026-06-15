import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });
    return response.data?.[0]?.url ?? '';
  } catch (err) {
    console.error('DALL-E error:', err instanceof Error ? err.message : err);
    return '';
  }
}

export async function generateCompetitorAdImage(
  brandName: string,
  niche: string,
  adBody: string,
  visualStyle: string
): Promise<string> {
  const prompt = `Realistic Facebook advertisement image for the brand "${brandName}" in the ${niche} industry. ${visualStyle}. The ad shows: ${adBody.slice(0, 120)}. Professional product/lifestyle photography, high quality, no text, no words, no letters in the image. Style consistent with a real social media advertisement.`;
  return generateImage(prompt);
}

export async function generateBrandCreativeImage(
  visualPrompt: string,
  niche: string,
  colors: string[],
  productImages: string[]
): Promise<string> {
  const colorRef = colors.slice(0, 3).join(', ');
  const hasProduct = productImages.length > 0;
  const productRef = hasProduct
    ? `Incorporate the brand's visual style with these color tones: ${colorRef}. Focus on product lifestyle photography.`
    : `Brand colors: ${colorRef}.`;

  const prompt = `Professional Facebook ad creative image for a ${niche} brand. ${visualPrompt}. ${productRef} Clean, modern, high-quality advertising photography. No text, no words, no letters anywhere in the image.`;
  return generateImage(prompt);
}

export async function generateAllCompetitorImages(
  ads: Array<{ pageName: string; body: string; visualStyle: string }>,
  niche: string
): Promise<string[]> {
  const results = await Promise.allSettled(
    ads.map((ad) =>
      generateCompetitorAdImage(ad.pageName, niche, ad.body, ad.visualStyle)
    )
  );
  return results.map((r) => (r.status === 'fulfilled' ? r.value : ''));
}

export async function generateBrandCreatives(
  copies: Array<{ visualPrompt: string }>,
  niche: string,
  colors: string[],
  productImages: string[]
): Promise<string[]> {
  const batchSize = 5;
  const results: string[] = [];

  for (let i = 0; i < copies.length; i += batchSize) {
    const batch = copies.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((copy) =>
        generateBrandCreativeImage(copy.visualPrompt, niche, colors, productImages)
      )
    );
    results.push(...batchResults);
  }

  return results;
}
