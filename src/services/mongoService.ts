import mongoose from "mongoose";

class MongoDBService {
  private connection: typeof mongoose.connection;

  constructor() {
    this.connection = mongoose.connection;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Connection successful
    this.connection.on("connected", () => {
      console.log("📡 MongoDB connected");
    });

    // Connection disconnected
    this.connection.on("disconnected", () => {
      console.log("📡 MongoDB disconnected");
    });

    // Connection error
    this.connection.on("error", (error: Error) => {
      console.error("❌ MongoDB connection error:", error.message);
    });

    // Connection reconnected
    this.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

    // Application termination
    process.on("SIGINT", this.gracefulShutdown.bind(this));
    process.on("SIGTERM", this.gracefulShutdown.bind(this));
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      await this.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    } catch (error) {
      console.error("Error during MongoDB shutdown:", error);
      process.exit(1);
    }
  }

  public getConnection(): typeof mongoose.connection {
    return this.connection;
  }

  public isConnected(): boolean {
    return this.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    return states[this.connection.readyState] || "unknown";
  }
}

export default new MongoDBService();
