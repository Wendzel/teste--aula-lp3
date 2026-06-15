import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedData {
  title: string;
  description: string;
  bodyText: string;
  colors: string[];
  fonts: string[];
  logoUrl: string;
  productImages: string[];
  baseUrl: string;
}

function toAbsolute(src: string, base: string): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  try {
    return new URL(src, base).href;
  } catch {
    return '';
  }
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  const response = await axios.get(normalizedUrl, {
    timeout: 12000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    },
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data as string);
  const baseUrl = normalizedUrl;

  const title = $('title').text().trim() || '';
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') || '';
  const h1 = $('h1').first().text().trim() || '';
  const bodyText = ($('body').text() || '').replace(/\s+/g, ' ').slice(0, 600);

  const htmlContent = response.data as string;
  const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
  const hexColors = (htmlContent.match(colorRegex) || []).map((c: string) => c.toUpperCase());
  const rgbColors = htmlContent.match(rgbRegex) || [];
  const allColors = [...new Set([...hexColors, ...rgbColors])].filter((c) => {
    const lower = c.toLowerCase();
    return !['#fff', '#ffffff', '#000', '#000000'].includes(lower);
  });

  const fontRegex = /font-family\s*:\s*([^;}"']+)/g;
  const fonts: string[] = [];
  let fontMatch;
  while ((fontMatch = fontRegex.exec(htmlContent)) !== null) {
    const font = fontMatch[1].trim().split(',')[0].replace(/['"]/g, '').trim();
    if (font && font.length < 50 && !fonts.includes(font)) fonts.push(font);
  }

  // Extract og:image as primary logo/hero
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const favicon =
    $('link[rel="apple-touch-icon"]').attr('href') ||
    $('link[rel="icon"][type="image/png"]').attr('href') ||
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') || '';

  const logoUrl = toAbsolute(ogImage || favicon, baseUrl);

  // Extract product/hero images (prefer large images, not icons)
  const productImages: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const width = parseInt($(el).attr('width') || '0', 10);
    const height = parseInt($(el).attr('height') || '0', 10);
    const alt = ($(el).attr('alt') || '').toLowerCase();

    // Skip tiny images, SVGs, icons, logos
    if (!src || src.endsWith('.svg')) return;
    if (width > 0 && width < 100) return;
    if (height > 0 && height < 100) return;
    if (alt.includes('logo') || alt.includes('icon')) return;

    const abs = toAbsolute(src, baseUrl);
    if (abs && !productImages.includes(abs)) productImages.push(abs);
  });

  // Also grab srcset largest images
  $('img[srcset], source[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset') || '';
    const parts = srcset.split(',').map((s) => s.trim().split(' ')[0]);
    for (const p of parts) {
      const abs = toAbsolute(p, baseUrl);
      if (abs && !productImages.includes(abs)) productImages.push(abs);
    }
  });

  if (ogImage) {
    const abs = toAbsolute(ogImage, baseUrl);
    if (abs && !productImages.includes(abs)) productImages.unshift(abs);
  }

  return {
    title: title || h1,
    description,
    bodyText,
    colors: allColors.slice(0, 6),
    fonts: fonts.slice(0, 3),
    logoUrl,
    productImages: productImages.slice(0, 5),
    baseUrl,
  };
}
