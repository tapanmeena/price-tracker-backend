import { schedule, ScheduledTask } from "node-cron";
import productService from "./productServicePostgres";
import scraperService from "./scraperService";
import { Product, PriceHistory } from "@prisma/client";

type ProductWithPriceHistory = Product & { priceHistory: PriceHistory[] };

class SchedulerServicePostgres {
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
      await this.checkAllProductPrices();
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
    const successfulProductIds: string[] = [];

    const productPromises = [];

    for (const product of products) {
      const promise = this.checkAndUpdateProductPrice(product)
        .then(() => {
          successCount++;
          successfulProductIds.push(product.id);
        })
        .catch((error) => {
          console.error(`Error checking price for product ID ${product.id}:`, error);
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

  async checkAndUpdateProductPrice(product: ProductWithPriceHistory) {
    // Scrape current price
    const scrapedData = await scraperService.scrapeProduct(product.url);
    const currentPrice = scrapedData.price;

    if (currentPrice === undefined) {
      console.debug(`Could not scrape price for product ID ${product.id}`);
      return;
    }

    // Compare with target price
    if (product.targetPrice !== undefined && product.targetPrice !== null && currentPrice <= product.targetPrice) {
      // Send notification (email, SMS, etc.)
      console.log(`Price drop alert for product ID ${product.id}: Current Price = ${currentPrice}, Target Price = ${product.targetPrice}`);
    }

    const priceChanged = product.currentPrice !== currentPrice;

    // Prepare update data
    const updateData: any = {};

    if (priceChanged) {
      updateData.currentPrice = currentPrice;
    }

    if (scrapedData.availability && scrapedData.availability !== product.availability) {
      updateData.availability = scrapedData.availability;
    }

    // Update metadata if missed before
    if (!product.doesMetadataUpdated) {
      updateData.name = scrapedData.name || product.name;
      updateData.image = scrapedData.image || product.image;
      updateData.currency = scrapedData.currency || product.currency;
      updateData.doesMetadataUpdated = true;
    }

    // Update product if there are changes
    if (Object.keys(updateData).length > 0) {
      await productService.updateProduct(product.id, updateData);
    }

    // Add to price history if price changed
    if (priceChanged) {
      await productService.addPriceToHistory(product.id, currentPrice);
    }
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

export default new SchedulerServicePostgres();
