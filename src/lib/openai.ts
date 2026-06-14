import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAdImage(
  niche: string,
  colors: string[],
  visualStyle: string
): Promise<string> {
  const prompt = `Professional Facebook ad creative for ${niche} brand. Brand colors: ${colors.join(', ')}. Style: ${visualStyle}. Clean, modern design. No text overlay. Photorealistic product/lifestyle imagery.`;

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
  });

  return response.data?.[0]?.url || '';
}

export async function generateAdImages(
  niche: string,
  colors: string[],
  insights: string
): Promise<string[]> {
  const visualStyle = insights.slice(0, 200);

  const imagePromises = [
    generateAdImage(niche, colors, visualStyle),
    generateAdImage(niche, colors, `${visualStyle} lifestyle focused`),
    generateAdImage(niche, colors, `${visualStyle} product showcase`),
  ];

  const results = await Promise.allSettled(imagePromises);
  return results.map((r) => (r.status === 'fulfilled' ? r.value : ''));
}
