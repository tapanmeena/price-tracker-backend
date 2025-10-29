/**
 * Data Migration Script: MongoDB to PostgreSQL
 * 
 * This script migrates all product data from MongoDB to PostgreSQL.
 * It handles:
 * - Product records with all metadata
 * - Price history arrays (normalized into separate table)
 * - Referential integrity
 * - Duplicate detection
 * 
 * Usage: 
 *   1. Ensure both MongoDB and PostgreSQL are running
 *   2. Update .env with correct connection strings
 *   3. Run: npx ts-node scripts/migrate-data.ts
 */

import mongoose from "mongoose";
import { PrismaClient } from "@prisma/client";
import { ProductModel } from "../src/models/Product";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/priceTracker";
const prisma = new PrismaClient();

interface MigrationStats {
  totalProducts: number;
  migratedProducts: number;
  skippedProducts: number;
  totalPriceHistoryEntries: number;
  errors: string[];
}

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

async function connectPostgreSQL(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected successfully");
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error);
    throw error;
  }
}

async function migrateData(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalProducts: 0,
    migratedProducts: 0,
    skippedProducts: 0,
    totalPriceHistoryEntries: 0,
    errors: [],
  };

  try {
    // Fetch all products from MongoDB
    console.log("\n📊 Fetching products from MongoDB...");
    const mongoProducts = await ProductModel.find({}).lean();
    stats.totalProducts = mongoProducts.length;
    console.log(`Found ${stats.totalProducts} products in MongoDB`);

    if (stats.totalProducts === 0) {
      console.log("⚠️  No products found in MongoDB. Nothing to migrate.");
      return stats;
    }

    // Migrate each product
    console.log("\n🔄 Starting migration...\n");
    
    for (let i = 0; i < mongoProducts.length; i++) {
      const mongoProduct = mongoProducts[i];
      
      try {
        // Check if product already exists in PostgreSQL by URL
        const existingProduct = await prisma.product.findUnique({
          where: { url: mongoProduct.url },
        });

        if (existingProduct) {
          console.log(`⏭️  Skipping product ${i + 1}/${stats.totalProducts}: Already exists (${mongoProduct.name})`);
          stats.skippedProducts++;
          continue;
        }

        // Prepare price history data
        const priceHistoryData = (mongoProduct.priceHistory || []).map((history: any) => ({
          price: history.price,
          date: history.date || new Date(),
        }));

        stats.totalPriceHistoryEntries += priceHistoryData.length;

        // Create product in PostgreSQL with price history
        await prisma.product.create({
          data: {
            name: mongoProduct.name,
            image: mongoProduct.image || undefined,
            url: mongoProduct.url,
            domain: mongoProduct.domain,
            currency: mongoProduct.currency || "INR",
            availability: mongoProduct.availability || "InStock",
            currentPrice: mongoProduct.currentPrice,
            targetPrice: mongoProduct.targetPrice || undefined,
            sku: mongoProduct.sku || undefined,
            mpn: mongoProduct.mpn || undefined,
            brand: mongoProduct.brand || undefined,
            articleType: mongoProduct.articleType || undefined,
            subCategory: mongoProduct.subCategory || undefined,
            masterCategory: mongoProduct.masterCategory || undefined,
            doesMetadataUpdated: mongoProduct.doesMetadataUpdated ?? true,
            lastChecked: mongoProduct.lastChecked || undefined,
            createdAt: mongoProduct.createdAt || new Date(),
            updatedAt: mongoProduct.updatedAt || new Date(),
            priceHistory: {
              create: priceHistoryData,
            },
          },
        });

        stats.migratedProducts++;
        console.log(`✅ Migrated product ${i + 1}/${stats.totalProducts}: ${mongoProduct.name} (${priceHistoryData.length} price history entries)`);

      } catch (error) {
        const errorMsg = `Failed to migrate product: ${mongoProduct.name} - ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    return stats;

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

async function validateMigration(): Promise<void> {
  console.log("\n🔍 Validating migration...\n");

  const mongoCount = await ProductModel.countDocuments();
  const postgresCount = await prisma.product.count();

  console.log(`MongoDB products: ${mongoCount}`);
  console.log(`PostgreSQL products: ${postgresCount}`);

  if (mongoCount === postgresCount) {
    console.log("✅ Product counts match!");
  } else {
    console.log(`⚠️  Warning: Product counts don't match (MongoDB: ${mongoCount}, PostgreSQL: ${postgresCount})`);
  }

  // Sample validation: check a random product
  const sampleMongoProduct = await ProductModel.findOne({}).lean();
  if (sampleMongoProduct) {
    const samplePostgresProduct = await prisma.product.findUnique({
      where: { url: sampleMongoProduct.url },
      include: { priceHistory: true },
    });

    if (samplePostgresProduct) {
      console.log("\n✅ Sample product validation:");
      console.log(`  Name: ${sampleMongoProduct.name} === ${samplePostgresProduct.name}`);
      console.log(`  URL: ${sampleMongoProduct.url} === ${samplePostgresProduct.url}`);
      console.log(`  Current Price: ${sampleMongoProduct.currentPrice} === ${samplePostgresProduct.currentPrice}`);
      console.log(`  Price History: ${sampleMongoProduct.priceHistory?.length || 0} entries in MongoDB, ${samplePostgresProduct.priceHistory.length} in PostgreSQL`);
    } else {
      console.log("⚠️  Sample product not found in PostgreSQL");
    }
  }
}

async function main() {
  console.log("🚀 Starting MongoDB to PostgreSQL Migration\n");
  console.log("=" .repeat(60));

  try {
    // Connect to databases
    await connectMongoDB();
    await connectPostgreSQL();

    // Run migration
    const stats = await migrateData();

    // Print statistics
    console.log("\n" + "=".repeat(60));
    console.log("📈 Migration Statistics:");
    console.log("=".repeat(60));
    console.log(`Total products in MongoDB: ${stats.totalProducts}`);
    console.log(`Successfully migrated: ${stats.migratedProducts}`);
    console.log(`Skipped (already exists): ${stats.skippedProducts}`);
    console.log(`Total price history entries: ${stats.totalPriceHistoryEntries}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Validate migration
    if (stats.migratedProducts > 0) {
      await validateMigration();
    }

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    // Cleanup connections
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log("\n🔌 Database connections closed");
  }
}

// Run migration
main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
