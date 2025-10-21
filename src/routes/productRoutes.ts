import { Router } from "express";
import { createProduct, createProductByUrl, getAllProducts } from "../controllers/productController";
import { validate } from "../middlewares/validation";
import { ProductSchema } from "../models/Product";

const productRouter = Router();

// GET /products - Get all products
productRouter.get("/products", getAllProducts);

// POST /products - Create a new product (with validation)
productRouter.post("/products/url", createProductByUrl);
productRouter.post("/products", validate({ body: ProductSchema }), createProduct);

export default productRouter;
