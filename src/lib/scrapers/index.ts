import { ListingData } from "../types";
import { scrapeGeneric } from "./generic";
import { scrapeRightmove } from "./rightmove";

/**
 * Adapter registry: pick a site-specific scraper by hostname, otherwise
 * fall back to the generic OG-tag scraper. Add a new file in this folder
 * + one line here for each additional listing site you want first-class
 * support for (Zoopla, OnTheMarket, Zillow, ...).
 */
export async function scrapeListing(url: string): Promise<ListingData> {
  const hostname = new URL(url).hostname.replace(/^www\./, "");

  switch (hostname) {
    case "rightmove.co.uk":
      return scrapeRightmove(url);
    default:
      return scrapeGeneric(url);
  }
}
