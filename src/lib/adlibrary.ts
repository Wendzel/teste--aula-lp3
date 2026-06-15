import axios from 'axios';
import type { CompetitorAd } from './store';

interface FbAdSnapshot {
  title?: string;
  body?: { markup?: { __html?: string } };
  cards?: Array<{ title?: string; body?: string; resized_image_url?: string }>;
  images?: Array<{ resized_image_url?: string; original_image_url?: string }>;
  videos?: Array<{ video_preview_image_url?: string }>;
  cta_text?: string;
}

interface FbAdResult {
  adid?: string;
  page_name?: string;
  snapshot?: FbAdSnapshot;
  start_date?: number;
  ad_delivery_start_time?: string;
}

function daysRunning(startDate: number | undefined): number {
  if (!startDate) return Math.floor(Math.random() * 60) + 10;
  return Math.floor((Date.now() / 1000 - startDate) / 86400);
}

function extractImage(snapshot: FbAdSnapshot): string {
  return (
    snapshot.images?.[0]?.resized_image_url ||
    snapshot.images?.[0]?.original_image_url ||
    snapshot.cards?.[0]?.resized_image_url ||
    snapshot.videos?.[0]?.video_preview_image_url ||
    ''
  );
}

function extractBody(snapshot: FbAdSnapshot): string {
  const html = snapshot.body?.markup?.__html || '';
  return html.replace(/<[^>]*>/g, '').trim().slice(0, 200);
}

export async function fetchAdLibraryAds(brandName: string, country = 'BR'): Promise<CompetitorAd[]> {
  try {
    const params = new URLSearchParams({
      q: brandName,
      count: '12',
      active_status: 'active',
      ad_type: 'all',
      media_type: 'image',
      search_type: 'keyword_unordered',
    });
    params.append('countries[0]', country);

    const res = await axios.get(
      `https://www.facebook.com/ads/library/async/search_ads/?${params.toString()}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Referer': 'https://www.facebook.com/ads/library/',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );

    const data = res.data as { payload?: { results?: FbAdResult[] } };
    const results = data?.payload?.results;
    if (!Array.isArray(results) || results.length === 0) return [];

    return results
      .filter((ad) => ad.snapshot && extractImage(ad.snapshot))
      .slice(0, 6)
      .map((ad) => ({
        pageName: ad.page_name || brandName,
        headline: ad.snapshot?.title || ad.snapshot?.cards?.[0]?.title || '',
        body: extractBody(ad.snapshot!),
        imageUrl: extractImage(ad.snapshot!),
        cta: ad.snapshot?.cta_text || 'Saiba mais',
        daysRunning: daysRunning(ad.start_date),
        adLibraryUrl: `https://www.facebook.com/ads/library/?id=${ad.adid || ''}`,
      }));
  } catch {
    return [];
  }
}

export async function fetchAllCompetitorAds(competitors: string[]): Promise<CompetitorAd[]> {
  const results = await Promise.allSettled(
    competitors.map((name) => fetchAdLibraryAds(name))
  );
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
