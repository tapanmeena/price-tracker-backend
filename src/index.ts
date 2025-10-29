import express from "express";
import cors from "cors";
import os from "os";
import productRouter from "./routes/productRoutes";
import { connectPostgres } from "./config/postgresConfig";
import schedulerRouter from "./routes/schedulerRoutes";
import miscRouter from "./routes/miscRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins in development. In production, specify your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/products", productRouter);
app.use("/api/schedule", schedulerRouter);
app.use("/api/misc", miscRouter);

// Connect to PostgreSQL and start server
connectPostgres().then(() => {
  app.listen(PORT, () => {
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];

    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      if (networkInterface) {
        for (const iface of networkInterface) {
          if (iface.family === "IPv4" && !iface.internal) {
            addresses.push(iface.address);
          }
        }
      }
    }

    const ipAddress = addresses.length > 0 ? addresses[0] : "localhost";
    console.log(`Server is running on http://${ipAddress}:${PORT}`);
  });
});
