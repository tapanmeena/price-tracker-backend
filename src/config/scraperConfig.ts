/**
 * Externalized scraper configuration
 * CSS selectors and settings can be updated without code changes
 */

export interface SiteSelectors {
  name: string[];
  price: string[];
  currency: string[];
  availability: string[];
  image: string[];
  description: string[];
}

export interface ScraperSiteConfig {
  domain: string;
  selectors: SiteSelectors;
  useJsonLd?: boolean;
  jsonLdType?: string;
}

export interface ScraperConfig {
  // Request settings
  timeout: number;
  maxRetries: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;

  // User agents for rotation
  userAgents: string[];

  // Request delay to avoid rate limiting (milliseconds)
  requestDelayMs: number;

  // Site-specific configurations
  sites: Record<string, ScraperSiteConfig>;
}

export const scraperConfig: ScraperConfig = {
  timeout: 15000,
  maxRetries: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  requestDelayMs: 500,

  userAgents: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
  ],

  sites: {
    amazon: {
      domain: "amazon",
      selectors: {
        name: ["#productTitle", ".product-title-word-break"],
        price: [".a-price-whole", "#priceblock_ourprice", "#priceblock_dealprice", ".a-offscreen"],
        currency: [".a-price-symbol"],
        availability: ["#availability span", "#availability"],
        image: ["#landingImage", ".a-dynamic-image", "#imgBlkFront"],
        description: ["#feature-bullets", "#productDescription"],
      },
    },
    flipkart: {
      domain: "flipkart",
      selectors: {
        name: ["span.VU-ZEz", "h1.yhB1nd", "span.B_NuCI"],
        price: ["div._30jeq3", "div.Nx9bqj", "div._16Jk6d"],
        currency: [],
        availability: ["div._16FRp0", "div._1dVbu9"],
        image: ["img._396cs4", "img._2r_T1I", "img._3exPp9"],
        description: ["div._1mXcCf", "div.RmoJUa"],
      },
    },
    myntra: {
      domain: "myntra",
      useJsonLd: true,
      jsonLdType: "Product",
      selectors: {
        name: [".pdp-title", ".pdp-name"],
        price: [".pdp-price strong", ".pdp-mrp strong"],
        currency: [],
        availability: [".size-buttons-size-button"],
        image: [".image-grid-image"],
        description: [".pdp-product-description-content"],
      },
    },
    generic: {
      domain: "generic",
      selectors: {
        name: ['h1[itemprop="name"]', 'meta[property="og:title"]', ".product-title", ".product-name", "h1"],
        price: ['[itemprop="price"]', '[class*="price"]', ".product-price", ".current-price"],
        currency: ['[itemprop="priceCurrency"]'],
        availability: ['[itemprop="availability"]', ".availability", ".stock-status"],
        image: ['meta[property="og:image"]', 'img[itemprop="image"]', ".product-image img"],
        description: ['meta[name="description"]', '[itemprop="description"]', ".product-description"],
      },
    },
  },
};

/**
 * Get a random user agent from the rotation list
 */
export function getRandomUserAgent(): string {
  const { userAgents } = scraperConfig;
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Get site-specific configuration
 */
export function getSiteConfig(domain: string): ScraperSiteConfig {
  const sites = scraperConfig.sites;

  for (const key of Object.keys(sites)) {
    if (domain.toLowerCase().includes(key)) {
      return sites[key];
    }
  }

  return sites.generic;
}

export default scraperConfig;
