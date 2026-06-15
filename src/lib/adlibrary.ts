import axios from 'axios';
import type { CompetitorAd } from './store';

interface MetaAdCreative {
  body?: string;
  title?: string;
  image_url?: string;
  video_preview_image_url?: string;
}

interface MetaAd {
  id: string;
  page_name: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_captions?: string[];
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
  ad_creative_images?: MetaAdCreative[];
  impressions?: { lower_bound: string; upper_bound: string };
}

interface MetaApiResponse {
  data?: MetaAd[];
  error?: { message: string };
}

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 30;
  const start = new Date(dateStr).getTime();
  return Math.floor((Date.now() - start) / 86400000);
}

async function getAdSnapshotImage(snapshotUrl: string, token: string): Promise<string> {
  try {
    // Try to extract ad image from snapshot page
    const res = await axios.get(snapshotUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      },
      params: { access_token: token },
    });
    const html = res.data as string;
    // Extract og:image or first significant img src from snapshot HTML
    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
    if (ogMatch) return ogMatch[1];
    const imgMatch = html.match(/<img[^>]+src="(https:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
    if (imgMatch) return imgMatch[1];
    return '';
  } catch {
    return '';
  }
}

export async function fetchAdLibraryByBrand(
  brandName: string,
  token: string,
  country = 'BR'
): Promise<CompetitorAd[]> {
  try {
    const res = await axios.get<MetaApiResponse>(
      'https://graph.facebook.com/v21.0/ads_archive',
      {
        timeout: 15000,
        params: {
          search_terms: brandName,
          ad_type: 'ALL',
          ad_reached_countries: JSON.stringify([country]),
          active_status: 'ACTIVE',
          limit: 6,
          fields: [
            'id',
            'page_name',
            'ad_creative_bodies',
            'ad_creative_link_titles',
            'ad_delivery_start_time',
            'ad_snapshot_url',
          ].join(','),
          access_token: token,
        },
      }
    );

    const ads = res.data?.data;
    if (!ads || ads.length === 0) return [];

    const results = await Promise.all(
      ads.slice(0, 4).map(async (ad): Promise<CompetitorAd> => {
        const body = ad.ad_creative_bodies?.[0] || '';
        const headline = ad.ad_creative_link_titles?.[0] || '';
        const daysRunning = daysSince(ad.ad_delivery_start_time);

        let imageUrl = '';
        if (ad.ad_snapshot_url) {
          imageUrl = await getAdSnapshotImage(ad.ad_snapshot_url, token);
        }

        return {
          pageName: ad.page_name || brandName,
          headline,
          body,
          imageUrl,
          cta: 'Saiba mais',
          daysRunning,
          adLibraryUrl: ad.ad_snapshot_url || `https://www.facebook.com/ads/library/?q=${encodeURIComponent(brandName)}&active_status=active`,
        };
      })
    );

    return results.filter((ad) => ad.body || ad.headline);
  } catch (err) {
    console.error(`Ad Library error for ${brandName}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function fetchAllCompetitorAds(
  competitors: string[],
  token: string
): Promise<CompetitorAd[]> {
  const results = await Promise.allSettled(
    competitors.map((name) => fetchAdLibraryByBrand(name, token))
  );
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
