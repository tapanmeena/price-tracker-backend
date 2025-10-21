import mongoose from "mongoose";
import mongoService from "../services/mongoService";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/priceTracker";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Connection state: ${mongoService.getConnectionState()}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default mongoose;
