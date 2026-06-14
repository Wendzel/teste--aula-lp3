import axios from "axios";
import * as cheerio from "cheerio";
import type { Brandbook } from "./store";

function extractColors(html: string): string[] {
  const colors = new Set<string>();
  const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  const rgbRegex = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;

  let match;
  while ((match = hexRegex.exec(html)) !== null) {
    colors.add(match[0].toUpperCase());
  }
  while ((match = rgbRegex.exec(html)) !== null) {
    colors.add(match[0]);
  }

  const filtered = [...colors].filter((c) => {
    if (c.startsWith("#")) {
      const hex = c.slice(1).toLowerCase();
      if (hex === "ffffff" || hex === "000000" || hex === "fff" || hex === "000")
        return false;
    }
    return true;
  });

  return filtered.slice(0, 6);
}

function extractFonts(html: string): string[] {
  const fonts = new Set<string>();
  const fontRegex = /font-family\s*:\s*([^;}"']+)/gi;
  let match;
  while ((match = fontRegex.exec(html)) !== null) {
    const font = match[1].split(",")[0].trim().replace(/['"]/g, "");
    if (font && font.toLowerCase() !== "inherit" && font.toLowerCase() !== "initial") {
      fonts.add(font);
    }
  }
  return [...fonts].slice(0, 3);
}

export async function scrapeWebsite(url: string): Promise<Brandbook> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  const response = await axios.get(normalizedUrl, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
    maxRedirects: 5,
  });

  const html: string = response.data;
  const $ = cheerio.load(html);

  const title =
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "";

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    $("h1").first().text().trim() ||
    "";

  const logoUrl =
    $('meta[property="og:image"]').attr("content") ||
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    "";

  const absoluteLogo =
    logoUrl && !logoUrl.startsWith("http")
      ? new URL(logoUrl, normalizedUrl).href
      : logoUrl;

  const colors = extractColors(html);
  const fonts = extractFonts(html);

  return {
    title,
    description,
    logoUrl: absoluteLogo,
    colors: colors.length > 0 ? colors : ["#4F46E5", "#7C3AED"],
    fonts: fonts.length > 0 ? fonts : ["Sans-serif"],
  };
}
