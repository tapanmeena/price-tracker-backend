import { Request, Response } from "express";
import productService from "../services/productServicePostgres";
import { getDomain } from "../utils/scraperUtils";

export const createProduct = async (req: Request, res: Response) => {
  try {
    // At this point, req.body is validated by the middleware
    const { name, url, currentPrice, targetPrice, image, productId } = req.body;

    const domain = getDomain(url) || "unknown.com";

    // Create product using service
    const product = await productService.createProduct({
      name,
      domain,
      url,
      currentPrice,
      image,
      productId,
      targetPrice,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    // Handle duplicate product error
    if (error instanceof Error && error.message === "Product with this URL already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    // Handle other errors
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

export const createProductByUrl = async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;
    const products = await Promise.all(urls.map((url: string) => productService.createProductByUrl(url)));

    res.status(201).json({
      success: true,
      message: "Products created successfully",
      data: products,
    });
  } catch (error) {
    console.log(`Error creating product by URL: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to create product by URL",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await productService.getAllProducts();

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.findProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(`Error fetching product ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};
