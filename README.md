# Price Tracker Backend

A backend service for tracking product prices across different e-commerce platforms.

## 🎉 Database: PostgreSQL with Prisma ORM

This backend uses **PostgreSQL** as the database with **Prisma** as the ORM for type-safe database access.

> **Note**: This project was migrated from MongoDB to PostgreSQL. See [MIGRATION.md](./MIGRATION.md) for details.

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

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

### Install Dependencies
```bash
npm install
```

### Setup Database

1. **Start PostgreSQL** (if not already running)
```bash
# Using Docker
docker run --name postgres-pricetracker \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pricetracker \
  -p 5432:5432 \
  -d postgres:15
```

2. **Configure Environment Variables**

Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pricetracker?schema=public"
PORT=3001
```

3. **Run Database Migrations**
```bash
npx prisma migrate dev
```

4. **Generate Prisma Client**
```bash
npx prisma generate
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Database Management

### View Database
```bash
npx prisma studio
```

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

## Migration from MongoDB

If you have existing data in MongoDB, run the migration script:

```bash
# Set MONGODB_URI in .env
MONGODB_URI="mongodb://localhost:27017/priceTracker"

# Run migration
npx ts-node scripts/migrate-data.ts
```

See [MIGRATION.md](./MIGRATION.md) for complete migration guide.

## Environment Variables

Create a `.env` file in the root directory:

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/pricetracker?schema=public"

# MongoDB (for migration only)
MONGODB_URI="mongodb://localhost:27017/priceTracker"

# Server Port
PORT=3001
```
