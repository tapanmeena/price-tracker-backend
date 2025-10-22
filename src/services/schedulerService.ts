import { schedule, ScheduledTask } from "node-cron";
import productService from "./productService";
import scraperService from "./scraperService";
import { IProduct, ProductModel } from "../models/Product";
import mongoose, { ObjectId } from "mongoose";

class SchedulerService {
  private priceCheckJob: ScheduledTask | null = null;

  /**
   * Start the price checker job
   * @param cronExpression - Cron expression for scheduling
   * @returns void
   */
  startPriceChecker(cronExpression: string = "0 */6 * * *") {
    if (this.priceCheckJob) {
      console.log("Price checker job is already running.");
      return;
    }

    console.log("Starting price checker job...");

    this.priceCheckJob = schedule(cronExpression, async () => {
      console.log("Running scheduled price check...");

      // call checkall product prices function
    });

    console.log(`Price checker job scheduled with expression: ${cronExpression}`);
  }

  /**
   * Stop the price checker job
   */
  stopPriceChecker() {
    if (this.priceCheckJob) {
      this.priceCheckJob.stop();
      this.priceCheckJob = null;
      console.log("Price checker job stopped.");
    } else {
      console.log("No price checker job is running.");
    }
  }

  private async checkAllProductPrices() {
    // Fetch all products from DB
    const products = await productService.getAllProducts();
    console.log(`Checking prices for ${products.length} products...`);

    let successCount = 0,
      failureCount = 0;
    const successfulProductIds: ObjectId[] = [];

    const productPromises = [];

    for (const product of products) {
      const promise = this.checkAndUpdateProductPrice(product)
        .then(() => {
          successCount++;
          successfulProductIds.push(product._id as ObjectId);
        })
        .catch((error) => {
          console.error(`Error checking price for product ID ${product._id}:`, error);
          failureCount++;
        });
      productPromises.push(promise);
    }

    await Promise.all(productPromises);

    // Mass update lastChecked for all successful products
    if (successfulProductIds.length > 0) {
      await productService.updateLastChecked(successfulProductIds);
      console.log(`Updated lastChecked for ${successfulProductIds.length} products.`);
    }

    console.log(`Price check completed. Success: ${successCount}, Failures: ${failureCount}`);
  }

  async checkAndUpdateProductPrice(product: IProduct) {
    // Scrape current price
    const scrapedData = await scraperService.scrapeProduct(product.url);
    const currentPrice = scrapedData.price;

    if (currentPrice === undefined) {
      console.debug(`Could not scrape price for product ID ${product._id}`);
      return;
    }

    // Compare with target price
    if (product.targetPrice !== undefined && currentPrice <= product.targetPrice) {
      // Send notification (email, SMS, etc.)
      console.log(`Price drop alert for product ID ${product._id}: Current Price = ${currentPrice}, Target Price = ${product.targetPrice}`);
    }

    const priceChanged = product.currentPrice !== currentPrice;

    if (priceChanged) {
      // Update Current price
      product.currentPrice = currentPrice;

      // Add to price history
      product.priceHistory?.push({
        price: currentPrice,
        date: new Date(),
      });
    }

    if (scrapedData.availability && scrapedData.availability !== product.availability) {
      product.availability = scrapedData.availability;
    }

    // update metadata if missed before
    if (!product.doesMetadataUpdated) {
      (product.name = scrapedData.name || product.name),
        (product.image = scrapedData.image || product.image),
        (product.currency = scrapedData.currency || product.currency),
        (product.doesMetadataUpdated = true);
    }

    // Save updates to DB
    await product.save();
  }

  async triggerManualPriceCheck() {
    try {
      await this.checkAllProductPrices();
      console.log("Manual price check completed successfully.");
    } catch (error) {
      console.error("Error during manual price check:", error);
      throw error;
    }
  }

  isRunning(): boolean {
    return this.priceCheckJob !== null;
  }
}

export default new SchedulerService();
