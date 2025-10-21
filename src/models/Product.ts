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
export interface IProduct extends Document {
  name: string;
  image?: string;
  url: string;
  currency: string;
  availability: "In Stock" | "Out of Stock" | "Limited Stock" | "Pre-Order";
  currentPrice: number;
  targetPrice?: number;
  priceHistory?: IPriceHistory[];
  createdAt: Date;
  updatedAt: Date;
  doesMetadataUpdated?: boolean;
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
    currency: {
      type: String,
      default: "INR",
    },
    availability: {
      type: String,
      enum: ["In Stock", "Out of Stock", "Limited Stock", "Pre-Order"],
      default: "In Stock",
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
    doesMetadataUpdated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster lookups
productSchema.index({ url: 1 });
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
