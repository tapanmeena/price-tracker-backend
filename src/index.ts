import express from "express";
import os from "os";
import productRouter from "./routes/productRoutes";
import { connectDB } from "./config/dbConfig";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/api", productRouter);

// Connect to MongoDB and start server
connectDB().then(() => {
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
