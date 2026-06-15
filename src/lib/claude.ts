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

export interface CompetitorAdData extends Omit<CompetitorAd, 'imageUrl'> {
  visualStyle: string;
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

export async function generateCompetitorAdData(
  niche: string,
  competitors: string[]
): Promise<CompetitorAdData[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Crie exemplos realistas dos anúncios do Facebook de MAIOR LONGEVIDADE para estas marcas do nicho "${niche}": ${competitors.join(', ')}.

Baseie-se nos anúncios que essas marcas realmente veiculam há mais tempo (longevidade = sucesso). Crie 2 anúncios por marca.

Retorne APENAS JSON array:
[
  {
    "pageName": "Nome exato da marca",
    "headline": "título do anúncio (até 40 chars)",
    "body": "texto do anúncio realista (até 150 chars), com o estilo real da marca",
    "cta": "texto do botão CTA real",
    "daysRunning": número entre 60 e 200,
    "adLibraryUrl": "https://www.facebook.com/ads/library/?q=nome+da+marca&active_status=active",
    "visualStyle": "descrição em inglês do estilo visual do anúncio para DALL-E: tipo de cena, iluminação, mood, estética, sem mencionar texto"
  }
]`,
    }],
  });
  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Resposta inesperada');
  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]) as CompetitorAdData[];
}

export async function generateAdCopies(
  niche: string,
  tone: string,
  audience: string,
  colors: string[],
  insights: string,
  productImages: string[]
): Promise<AdCopy[]> {
  const imageContext = productImages.length > 0
    ? `O site tem imagens de produto disponíveis. Use elementos visuais coerentes com o site nos prompts de imagem.`
    : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    messages: [{
      role: 'user',
      content: `Crie 10 variações de copy para anúncio do Facebook para marca de "${niche}" com tom ${tone} para ${audience}.
Cores da marca: ${colors.join(', ')}
${imageContext}
Insights dos anúncios de maior longevidade dos concorrentes: ${insights.slice(0, 700)}

Cada variação deve ter abordagem diferente (urgência, benefício, prova social, curiosidade, oferta, antes/depois, pergunta, etc).
Os prompts de imagem devem ser MUITO específicos e diferentes entre si — cenas fotográficas reais, não genéricas.

Retorne APENAS JSON array com exatamente 10 itens:
[
  {
    "headline": "título impactante em até 30 caracteres",
    "body": "texto persuasivo em até 90 caracteres que gera desejo real",
    "cta": "chamada para ação em até 20 caracteres",
    "visualPrompt": "descrição detalhada em inglês para DALL-E 3: cena fotográfica específica (ex: 'close-up of woman's hands holding a supplement bottle against soft morning light, marble countertop, fresh flowers in background'), estilo, mood, sem texto"
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
