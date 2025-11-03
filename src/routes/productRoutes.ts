import { Router } from "express";
import { createProductByUrl, getAllProducts, getProductById } from "../controllers/productController";

const productRouter = Router();

// GET /products - Get all products
productRouter.get("/", getAllProducts);
productRouter.get("/:id", getProductById);

// POST /products - Create a new product
productRouter.post("/url", createProductByUrl);

export default productRouter;
