import { ProductModel, IProduct } from "../models/Product";
import scraperService from "./scraperService";

class ProductService {
  // Create a new product
  async createProduct(productData: { name: string; url: string; currentPrice: number; targetPrice?: number }): Promise<IProduct> {
    // Check if product with the same URL already exists
    const existingProduct = await this.findProductByUrl(productData.url);

    if (existingProduct) {
      throw new Error("Product with this URL already exists");
    }

    // Create and save the product
    const product = new ProductModel(productData);
    return await product.save();
  }

  // Create product by URL
  async createProductByUrl(url: string): Promise<IProduct> {
    // Check if product with the same URL already exists
    const existingProduct = await this.findProductByUrl(url);

    if (existingProduct) {
      throw new Error("Product with this URL already exists");
    }

    const scrapedData = await scraperService.scrapeProduct(url);

    const productData: Partial<IProduct> = {
      name: scrapedData.name || "Unknown",
      image: scrapedData.image,
      url,
      currency: scrapedData.currency || "INR",
      availability: scrapedData.availability || "InStock",
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

  // Delete product
  async deleteProduct(id: string): Promise<IProduct | null> {
    return await ProductModel.findByIdAndDelete(id);
  }
}

export default new ProductService();
