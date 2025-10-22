import { ObjectId } from "mongoose";
import { ProductModel, IProduct } from "../models/Product";
import scraperService from "./scraperService";
import { getDomain } from "../utils/scraperUtils";

class ProductService {
  // Create a new product
  async createProduct(productData: { name: string; url: string; currentPrice: number; domain: string; targetPrice?: number }): Promise<IProduct> {
    // Check if product with the same URL already exists
    const existingProduct = await this.findProductByUrl(productData.url);

    if (existingProduct) {
      throw new Error("Product with this URL already exists");
    }

    const domain = getDomain(productData.url) || "unknown.com";

    // Create and save the product
    const product = new ProductModel({ ...productData, domain });
    return await product.save();
  }

  // Create product by URL
  async createProductByUrl(url: string): Promise<IProduct> {
    // Check if product with the same URL already exists
    const existingProduct = await this.findProductByUrl(url);

    if (existingProduct) {
      return existingProduct;
    }

    const scrapedData = await scraperService.scrapeProduct(url);

    const domain = getDomain(url) || "unknown.com";

    const productData: Partial<IProduct> = {
      name: scrapedData.name || "Unknown",
      image: scrapedData.image,
      url,
      domain,
      currency: scrapedData.currency || "INR",
      availability: scrapedData.availability || "InStock",
      sku: scrapedData.sku || undefined,
      mpn: scrapedData.mpn || undefined,
      // availability: (scrapedData.availability as "In Stock" | "Out of Stock" | "Limited Stock" | "Pre-Order") || "In Stock",
      currentPrice: scrapedData.price || 0,
      priceHistory: [
        {
          price: scrapedData.price || 0,
          date: new Date(),
        },
      ],
      createdAt: new Date(),
    };

    const product = new ProductModel({ doesMetadataUpdated: true, ...productData });
    return await product.save();
  }

  // Find product by URL
  async findProductByUrl(url: string): Promise<IProduct | null> {
    return await ProductModel.findOne({ url });
  }

  // Find product by ID
  async findProductById(id: string): Promise<IProduct | null> {
    return await ProductModel.findById(id);
  }

  // Get all products
  async getAllProducts(): Promise<IProduct[]> {
    return await ProductModel.find().sort({ createdAt: -1 });
  }

  // Update product
  async updateProduct(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    return await ProductModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // Update product price
  async updateProductPrice(id: string, updatedPrice: number): Promise<IProduct | null> {
    return await ProductModel.findByIdAndUpdate(
      id,
      {
        currentPrice: updatedPrice,
      },
      { new: true }
    );
  }

  async updateLastChecked(objectIds: ObjectId[]): Promise<void> {
    await ProductModel.updateMany({ _id: { $in: objectIds } }, { $set: { lastChecked: new Date() } });
  }

  // Delete product
  async deleteProduct(id: string): Promise<IProduct | null> {
    return await ProductModel.findByIdAndDelete(id);
  }
}

export default new ProductService();
