import { chromium } from 'playwright';
import type { CompetitorAd } from './store';

interface RawAd {
  pageName: string;
  body: string;
  headline: string;
  imageUrl: string;
  cta: string;
  startedDate: string;
}

function parseDaysRunning(dateStr: string): number {
  if (!dateStr) return 0;
  const match = dateStr.match(/(\d{1,2})\s+de\s+(\w+)\.?\s+de\s+(\d{4})/i) ||
                dateStr.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!match) return 0;

  const monthsPt: Record<string, number> = {
    jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
    jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
  };
  const monthsEn: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  try {
    let date: Date;
    if (match[2] && isNaN(Number(match[2]))) {
      // "15 de jan. de 2024" format
      const monthKey = match[2].toLowerCase().slice(0, 3);
      const month = monthsPt[monthKey] ?? monthsEn[monthKey] ?? 0;
      date = new Date(Number(match[3]), month, Number(match[1]));
    } else {
      // "January 15, 2024" format
      const monthKey = match[1].toLowerCase();
      const month = monthsEn[monthKey] ?? 0;
      date = new Date(Number(match[3]), month, Number(match[2]));
    }
    return Math.floor((Date.now() - date.getTime()) / 86400000);
  } catch {
    return 0;
  }
}

export async function scrapeAdLibrary(
  competitors: string[],
  country = 'BR',
  maxAdsPerBrand = 4
): Promise<CompetitorAd[]> {
  const browser = await chromium.launch({
    channel: 'chrome', // uses installed Chrome on Mac
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });

  // Dismiss cookie consent / login popups
  context.on('page', async (page) => {
    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });
    } catch { /* ignore */ }
  });

  const allAds: CompetitorAd[] = [];

  for (const brand of competitors) {
    let page;
    try {
      page = await context.newPage();
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });

      const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(brand)}&search_type=keyword_unordered&media_type=image`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Dismiss any modal/cookie popup
      try {
        await page.click('[data-testid="cookie-policy-manage-dialog-accept-button"]', { timeout: 3000 });
      } catch { /* no cookie dialog */ }
      try {
        await page.click('button[aria-label="Fechar"]', { timeout: 2000 });
      } catch { /* no close button */ }

      // Wait for ads to load
      await page.waitForSelector('[class*="x1qjc9v5"]', { timeout: 15000 }).catch(() => null);
      await page.waitForTimeout(3000);

      // Scroll to load more ads
      await page.evaluate(() => window.scrollBy(0, 1200));
      await page.waitForTimeout(2000);

      // Extract ads from the page
      const rawAds = await page.evaluate((maxAds) => {
        const results: Array<{
          pageName: string;
          body: string;
          headline: string;
          imageUrl: string;
          cta: string;
          startedDate: string;
        }> = [];

        // Find all ad cards — FB uses dynamic class names, so we look for structural patterns
        // Ad cards contain: page name, ad text, image, and "Ativo desde" date
        const allDivs = document.querySelectorAll('div');
        const adCards: Element[] = [];

        for (const div of allDivs) {
          const text = div.textContent || '';
          // Cards that contain "Ativo desde" or "Active since" are ad cards
          if (
            (text.includes('Ativo desde') || text.includes('Active since') || text.includes('Started running')) &&
            div.children.length > 0 &&
            div.children.length < 20
          ) {
            adCards.push(div);
          }
        }

        // De-duplicate by taking the most specific (deepest) matching element
        const seen = new Set<string>();
        for (const card of adCards.slice(0, maxAds * 3)) {
          const key = (card.textContent || '').slice(0, 100);
          if (seen.has(key)) continue;
          seen.add(key);

          // Page name — usually in a link or bold text near the top
          const pageNameEl = card.querySelector('a[role="link"] span, h2, h3, [class*="x1heor9g"]');
          const pageName = pageNameEl?.textContent?.trim() || '';

          // Body text — paragraphs or large text blocks
          const bodyEls = card.querySelectorAll('p, [class*="x1iorvi4"], [class*="xdj266r"]');
          let body = '';
          for (const el of bodyEls) {
            const t = el.textContent?.trim() || '';
            if (t.length > 20 && !t.includes('Ativo desde') && !t.includes('Active since')) {
              body = t.slice(0, 200);
              break;
            }
          }

          // Image
          const img = card.querySelector('img[src*="fbcdn"], img[src*="scontent"]') as HTMLImageElement | null;
          const imageUrl = img?.src || '';

          // Headline (often in a bold or header element after the image)
          const headlineEl = card.querySelector('[class*="x1heor9g"] + * span, strong, b') as HTMLElement | null;
          const headline = headlineEl?.textContent?.trim() || '';

          // CTA button
          const ctaEl = card.querySelector('[role="button"]:not([aria-label="Mais"]):not([aria-label="Fechar"])') as HTMLElement | null;
          const cta = ctaEl?.textContent?.trim() || 'Saiba mais';

          // "Ativo desde" date
          const fullText = card.textContent || '';
          const dateMatch = fullText.match(/(?:Ativo desde|Active since|Started running)[:\s]+([^\n·]+)/i);
          const startedDate = dateMatch?.[1]?.trim() || '';

          if (imageUrl && (pageName || body)) {
            results.push({ pageName, body, headline, imageUrl, cta, startedDate });
          }

          if (results.length >= maxAds) break;
        }

        return results;
      }, maxAdsPerBrand);

      // Convert raw ads to CompetitorAd, calculate days running
      const brandAds: CompetitorAd[] = rawAds.map((ad) => ({
        pageName: ad.pageName || brand,
        headline: ad.headline,
        body: ad.body,
        imageUrl: ad.imageUrl,
        cta: ad.cta || 'Saiba mais',
        daysRunning: parseDaysRunning(ad.startedDate),
        adLibraryUrl: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(brand)}&search_type=keyword_unordered`,
      }));

      // Sort by days running descending (longest = best performing)
      brandAds.sort((a, b) => b.daysRunning - a.daysRunning);
      allAds.push(...brandAds.slice(0, maxAdsPerBrand));
    } catch (err) {
      console.error(`[fbAdAgent] Error scraping ${brand}:`, err instanceof Error ? err.message : err);
    } finally {
      await page?.close();
    }
  }

  await browser.close();
  return allAds;
}
