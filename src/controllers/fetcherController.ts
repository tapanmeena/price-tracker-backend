import { Request, Response } from "express";
import fetcherService from "../services/fetcherService";
import productService from "../services/productServicePostgres";
import { getDomain } from "../utils/scraperUtils";

export const fetchProducts = async (req: Request, res: Response) => {
  const products = await fetcherService.fetchMyntraProducts("Tshirts");
  const totalCount = products.length > 0 ? (products[0].totalCount ?? 0) : 0;
  const domain = getDomain(products[0].productUrl) || "unknown.com";

  for (const product of products) {
    await productService.createProduct({
      name: product.productName,
      url: product.productUrl,
      currentPrice: product.price,
      domain,
      brand: product.brand,
      image: product.image,
      productId: product.productId,
      articleType: product.articleType,
      subCategory: product.subCategory,
      masterCategory: product.masterCategory,
    });
  }

  for (let i = 1; i <= Math.ceil(totalCount / 50); i++) {
    const moreProducts = await fetcherService.fetchWithPagination("Tshirts", i, 50);
    console.log(`Fetched page ${i} with ${moreProducts.length} products.`);
    products.push(...moreProducts);

    for (const product of moreProducts) {
      await productService.createProduct({
        name: product.productName,
        url: product.productUrl,
        currentPrice: product.price,
        domain,
        brand: product.brand,
        image: product.image,
        productId: product.productId,
        articleType: product.articleType,
        subCategory: product.subCategory,
        masterCategory: product.masterCategory,
      });
    }
  }

  console.log(`Fetched total ${products.length} products.`);
  res.status(200).json({
    success: true,
    message: "Product fetcher executed. Check server logs for details.",
  });
  return;
};
