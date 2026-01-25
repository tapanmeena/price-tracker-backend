import { PriceHistory, Product } from "@prisma/client";
import getPrismaClient from "../config/postgresConfig";
import { getDomain } from "../utils/scraperUtils";
import scraperService from "./scraperService";

type ProductWithPriceHistory = Product & { priceHistory: PriceHistory[] };

interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: "createdAt" | "currentPrice" | "name" | "lastCheckedAt";
  sortOrder?: "asc" | "desc";
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

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

  // Get all products (with pagination - recommended for large datasets)
  async getAllProducts(options: PaginationOptions = {}): Promise<PaginatedResult<ProductWithPriceHistory>> {
    const { page = 1, limit = 50, sortBy = "createdAt", sortOrder = "desc" } = options;

    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const total = await this.prisma.product.count();

    const products = await this.prisma.product.findMany({
      include: {
        priceHistory: {
          orderBy: { checkedAt: "desc" },
          take: 10, // Limit price history to last 10 entries per product
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextCursor: products.length > 0 ? products[products.length - 1].id : undefined,
      },
    };
  }

  // Get all products without pagination (legacy method - use with caution for large datasets)
  async getAllProductsUnpaginated(): Promise<ProductWithPriceHistory[]> {
    return await this.prisma.product.findMany({
      include: {
        priceHistory: {
          orderBy: { checkedAt: "desc" },
          take: 10, // Still limit price history for performance
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Search products with filters
  async searchProducts(
    options: {
      query?: string;
      brand?: string;
      domain?: string;
      minPrice?: number;
      maxPrice?: number;
      category?: string;
    } & PaginationOptions,
  ): Promise<PaginatedResult<ProductWithPriceHistory>> {
    const { query, brand, domain, minPrice, maxPrice, category, page = 1, limit = 50, sortBy = "createdAt", sortOrder = "desc" } = options;

    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [{ name: { contains: query, mode: "insensitive" } }, { brand: { contains: query, mode: "insensitive" } }];
    }

    if (brand) {
      where.brand = { contains: brand, mode: "insensitive" };
    }

    if (domain) {
      where.domain = { contains: domain, mode: "insensitive" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.currentPrice = {};
      if (minPrice !== undefined) (where.currentPrice as Record<string, number>).gte = minPrice;
      if (maxPrice !== undefined) (where.currentPrice as Record<string, number>).lte = maxPrice;
    }

    if (category) {
      where.OR = [
        ...((where.OR as unknown[]) || []),
        { articleType: { contains: category, mode: "insensitive" } },
        { subCategory: { contains: category, mode: "insensitive" } },
        { masterCategory: { contains: category, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await this.prisma.product.count({ where });

    const products = await this.prisma.product.findMany({
      where,
      include: {
        priceHistory: {
          orderBy: { checkedAt: "desc" },
          take: 5,
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
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
