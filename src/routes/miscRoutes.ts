import { NextFunction, Request, Response, Router } from "express";
import fetcherService from "../services/fetcherService";
import { fetchProducts } from "../controllers/fetcherController";

const miscRouter = Router();

miscRouter.get("/product-fetcher", fetchProducts);

export default miscRouter;
