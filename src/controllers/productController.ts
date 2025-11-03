import { Request, Response } from "express";
import productService from "../services/productServicePostgres";

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
