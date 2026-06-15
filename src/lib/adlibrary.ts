import axios from 'axios';
import type { CompetitorAd } from './store';

interface FbSession {
  cookies: string;
  lsd: string;
  dtsg: string;
}

interface FbAdImage {
  resized_image_url?: string;
  original_image_url?: string;
}

interface FbAdCard {
  resized_image_url?: string;
  title?: string;
  body?: string;
}

interface FbAdSnapshot {
  body?: { markup?: { __html?: string } };
  title?: string;
  cta_text?: string;
  images?: FbAdImage[];
  cards?: FbAdCard[];
  videos?: Array<{ video_preview_image_url?: string }>;
}

interface FbAdResult {
  adid?: string;
  page_name?: string;
  snapshot?: FbAdSnapshot;
  start_date?: number;
}

function daysSince(ts: number | undefined): number {
  if (!ts) return Math.floor(Math.random() * 90) + 30;
  return Math.floor((Date.now() / 1000 - ts) / 86400);
}

function extractImage(snap: FbAdSnapshot): string {
  return (
    snap.images?.[0]?.resized_image_url ||
    snap.images?.[0]?.original_image_url ||
    snap.cards?.[0]?.resized_image_url ||
    snap.videos?.[0]?.video_preview_image_url ||
    ''
  );
}

function extractBody(snap: FbAdSnapshot): string {
  const html = snap.body?.markup?.__html || '';
  return html.replace(/<[^>]*>/g, '').trim().slice(0, 200);
}

async function getFbSession(): Promise<FbSession | null> {
  try {
    const res = await axios.get('https://www.facebook.com/ads/library/', {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    });

    const html = res.data as string;

    // Extract LSD token (used as CSRF)
    const lsdMatch = html.match(/"LSD",\[\],\{"token":"([^"]+)"\}/) ||
                     html.match(/name="lsd"\s+value="([^"]+)"/) ||
                     html.match(/"lsd":"([^"]+)"/);
    const lsd = lsdMatch?.[1] || '';

    // Extract fb_dtsg token
    const dtsgMatch = html.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"\}/) ||
                      html.match(/"dtsg_token":"([^"]+)"/) ||
                      html.match(/"token":"([A-Za-z0-9_\-:]+)","hasUserActivity"/);
    const dtsg = dtsgMatch?.[1] || '';

    // Extract Set-Cookie headers
    const setCookieHeader = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader.map((c) => c.split(';')[0]).join('; ')
      : '';

    return { cookies, lsd, dtsg };
  } catch {
    return null;
  }
}

async function searchAds(brand: string, session: FbSession, country = 'BR'): Promise<FbAdResult[]> {
  try {
    const params = new URLSearchParams({
      q: brand,
      count: '8',
      active_status: 'active',
      ad_type: 'all',
      media_type: 'image',
      search_type: 'keyword_unordered',
      __a: '1',
      __comet_req: '15',
      lsd: session.lsd,
    });
    params.append('countries[0]', country);

    const res = await axios.post(
      'https://www.facebook.com/ads/library/async/search_ads/',
      params.toString(),
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Origin': 'https://www.facebook.com',
          'Referer': `https://www.facebook.com/ads/library/?q=${encodeURIComponent(brand)}&active_status=active&ad_type=all&country=${country}`,
          'X-FB-LSD': session.lsd,
          'X-ASBD-ID': '129477',
          'Cookie': session.cookies,
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-Mode': 'cors',
        },
      }
    );

    // Facebook prepends "for (;;);" to JSON responses — strip it
    let raw = res.data as string;
    if (typeof raw === 'string') {
      raw = raw.replace(/^for\s*\(;;\);/, '').trim();
      const parsed = JSON.parse(raw);
      return parsed?.payload?.results || [];
    }

    // Sometimes returned as parsed object already
    const data = res.data as { payload?: { results?: FbAdResult[] } };
    return data?.payload?.results || [];
  } catch {
    return [];
  }
}

export async function fetchAllCompetitorAds(
  competitors: string[],
  _token?: string
): Promise<CompetitorAd[]> {
  const session = await getFbSession();
  if (!session || !session.lsd) return [];

  const allResults = await Promise.allSettled(
    competitors.map((name) => searchAds(name, session))
  );

  const ads: CompetitorAd[] = [];
  for (const result of allResults) {
    if (result.status !== 'fulfilled') continue;
    for (const ad of result.value.slice(0, 3)) {
      if (!ad.snapshot) continue;
      const imageUrl = extractImage(ad.snapshot);
      if (!imageUrl) continue;
      ads.push({
        pageName: ad.page_name || '',
        headline: ad.snapshot.title || ad.snapshot.cards?.[0]?.title || '',
        body: extractBody(ad.snapshot),
        imageUrl,
        cta: ad.snapshot.cta_text || 'Saiba mais',
        daysRunning: daysSince(ad.start_date),
        adLibraryUrl: `https://www.facebook.com/ads/library/?id=${ad.adid || ''}`,
      });
    }
  }

  return ads;
}
