import { Router } from "express";
import { createProductByUrl, getAllProducts, getProductById, searchProducts } from "../controllers/productController";

const productRouter = Router();

// GET /products - Get all products (with pagination)
productRouter.get("/", getAllProducts);

// GET /products/search - Search products with filters
productRouter.get("/search", searchProducts);

// GET /products/:id - Get product by ID
productRouter.get("/:id", getProductById);

// POST /products/url - Create a new product by URL
productRouter.post("/url", createProductByUrl);

export default productRouter;
