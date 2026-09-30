import { PageScraper } from "./types";

export class SimpleSafePageScraper implements PageScraper {
  async fetchText(url: string): Promise<string | null> {
    try {
      const parsedUrl = new URL(url);
      
      // Safety check: only allow http / https
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return null;
      }

      // Check robots.txt best-effort
      try {
        const robotsUrl = `${parsedUrl.origin}/robots.txt`;
        const robotsRes = await fetch(robotsUrl, {
          signal: AbortSignal.timeout(3000),
          headers: { "User-Agent": "ConnectCareerBot/1.0 (+https://connect.dev)" },
        });
        if (robotsRes.ok) {
          const robotsTxt = await robotsRes.text();
          if (robotsTxt.includes("Disallow: /")) {
            console.warn(`Robots.txt disallows crawling on ${parsedUrl.origin}`);
            return null;
          }
        }
      } catch {
        // If robots.txt check fails or times out, proceed conservatively
      }

      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: {
          "User-Agent": "ConnectCareerBot/1.0 (+https://connect.dev)",
          Accept: "text/html,text/plain",
        },
      });

      if (!res.ok) return null;

      const html = await res.text();
      // Basic extraction: strip tags, style, scripts
      const cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return cleaned.slice(0, 10000); // Max 10k chars
    } catch (error) {
      console.warn("Safe scraper failed, fallback will be used:", (error as Error).message);
      return null;
    }
  }
}

export const pageScraper: PageScraper = new SimpleSafePageScraper();
