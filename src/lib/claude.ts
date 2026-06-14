import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface BrandAnalysis {
  niche: string;
  tone: string;
  audience: string;
  competitors: string[];
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
}

export async function analyzeBrand(
  title: string,
  description: string,
  bodyText: string
): Promise<BrandAnalysis> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this website and return JSON only (no markdown, no explanation):
Title: ${title}
Description: ${description}
Body: ${bodyText}

Return this exact JSON structure:
{
  "niche": "1-3 word niche category",
  "tone": "professional or casual or playful",
  "audience": "target audience description",
  "competitors": ["Brand1", "Brand2", "Brand3", "Brand4"]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const text = content.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');

  return JSON.parse(jsonMatch[0]) as BrandAnalysis;
}

export async function generateAdInsights(
  niche: string,
  competitors: string[]
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Based on your knowledge of the ${niche} industry and these competitor brands: ${competitors.join(', ')}, describe high-performing Facebook ad patterns. Include: visual style, color usage, messaging hooks, CTA patterns. Be specific and actionable. Return as plain text paragraphs.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  return content.text;
}

export async function generateAdCopy(
  niche: string,
  tone: string,
  audience: string,
  colors: string[],
  insights: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Write 3 Facebook ad copy variants for a ${niche} brand with ${tone} tone targeting ${audience}.
Brand colors: ${colors.join(', ')}
Ad insights: ${insights.slice(0, 500)}

Return JSON only (no markdown):
[
  {"headline": "max 30 chars", "body": "max 90 chars", "cta": "max 20 chars"},
  {"headline": "max 30 chars", "body": "max 90 chars", "cta": "max 20 chars"},
  {"headline": "max 30 chars", "body": "max 90 chars", "cta": "max 20 chars"}
]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const text = content.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in response');

  return JSON.parse(jsonMatch[0]) as AdCopy[];
}
