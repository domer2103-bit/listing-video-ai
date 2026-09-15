import { ListingData } from "../types";
import { scrapeGeneric } from "./generic";
import { scrapeRightmove } from "./rightmove";
import { scrapeFoxtons } from "./foxtons";
import { scrapeOnTheMarket } from "./onthemarket";
import { scrapeSavills } from "./savills";
import { scrapePurplebricks } from "./purplebricks";

/**
 * Adapter registry: pick a site-specific scraper by hostname, otherwise
 * fall back to the generic OG-tag scraper. Add a new file in this folder
 * + one line here for each additional listing site you want first-class
 * support for.
 *
 * Sites confirmed blocked at the HTTP level (403, real anti-bot
 * protection, not fixable with request tweaks): Zoopla, PrimeLocation,
 * Zillow.
 * Knight Frank: re-investigated and confirmed still infeasible without a
 * headless browser — both search and listing pages are empty client-
 * rendered shells (no data, no SEO meta tags in the raw HTML). The real
 * data comes from a clean REST API (api-v2.web.prd-knightfrank.com) but
 * it 401s for a plain server-side fetch and only works from within an
 * already-loaded browser session — it's gated behind a bot-management
 * cookie (HMF_CI) that's only issued after real JS execution. Adding
 * headless-browser support (Playwright/Puppeteer) would also undo the
 * earlier move away from bundling Chromium in the production image — a
 * bigger infra decision, not just a new scraper file.
 * OnTheMarket previously fell in the "needs headless browser" bucket but
 * is now fully server-rendered (re-tested and confirmed working) — see
 * onthemarket.ts.
 * Savills listing pages actually live on search.savills.com, not
 * www.savills.co.uk (which redirects there) — see savills.ts.
 * Purplebricks is a Next.js App Router site — no __NEXT_DATA__ blob, but
 * the listing data is recoverable from the React Server Component
 * "flight" chunks embedded in the page — see purplebricks.ts.
 */
export async function scrapeListing(url: string): Promise<ListingData> {
  const hostname = new URL(url).hostname.replace(/^www\./, "");

  switch (hostname) {
    case "rightmove.co.uk":
      return scrapeRightmove(url);
    case "foxtons.co.uk":
      return scrapeFoxtons(url);
    case "onthemarket.com":
      return scrapeOnTheMarket(url);
    case "search.savills.com":
      return scrapeSavills(url);
    case "purplebricks.co.uk":
      return scrapePurplebricks(url);
    default:
      return scrapeGeneric(url);
  }
}
