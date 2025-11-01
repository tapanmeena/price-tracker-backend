import getPrismaClient from "../config/postgresConfig";
import scraperService from "./scraperService";
import { getDomain } from "../utils/scraperUtils";
import { Product, PriceHistory } from "@prisma/client";

type ProductWithPriceHistory = Product & { priceHistory: PriceHistory[] };

class ProductServicePostgres {
  private prisma = getPrismaClient();

  // Create a new product
  async createProduct(productData: {
    name: string;
    url: string;
    currentPrice: number;
    domain: string;
    brand?: string;
    image?: string;
    productId: string;
    articleType?: string;
    subCategory?: string;
    masterCategory?: string;
    currency?: string;
    availability?: string;
  }): Promise<ProductWithPriceHistory> {
    // Check if product with the same URL already exists
    const existingProduct = await this.findProductByUrl(productData.url);

    if (existingProduct) {
      return existingProduct;
    }

    // Create and save the product with initial price history
    const product = await this.prisma.product.create({
      data: {
        name: productData.name,
        url: productData.url,
        currentPrice: productData.currentPrice,
        domain: productData.domain,
        brand: productData.brand,
        image: productData.image,
        sku: productData.productId,
        mpn: productData.productId,
        currency: "INR",
        availability: "InStock",
        articleType: productData.articleType || "",
        subCategory: productData.subCategory || "",
        masterCategory: productData.masterCategory || "",
        priceHistory: {
          create: {
            price: productData.currentPrice,
            checkedAt: new Date(),
            availability: "InStock",
          },
        },
      },
      include: {
        priceHistory: true,
      },
    });

    return product;
  }

  // Create product by URL
  async createProductByUrl(url: string): Promise<ProductWithPriceHistory> {
    // Check if product with the same URL already exists
    const existingProduct = await this.findProductByUrl(url);

    if (existingProduct) {
      return existingProduct;
    }

    const scrapedData = await scraperService.scrapeProduct(url);
    const domain = getDomain(url) || "unknown.com";

    const product = await this.prisma.product.create({
      data: {
        name: scrapedData.name || "Unknown",
        image: scrapedData.image,
        url,
        domain,
        currency: scrapedData.currency || "INR",
        availability: scrapedData.availability || "InStock",
        sku: scrapedData.sku,
        mpn: scrapedData.mpn,
        currentPrice: scrapedData.price || 0,
        priceHistory: {
          create: {
            price: scrapedData.price || 0,
            checkedAt: new Date(),
            availability: scrapedData.availability || "InStock",
          },
        },
      },
      include: {
        priceHistory: true,
      },
    });

    return product;
  }

  // Find product by URL
  async findProductByUrl(url: string): Promise<ProductWithPriceHistory | null> {
    return await this.prisma.product.findUnique({
      where: { url },
      include: {
        priceHistory: true,
      },
    });
  }

  // Find product by ID
  async findProductById(id: string): Promise<ProductWithPriceHistory | null> {
    return await this.prisma.product.findUnique({
      where: { id },
      include: {
        priceHistory: true,
      },
    });
  }

  // Get all products
  async getAllProducts(): Promise<ProductWithPriceHistory[]> {
    return await this.prisma.product.findMany({
      include: {
        priceHistory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Update product
  async updateProduct(id: string, updateData: Partial<Product>): Promise<ProductWithPriceHistory | null> {
    return await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        priceHistory: true,
      },
    });
  }

  // Update product price
  async updateProductPrice(id: string, updatedPrice: number): Promise<ProductWithPriceHistory | null> {
    return await this.prisma.product.update({
      where: { id },
      data: {
        currentPrice: updatedPrice,
      },
      include: {
        priceHistory: true,
      },
    });
  }

  // Add price to history
  async addPriceToHistory(productId: string, price: number, availability?: string | null): Promise<PriceHistory> {
    return await this.prisma.priceHistory.create({
      data: {
        productId,
        price,
        checkedAt: new Date(),
        availability: availability ?? undefined,
      },
    });
  }

  // Update lastChecked for multiple products
  async updateLastChecked(productIds: string[]): Promise<void> {
    await this.prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        lastCheckedAt: new Date(),
      },
    });
  }

  // Delete product
  async deleteProduct(id: string): Promise<ProductWithPriceHistory | null> {
    return await this.prisma.product.delete({
      where: { id },
      include: {
        priceHistory: true,
      },
    });
  }
}

export default new ProductServicePostgres();
