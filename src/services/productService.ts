import { ProductModel, IProduct } from "../models/Product";

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

    const product = new ProductModel({ url, doesMetadataUpdated: false, name: "Unknown", currentPrice: 0 });
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
