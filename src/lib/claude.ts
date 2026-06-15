import Anthropic from '@anthropic-ai/sdk';
import type { CompetitorAd } from './store';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  visualPrompt: string;
}

export async function analyzeBrand(
  title: string,
  description: string,
  bodyText: string
): Promise<BrandAnalysis> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analise este site e retorne APENAS JSON válido (sem markdown):
Título: ${title}
Descrição: ${description}
Conteúdo: ${bodyText}

Formato exato:
{
  "niche": "nicho em 2-4 palavras",
  "tone": "profissional ou casual ou divertido",
  "audience": "descrição do público-alvo",
  "competitors": ["Marca1", "Marca2", "Marca3", "Marca4"]
}

Os concorrentes devem ser marcas reais e conhecidas com forte presença em anúncios do Facebook.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada');
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON não encontrado');
  return JSON.parse(jsonMatch[0]) as BrandAnalysis;
}

export async function generateAdInsights(niche: string, competitors: string[]): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Você é especialista em anúncios do Facebook. Com base no seu conhecimento sobre o nicho "${niche}" e as marcas ${competitors.join(', ')}, descreva os padrões de anúncios de MAIOR LONGEVIDADE (tempo de veiculação = proxy de performance).

Inclua: estilo visual, uso de cores, hooks de mensagem, padrões de CTA, formatos mais eficazes. Seja específico e acionável.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada');
  return content.text;
}

export async function generateFallbackAds(
  niche: string,
  competitors: string[]
): Promise<CompetitorAd[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Crie exemplos realistas de anúncios do Facebook para estas marcas do nicho "${niche}": ${competitors.join(', ')}.

Baseie-se nos anúncios reais que essas marcas costumam veicular. Retorne APENAS JSON:
[
  {
    "pageName": "nome da página",
    "headline": "título do anúncio",
    "body": "texto do anúncio (até 150 chars)",
    "cta": "texto do botão",
    "daysRunning": número de dias em veiculação (entre 30 e 180),
    "adLibraryUrl": "https://www.facebook.com/ads/library/?q=nome+da+marca"
  }
]

Crie 2 anúncios por marca (total ${competitors.length * 2} anúncios). Sem imageUrl no JSON.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada');
  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const ads = JSON.parse(jsonMatch[0]) as Omit<CompetitorAd, 'imageUrl'>[];
  return ads.map((ad) => ({ ...ad, imageUrl: '' }));
}

export async function generateAdCopies(
  niche: string,
  tone: string,
  audience: string,
  colors: string[],
  insights: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Crie 10 variações de copy para anúncio do Facebook para marca de "${niche}" com tom ${tone} para ${audience}.
Cores da marca: ${colors.join(', ')}
Insights de alta performance: ${insights.slice(0, 600)}

Cada variação deve ter uma abordagem diferente (urgência, benefício, prova social, curiosidade, oferta, etc).

Retorne APENAS JSON array com exatamente 10 itens:
[
  {
    "headline": "título impactante em até 30 caracteres",
    "body": "texto persuasivo em até 90 caracteres",
    "cta": "chamada para ação em até 20 caracteres",
    "visualPrompt": "descrição em inglês para DALL-E 3: cena fotográfica específica, estilo visual, mood, sem texto na imagem"
  }
]`,
    }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada');
  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON array não encontrado');
  return JSON.parse(jsonMatch[0]) as AdCopy[];
}
