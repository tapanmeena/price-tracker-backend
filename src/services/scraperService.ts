import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import scraperConfig, { getRandomUserAgent, getSiteConfig, ScraperSiteConfig } from "../config/scraperConfig";
import { getDomain, isValidUrl } from "../utils/scraperUtils";

interface ScrapedProductData {
  name?: string;
  price?: number;
  currency?: string;
  availability?: string;
  image?: string;
  description?: string;
  sku?: string;
  mpn?: string;
}

interface FetchOptions {
  retries?: number;
  retryDelay?: number;
}

class ScraperService {
  /**
   * Sleep utility for delays between requests
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch HTML content from a URL with retry logic and user-agent rotation
   */
  async fetchHTML(url: string, options: FetchOptions = {}): Promise<string> {
    const { retries = scraperConfig.maxRetries, retryDelay = scraperConfig.retryDelayMs } = options;

    let lastError: Error | null = null;
    let currentDelay = retryDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const userAgent = getRandomUserAgent();

        const response = await axios.get(url, {
          headers: {
            "User-Agent": userAgent,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
          },
          timeout: scraperConfig.timeout,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
        });

        return response.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === retries;

        if (!isRetryable || isLastAttempt) {
          break;
        }

        console.warn(`[Scraper] Attempt ${attempt}/${retries} failed for ${url}: ${lastError.message}. Retrying in ${currentDelay}ms...`);

        await this.sleep(currentDelay);
        currentDelay *= scraperConfig.retryBackoffMultiplier;
      }
    }

    if (axios.isAxiosError(lastError)) {
      throw new Error(`Failed to fetch URL after ${retries} attempts: ${lastError.message}`);
    }
    throw lastError || new Error("Unknown error occurred while fetching URL");
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Retry on network errors, timeouts, and 5xx errors
      if (!axiosError.response) return true; // Network error
      const status = axiosError.response.status;
      return status >= 500 || status === 429; // Server errors or rate limited
    }
    return false;
  }

  /**
   * Parse HTML and extract product data using site-specific config
   */
  async scrapeProduct(url: string): Promise<ScrapedProductData> {
    const isValid = isValidUrl(url);
    if (!isValid) {
      throw new Error("Invalid URL provided for scraping");
    }

    // Add delay between requests to avoid rate limiting
    await this.sleep(scraperConfig.requestDelayMs);

    const html = await this.fetchHTML(url);
    const $ = cheerio.load(html);
    const domainName = getDomain(url) || "";
    const siteConfig = getSiteConfig(domainName);

    // Use JSON-LD if configured for this site
    if (siteConfig.useJsonLd) {
      const jsonLdData = this.extractJsonLd($, siteConfig.jsonLdType);
      if (jsonLdData && Object.keys(jsonLdData).length > 0) {
        return jsonLdData;
      }
    }

    // Fall back to CSS selector scraping
    return this.scrapeWithSelectors($, siteConfig);
  }

  /**
   * Extract data from JSON-LD structured data
   */
  private extractJsonLd($: cheerio.CheerioAPI, targetType?: string): ScrapedProductData {
    let scrapedData: ScrapedProductData = {};

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const scriptContent = $(el).html();
        if (!scriptContent) return;

        const jsonData = JSON.parse(scriptContent);

        if (!targetType || jsonData["@type"] === targetType) {
          if (jsonData["@type"] === "Product") {
            scrapedData = {
              name: jsonData["name"] || "",
              image: Array.isArray(jsonData["image"]) ? jsonData["image"][0] : jsonData["image"] || "",
              sku: jsonData["sku"] || "",
              mpn: jsonData["mpn"] || "",
              description: jsonData["description"] || "",
              price: jsonData["offers"]?.["price"] ? parseFloat(jsonData["offers"]["price"]) : undefined,
              currency: jsonData["offers"]?.["priceCurrency"] || "INR",
              availability: jsonData["offers"]?.["availability"] || "Unknown",
            };
            return false; // Break the loop
          }
        }
      } catch (error) {
        console.error("[Scraper] Error parsing JSON-LD:", error);
      }
    });

    return scrapedData;
  }

  /**
   * Scrape using CSS selectors from site config
   */
  private scrapeWithSelectors($: cheerio.CheerioAPI, config: ScraperSiteConfig): ScrapedProductData {
    const { selectors } = config;

    const name = this.extractFirst($, selectors.name);
    const priceText = this.extractFirst($, selectors.price);
    const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : undefined;
    const currency = this.extractFirst($, selectors.currency) || (config.domain === "flipkart" ? "INR" : "USD");
    const availability = this.extractFirst($, selectors.availability) || "Unknown";
    const image = this.extractFirstAttr($, selectors.image, ["src", "content", "data-src"]);
    const description = this.extractFirst($, selectors.description);

    return {
      name: name || undefined,
      price: price && !isNaN(price) ? price : undefined,
      currency,
      availability,
      image: image || undefined,
      description: description || undefined,
    };
  }

  /**
   * Extract first matching text content from a list of selectors
   */
  private extractFirst($: cheerio.CheerioAPI, selectors: string[]): string | null {
    for (const selector of selectors) {
      // Handle meta tags specially
      if (selector.startsWith("meta[")) {
        const content = $(selector).attr("content");
        if (content?.trim()) return content.trim();
      } else {
        const text = $(selector).first().text().trim();
        if (text) return text;
      }
    }
    return null;
  }

  /**
   * Extract first matching attribute from a list of selectors
   */
  private extractFirstAttr($: cheerio.CheerioAPI, selectors: string[], attrs: string[]): string | null {
    for (const selector of selectors) {
      const el = $(selector).first();
      for (const attr of attrs) {
        const value = el.attr(attr);
        if (value?.trim()) return value.trim();
      }
    }
    return null;
  }

  /**
   * Scrape Amazon product page (legacy method for compatibility)
   */
  scrapeAmazon($: cheerio.CheerioAPI): ScrapedProductData {
    return this.scrapeWithSelectors($, getSiteConfig("amazon"));
  }

  /**
   * Scrape Flipkart product page (legacy method for compatibility)
   */
  scrapeFlipkart($: cheerio.CheerioAPI): ScrapedProductData {
    return this.scrapeWithSelectors($, getSiteConfig("flipkart"));
  }

  /**
   * Scrape Myntra product page (legacy method for compatibility)
   */
  scrapeMyntra($: cheerio.CheerioAPI): ScrapedProductData {
    return this.extractJsonLd($, "Product");
  }

  /**
   * Generic scraper (legacy method for compatibility)
   */
  scrapeGeneric($: cheerio.CheerioAPI): ScrapedProductData {
    return this.scrapeWithSelectors($, getSiteConfig("generic"));
  }

  /**
   * Extract all text content from HTML
   */
  extractTextContent(html: string): string {
    const $ = cheerio.load(html);
    $("script, style, noscript").remove();
    return $("body").text().replace(/\s+/g, " ").trim();
  }

  /**
   * Extract all links from HTML
   */
  extractLinks(html: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        links.push(href);
      }
    });

    return links;
  }

  /**
   * Extract all images from HTML
   */
  extractImages(html: string): string[] {
    const $ = cheerio.load(html);
    const images: string[] = [];

    $("img[src]").each((_, element) => {
      const src = $(element).attr("src");
      if (src) {
        images.push(src);
      }
    });

    return images;
  }
}

export default new ScraperService();
