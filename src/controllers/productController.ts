import { Request, Response } from "express";
import productService from "../services/productService";

export const createProduct = async (req: Request, res: Response) => {
  try {
    // At this point, req.body is validated by the middleware
    const { name, url, currentPrice, targetPrice } = req.body;

    // Create product using service
    const product = await productService.createProduct({
      name,
      url,
      currentPrice,
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
    const { url } = req.body;

    const product = await productService.createProductByUrl(url);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.log(`Error creating product by URL: ${error}`);
    res.status(500).json({
      success: false,
      message: "Failed to create product by URL",
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
