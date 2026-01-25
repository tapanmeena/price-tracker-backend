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
    // Extract pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    const result = await productService.getAllProducts({
      page,
      limit,
      sortBy: sortBy as "createdAt" | "currentPrice" | "name" | "lastCheckedAt",
      sortOrder,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q: query, brand, domain, minPrice, maxPrice, category, page, limit, sortBy, sortOrder } = req.query;

    const result = await productService.searchProducts({
      query: query as string,
      brand: brand as string,
      domain: domain as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      category: category as string,
      page: parseInt(page as string) || 1,
      limit: Math.min(parseInt(limit as string) || 50, 100),
      sortBy: (sortBy as "createdAt" | "currentPrice" | "name" | "lastCheckedAt") || "createdAt",
      sortOrder: (sortOrder as string) === "asc" ? "asc" : "desc",
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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
