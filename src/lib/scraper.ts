import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedData {
  title: string;
  description: string;
  bodyText: string;
  colors: string[];
  fonts: string[];
  logoUrl: string;
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)',
    },
  });

  const $ = cheerio.load(response.data as string);

  const title = $('title').text() || '';
  const description = $('meta[name="description"]').attr('content') || '';
  const h1 = $('h1').first().text() || '';
  const bodyText = ($('body').text() || '').slice(0, 500);

  const htmlContent = response.data as string;
  const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
  const hexColors = htmlContent.match(colorRegex) || [];
  const rgbColors = htmlContent.match(rgbRegex) || [];
  const colors = [...new Set([...hexColors, ...rgbColors])].slice(0, 10);

  const fontRegex = /font-family\s*:\s*([^;}"']+)/g;
  const fonts: string[] = [];
  let fontMatch;
  while ((fontMatch = fontRegex.exec(htmlContent)) !== null) {
    const font = fontMatch[1].trim().split(',')[0].replace(/['"]/g, '').trim();
    if (font && !fonts.includes(font)) fonts.push(font);
  }

  const logoUrl =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('meta[property="og:image"]').attr('content') ||
    '';

  return {
    title: title || h1,
    description,
    bodyText,
    colors: colors.slice(0, 5),
    fonts: fonts.slice(0, 3),
    logoUrl,
  };
}
