import { Router } from "express";
import { createProduct, createProductByUrl, getAllProducts } from "../controllers/productController";
import { validate } from "../middlewares/validation";
import { ProductSchema } from "../models/Product";

const productRouter = Router();

// GET /products - Get all products
productRouter.get("/", getAllProducts);

// POST /products - Create a new product (with validation)
productRouter.post("/url", createProductByUrl);
productRouter.post("/", validate({ body: ProductSchema }), createProduct);

export default productRouter;
