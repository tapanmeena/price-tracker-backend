# Price Tracker Backend

A backend service for tracking product prices across different e-commerce platforms.

## Project Structure

```
src/
├── index.ts         # Application entry point
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middlewares/     # Custom middleware functions
├── models/          # Data models and schemas
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

## Directory Explanations

### 📁 `config/`
Contains configuration files for database connections, environment variables, and app settings.

**Example:**
```typescript
// config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'price_tracker'
};
```

### 📁 `controllers/`
Contains controller functions that handle incoming requests and return responses.

**Example:**
```typescript
// controllers/productController.ts
import { Request, Response } from 'express';

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  // Logic to fetch product
  res.json({ product: {} });
};
```

### 📁 `middlewares/`
Contains custom middleware functions for authentication, validation, error handling, etc.

**Example:**
```typescript
// middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  // Verify token logic
  next();
};
```

### 📁 `models/`
Contains data models, database schemas, and validation schemas.

**Example:**
```typescript
// models/Product.ts
export interface Product {
  id: string;
  name: string;
  currentPrice: number;
  url: string;
  lastChecked: Date;
}
```

### 📁 `routes/`
Contains API route definitions that map endpoints to controller functions.

**Example:**
```typescript
// routes/productRoutes.ts
import { Router } from 'express';
import { getProduct, createProduct } from '../controllers/productController';

const router = Router();

router.get('/products/:id', getProduct);
router.post('/products', createProduct);

export default router;
```

### 📁 `services/`
Contains business logic and service layer functions that interact with external APIs, databases, etc.

**Example:**
```typescript
// services/priceScraperService.ts
export class PriceScraperService {
  async scrapePrice(url: string): Promise<number> {
    // Logic to scrape price from URL
    return 99.99;
  }
}
```

### 📁 `types/`
Contains TypeScript type definitions and interfaces used across the application.

**Example:**
```typescript
// types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type PriceHistory = {
  productId: string;
  price: number;
  timestamp: Date;
}[];
```

### 📁 `utils/`
Contains utility/helper functions that can be used throughout the application.

**Example:**
```typescript
// utils/logger.ts
export const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`)
};
```

## Getting Started

### Install Dependencies
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

### Production
```bash
pnpm start
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=price_tracker
```
