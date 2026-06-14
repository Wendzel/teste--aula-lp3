import Anthropic from "@anthropic-ai/sdk";
import type { Brandbook, Competitor } from "./store";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeNiche(
  brandbook: Brandbook,
  url: string
): Promise<{
  niche: string;
  tone: string;
  audience: string;
  competitors: string[];
}> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analise este site e responda APENAS em JSON válido, sem markdown, sem explicações.

Site: ${url}
Título: ${brandbook.title}
Descrição: ${brandbook.description}

Retorne exatamente neste formato:
{
  "niche": "nome do nicho em 2-4 palavras",
  "tone": "tom de voz (profissional/casual/divertido/premium/urgente)",
  "audience": "público-alvo em 1 frase curta",
  "competitors": ["marca1", "marca2", "marca3", "marca4"]
}

Os concorrentes devem ser marcas reais e conhecidas do mesmo nicho, com presença forte em anúncios do Facebook.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude retornou resposta inválida");
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeAdPatterns(
  niche: string,
  competitors: string[],
  tone: string
): Promise<{ competitors: Competitor[]; insights: string }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Você é um especialista em análise de anúncios do Facebook. Analise os padrões de anúncios das marcas do nicho "${niche}".

Marcas para analisar: ${competitors.join(", ")}
Tom de voz do segmento: ${tone}

Baseado no seu conhecimento sobre anúncios de alta performance nestas marcas/nicho, responda APENAS em JSON válido:

{
  "competitors": [
    {
      "name": "nome da marca",
      "adCount": número estimado de anúncios ativos,
      "avgDaysRunning": média de dias de veiculação dos melhores anúncios,
      "topPatterns": ["padrão 1", "padrão 2", "padrão 3"]
    }
  ],
  "insights": "Parágrafo detalhado sobre os padrões visuais, mensagens, hooks e CTAs que mais performam neste nicho. O que os anúncios de maior longevidade têm em comum? Que elementos visuais e textuais convertem mais?"
}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude retornou resposta inválida");
  return JSON.parse(jsonMatch[0]);
}

export async function generateAdCopies(
  brandbook: Brandbook,
  niche: string,
  insights: string,
  tone: string,
  audience: string
): Promise<Array<{ headline: string; body: string; cta: string; visualPrompt: string }>> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Crie 3 variações de anúncio para uma marca do nicho "${niche}".

Marca: ${brandbook.title}
Descrição: ${brandbook.description}
Tom: ${tone}
Público: ${audience}
Cores da marca: ${brandbook.colors.join(", ")}

Insights sobre anúncios de alta performance neste nicho:
${insights}

Retorne APENAS JSON válido com 3 variações:
{
  "copies": [
    {
      "headline": "título impactante em até 30 caracteres",
      "body": "texto do anúncio em até 90 caracteres que gera desejo",
      "cta": "chamada para ação em até 20 caracteres",
      "visualPrompt": "descrição em inglês para geração de imagem: cena, estilo visual, mood, sem texto na imagem"
    }
  ]
}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude retornou resposta inválida");
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.copies;
}
