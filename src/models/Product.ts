import { z } from "zod";
import mongoose, { Schema, Document } from "mongoose";

// Zod schemas
const PriceHistorySchema = z.object({
  price: z.number().positive(),
  date: z.date().optional(),
});

// Zod schema for product validation
export const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  image: z.url("Invalid image URL").optional(),
  url: z.url("Invalid product URL"),
  currency: z.string().default("INR"),
  availability: z.enum(["In Stock", "Out of Stock", "Limited Stock", "Pre-Order"]).default("In Stock"),
  currentPrice: z.number().positive("Price must be positive"),
  targetPrice: z.number().positive("Target price must be positive").optional(),
  priceHistory: z.array(PriceHistorySchema).optional(),
});

// Infer TypeScript types from Zod schema
export type IPriceHistory = z.infer<typeof PriceHistorySchema>;
export type IProductInput = z.infer<typeof ProductSchema>;

// Schema for updating product (all fields optional)
export const UpdateProductSchema = ProductSchema.partial();

// MongoDB Document Interface
/**
 * Represents a product in the price tracker system.
 *
 * @interface IProduct
 * @extends Document
 *
 * @property {string} name - The name of the product.
 * @property {string} [image] - The URL of the product's image (optional).
 * @property {string} url - The URL where the product can be found.
 * @property {string} currency - The currency in which the product's price is listed.
 * @property {"In Stock" | "Out of Stock" | "Limited Stock" | "Pre-Order"} availability - The current availability status of the product.
 * @property {number} currentPrice - The current price of the product.
 * @property {number} [targetPrice] - The target price for the product (optional).
 * @property {IPriceHistory[]} [priceHistory] - An array of price history records for the product (optional).
 * @property {Date} createdAt - The date when the product was created.
 * @property {Date} updatedAt - The date when the product was last updated.
 * @property {boolean} [doesMetadataUpdated] - Indicates whether the product's metadata has been updated (optional).
 */
export interface IProduct extends Document {
  name: string;
  image?: string;
  url: string;
  domain: string;
  currency: string;
  availability: string; //"In Stock" | "Out of Stock" | "Limited Stock" | "Pre-Order";
  currentPrice: number;
  targetPrice?: number;
  priceHistory?: IPriceHistory[];
  createdAt: Date;
  updatedAt: Date;
  doesMetadataUpdated?: boolean;
  lastChecked?: Date;
  sku?: string;
  mpn?: string;
  brand?: string;
  articleType?: string;
  subCategory?: string;
  masterCategory?: string;
}

// MongoDB Schema
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    availability: {
      type: String,
      //   enum: ["In Stock", "Out of Stock", "Limited Stock", "Pre-Order"],
      trim: true,
      default: "InStock",
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    targetPrice: {
      type: Number,
    },
    priceHistory: [
      {
        price: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sku: {
      type: String,
    },
    mpn: {
      type: String,
    },
    brand: {
      type: String,
      trim: true,
    },
    articleType: {
      type: String,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    masterCategory: {
      type: String,
      trim: true,
    },
    doesMetadataUpdated: {
      type: Boolean,
      default: true,
    },
    lastChecked: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster lookups
productSchema.index({ name: 1 });
productSchema.index({ availability: 1 });
productSchema.index({ "priceHistory.date": -1 });

// Method to add price to history
productSchema.methods.addPriceToHistory = function (price: number) {
  this.priceHistory = this.priceHistory || [];
  this.priceHistory.push({ price, date: new Date() });
  return this.save();
};

export const ProductModel = mongoose.model<IProduct>("Product", productSchema);
