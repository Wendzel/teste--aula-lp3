import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateSingleImage(prompt: string): Promise<string> {
  try {
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt}. No text, no words, no letters anywhere in the image. High-quality photorealistic advertising image.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });
    return response.data?.[0]?.url ?? '';
  } catch {
    return '';
  }
}

export async function generateAdImages(
  copies: Array<{ visualPrompt: string }>,
  niche: string,
  colors: string[]
): Promise<string[]> {
  // DALL-E 3 only supports n=1 per call — run in parallel batches of 5
  const batchSize = 5;
  const results: string[] = [];

  for (let i = 0; i < copies.length; i += batchSize) {
    const batch = copies.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((copy) => {
        const prompt = `Professional Facebook ad creative for ${niche} brand. ${copy.visualPrompt}. Brand colors: ${colors.slice(0, 3).join(', ')}. Clean, modern advertising photography.`;
        return generateSingleImage(prompt);
      })
    );
    results.push(...batchResults);
  }

  return results;
}
