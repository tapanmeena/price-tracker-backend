import { z } from "zod";
import mongoose, { Schema } from "mongoose";

// Zod schema for product validation
export const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  url: z.url("Invalid product URL"),
  currentPrice: z.number().positive("Price must be positive"),
  targetPrice: z.number().positive("Target price must be positive").optional(),
});

// Infer TypeScript type from Zod schema
export type IProduct = z.infer<typeof ProductSchema>;

// Schema for updating product (all fields optional)
export const UpdateProductSchema = ProductSchema.partial();

// MongoDB Schema
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    targetPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster lookups
productSchema.index({ url: 1 });
productSchema.index({ name: 1 });

export const ProductModel = mongoose.model<IProduct>("Product", productSchema);
