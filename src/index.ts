import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import os from "os";
import { connectPostgres } from "./config/postgresConfig";
import { errorLogger, requestLogger } from "./middlewares/logging";
import authRouter from "./routes/authRoutes";
import miscRouter from "./routes/miscRoutes";
import productRouter from "./routes/productRoutes";
import schedulerRouter from "./routes/schedulerRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// Request logging (add before other middleware)
app.use(requestLogger());

// CORS configuration - use environment-specific origins
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean)
    : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.) in development
      if (!origin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Ensure JSON responses can serialize BigInt values (e.g., BIGSERIAL ids)
// Express will pass this replacer into JSON.stringify under the hood
app.set("json replacer", (_key: string, value: any) => {
  return typeof value === "bigint" ? value.toString() : value;
});

// Routes
app.use("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/products", productRouter);
app.use("/api/schedule", schedulerRouter);
app.use("/api/misc", miscRouter);
app.use("/api/auth", authRouter);

// Error logging (add after routes)
app.use(errorLogger());

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
