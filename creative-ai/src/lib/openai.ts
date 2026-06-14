import OpenAI from "openai";
import type { Brandbook } from "./store";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCreativeImage(
  visualPrompt: string,
  brandbook: Brandbook,
  niche: string
): Promise<string> {
  const fullPrompt = `Professional Facebook ad creative image for a ${niche} brand. ${visualPrompt}. Brand colors: ${brandbook.colors.slice(0, 3).join(", ")}. Clean, modern, high-quality photography or illustration. No text, no words, no letters in the image. Suitable for social media advertising.`;

  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: fullPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  });

  return response.data?.[0]?.url ?? "";
}
