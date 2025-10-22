import axios from "axios";
import * as cheerio from "cheerio";
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

class ScraperService {
  private readonly userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  /**
   * Fetch HTML content from a URL
   */
  async fetchHTML(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 10000, // 10 seconds timeout
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse HTML and extract product data
   */
  async scrapeProduct(url: string): Promise<ScrapedProductData> {
    const isValid = isValidUrl(url);
    if (!isValid) {
      throw new Error("Invalid URL provided for scraping");
    }
    const html = await this.fetchHTML(url);
    const $ = cheerio.load(html);

    const domainName = getDomain(url);

    // Determine the e-commerce platform and use appropriate selectors
    if (domainName?.includes("amazon")) {
      return this.scrapeAmazon($);
    } else if (domainName?.includes("flipkart")) {
      return this.scrapeFlipkart($);
    } else if (domainName?.includes("myntra")) {
      return this.scrapeMyntra($);
    } else {
      return this.scrapeGeneric($);
    }
  }

  /**
   * Scrape Amazon product page
   */
  private scrapeAmazon($: cheerio.CheerioAPI): ScrapedProductData {
    const name = $("#productTitle").text().trim();

    const priceWhole = $(".a-price-whole")
      .first()
      .text()
      .replace(/[^0-9]/g, "");
    const priceFraction = $(".a-price-fraction").first().text();
    const priceText = priceWhole + (priceFraction || "");
    const price = parseFloat(priceText) || undefined;

    const currency = $(".a-price-symbol").first().text().trim() || "USD";

    const availability = $("#availability span").text().trim() || "Unknown";

    const image = $("#landingImage").attr("src") || $(".a-dynamic-image").first().attr("src");

    const description = $("#feature-bullets").text().trim();

    return {
      name,
      price,
      currency,
      availability,
      image,
      description,
    };
  }

  /**
   * Scrape Flipkart product page
   */
  private scrapeFlipkart($: cheerio.CheerioAPI): ScrapedProductData {
    const name = $("span.VU-ZEz").text().trim() || $("h1.yhB1nd").text().trim();

    const priceText =
      $("div._30jeq3")
        .text()
        .replace(/[^0-9.]/g, "") ||
      $("div.Nx9bqj")
        .text()
        .replace(/[^0-9.]/g, "");
    const price = parseFloat(priceText) || undefined;

    const currency = "INR";

    const availability = $("div._16FRp0").text().trim() || "In Stock";

    const image = $("img._396cs4").first().attr("src") || $("img._2r_T1I").first().attr("src");

    const description = $("div._1mXcCf").text().trim();

    return {
      name,
      price,
      currency,
      availability,
      image,
      description,
    };
  }

  /**
   * Scrape Myntra product page
   */
  private scrapeMyntra($: cheerio.CheerioAPI): ScrapedProductData {
    let scrapedData: ScrapedProductData = {};
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const scriptContent = $(el).html();
        if (!scriptContent) return;
        // Parse the JSON content inside each <script> tag
        const jsonData = JSON.parse(scriptContent);

        if (jsonData["@type"] === "Product") {
          let name = jsonData["name"] || "";
          let image = Array.isArray(jsonData["image"]) ? jsonData["image"][0] : jsonData["image"] || "";
          let sku = jsonData["sku"] || "";
          let mpn = jsonData["mpn"] || "";
          let description = jsonData["description"] || "";
          let price = jsonData["offers"]?.["price"] ? parseFloat(jsonData["offers"]["price"]) : undefined;
          let currency = jsonData["offers"]?.["priceCurrency"] || "INR";
          let availability = jsonData["offers"]?.["availability"] || "Unknown";

          scrapedData = {
            name,
            image,
            sku,
            mpn,
            description,
            price,
            currency,
            availability,
          };

          return;
        }
      } catch (error) {
        console.error("Error parsing JSON-LD:", error);
      }
    });

    return scrapedData;
  }

  /**
   * Generic scraper for other websites
   */
  private scrapeGeneric($: cheerio.CheerioAPI): ScrapedProductData {
    // Try common selectors for title
    const name = $('h1[itemprop="name"]').text().trim() || $('meta[property="og:title"]').attr("content") || $("h1").first().text().trim();

    // Try common selectors for price
    const priceElement = $('[itemprop="price"]').attr("content") || $('[class*="price"]').first().text();
    const price = priceElement ? parseFloat(priceElement.replace(/[^0-9.]/g, "")) : undefined;

    // Try to get currency
    const currency = $('[itemprop="priceCurrency"]').attr("content") || "USD";

    // Try common selectors for image
    const image = $('meta[property="og:image"]').attr("content") || $('img[itemprop="image"]').attr("src") || $("img").first().attr("src");

    // Try common selectors for availability
    const availability = $('[itemprop="availability"]').text().trim() || "Unknown";

    const description = $('meta[name="description"]').attr("content") || $('[itemprop="description"]').text().trim();

    return {
      name,
      price,
      currency,
      availability,
      image,
      description,
    };
  }

  /**
   * Extract all text content from HTML
   */
  extractTextContent(html: string): string {
    const $ = cheerio.load(html);

    // Remove script and style elements
    $("script, style, noscript").remove();

    // Get text content
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
