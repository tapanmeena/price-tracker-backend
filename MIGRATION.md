# MongoDB to PostgreSQL Migration Guide

## Overview

This document describes the complete migration of the Price Tracker backend from MongoDB (NoSQL) to PostgreSQL (SQL) with Prisma ORM.

## Architecture Changes

### Before (MongoDB + Mongoose)
- **Database**: MongoDB (Document-based NoSQL)
- **ORM**: Mongoose
- **Data Model**: Embedded documents (price history as array in product document)
- **Schema**: Dynamic, flexible schema

### After (PostgreSQL + Prisma)
- **Database**: PostgreSQL (Relational SQL)
- **ORM**: Prisma
- **Data Model**: Normalized relational tables with foreign keys
- **Schema**: Strict, type-safe schema with migrations

## Schema Design

### Normalization Strategy

The MongoDB collection with embedded price history has been normalized into two relational tables:

#### Product Table
```sql
CREATE TABLE "Product" (
  id                  VARCHAR PRIMARY KEY DEFAULT uuid(),
  name                VARCHAR NOT NULL,
  image               VARCHAR,
  url                 VARCHAR UNIQUE NOT NULL,
  domain              VARCHAR NOT NULL,
  currency            VARCHAR DEFAULT 'INR',
  availability        VARCHAR DEFAULT 'InStock',
  currentPrice        FLOAT NOT NULL,
  targetPrice         FLOAT,
  sku                 VARCHAR,
  mpn                 VARCHAR,
  brand               VARCHAR,
  articleType         VARCHAR,
  subCategory         VARCHAR,
  masterCategory      VARCHAR,
  doesMetadataUpdated BOOLEAN DEFAULT true,
  lastChecked         TIMESTAMP,
  createdAt           TIMESTAMP DEFAULT now(),
  updatedAt           TIMESTAMP
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `url`
- Index on `name` for faster searches
- Index on `availability` for filtering
- Index on `createdAt` for sorting

#### PriceHistory Table
```sql
CREATE TABLE "PriceHistory" (
  id        VARCHAR PRIMARY KEY DEFAULT uuid(),
  price     FLOAT NOT NULL,
  date      TIMESTAMP DEFAULT now(),
  productId VARCHAR NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE
);
```

**Indexes:**
- Primary key on `id`
- Foreign key index on `productId`
- Descending index on `date` for recent prices

**Relationship:** One-to-Many (Product → PriceHistory)

### Benefits of Normalization

1. **Data Integrity**: Foreign key constraints ensure referential integrity
2. **Query Performance**: Separate table allows efficient queries on price history alone
3. **Storage Efficiency**: No data duplication
4. **Scalability**: Easier to add new relationships and tables
5. **ACID Compliance**: PostgreSQL provides strong consistency guarantees

## File Structure

### New Files Created

```
prisma/
├── schema.prisma              # Prisma schema definition
└── migrations/                # Database migration files

scripts/
└── migrate-data.ts           # Data migration script from MongoDB to PostgreSQL

src/
├── config/
│   └── postgresConfig.ts     # PostgreSQL connection configuration
├── services/
│   ├── productServicePostgres.ts      # Refactored product service
│   └── schedulerServicePostgres.ts    # Refactored scheduler service
```

### Modified Files

- `src/index.ts` - Updated to use PostgreSQL connection
- `src/controllers/productController.ts` - Updated to use new service
- `src/controllers/fetcherController.ts` - Updated to use new service
- `src/routes/schedulerRoutes.ts` - Updated to use new scheduler service
- `package.json` - Added Prisma dependencies
- `.env` - Added DATABASE_URL for PostgreSQL

### Preserved Files (MongoDB)

For reference and backward compatibility during transition:
- `src/models/Product.ts` - Original Mongoose model
- `src/config/dbConfig.ts` - MongoDB configuration
- `src/services/productService.ts` - Original MongoDB service
- `src/services/schedulerService.ts` - Original MongoDB scheduler
- `src/services/mongoService.ts` - MongoDB connection service

## Migration Process

### Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Update `.env` file:
   ```env
   # PostgreSQL connection
   DATABASE_URL="postgresql://username:password@localhost:5432/pricetracker?schema=public"
   
   # MongoDB connection (for migration)
   MONGODB_URI="mongodb://localhost:27017/priceTracker"
   
   # Server configuration
   PORT=3001
   ```

3. **Start PostgreSQL**
   ```bash
   # Using Docker
   docker run --name postgres-pricetracker \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=pricetracker \
     -p 5432:5432 \
     -d postgres:15
   
   # Or use your existing PostgreSQL instance
   ```

### Step-by-Step Migration

#### 1. Generate Prisma Client
```bash
npx prisma generate
```

#### 2. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This creates the tables in PostgreSQL based on the schema.

#### 3. Migrate Data from MongoDB to PostgreSQL

**Option A: Using the migration script**
```bash
npx ts-node scripts/migrate-data.ts
```

The script will:
- Connect to both MongoDB and PostgreSQL
- Fetch all products from MongoDB
- Transform and insert into PostgreSQL
- Handle price history normalization
- Validate the migration
- Report statistics

**Option B: Manual migration**
```bash
# Export from MongoDB
mongoexport --db=priceTracker --collection=products --out=products.json

# Process and import (using custom script)
npx ts-node scripts/migrate-data.ts
```

#### 4. Verify Migration
```bash
# Check PostgreSQL tables
npx prisma studio

# Compare counts
# MongoDB: use priceTracker; db.products.count()
# PostgreSQL: SELECT COUNT(*) FROM "Product";
```

#### 5. Switch Application to PostgreSQL

The application is already configured to use PostgreSQL. Simply start the server:

```bash
npm run dev
```

#### 6. Test API Endpoints

```bash
# Get all products
curl http://localhost:3001/api/products

# Get product by ID
curl http://localhost:3001/api/products/{id}

# Create product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "url": "https://example.com/product",
    "currentPrice": 999,
    "productId": "test123"
  }'
```

## API Compatibility

### No Breaking Changes

The API endpoints remain unchanged:
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `POST /api/products/url` - Create product by URL
- `POST /api/schedule/start` - Start price checker
- `POST /api/schedule/stop` - Stop price checker
- `GET /api/schedule/status` - Get scheduler status
- `GET /api/schedule/check-now` - Trigger manual price check

### Response Format

Responses maintain the same structure with `priceHistory` as an array:

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Product Name",
    "url": "https://example.com/product",
    "currentPrice": 999,
    "priceHistory": [
      {
        "id": "uuid-here",
        "price": 999,
        "date": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

## Data Integrity & Edge Cases

### Handled Edge Cases

1. **Null/Undefined Values**
   - Optional fields use `?` in Prisma schema
   - Defaults applied for required fields (currency, availability)

2. **Duplicate URLs**
   - Unique constraint on `url` field
   - Migration script skips duplicates
   - API returns existing product if URL exists

3. **Missing References**
   - Cascade delete ensures orphaned price history is removed
   - Foreign key constraints prevent invalid references

4. **Non-Uniform Documents**
   - Migration script handles missing fields gracefully
   - Uses default values where appropriate
   - Logs errors for manual review

5. **Large Price History Arrays**
   - Batch insert optimization in migration script
   - Indexed queries for performance

## Performance Considerations

### Query Optimization

1. **Indexes**: Strategic indexes on frequently queried fields
2. **Include**: Prisma's `include` for efficient eager loading
3. **Connection Pooling**: Prisma handles connection pooling automatically

### Migration Performance

For large datasets (>10,000 products):
- Use batch processing (100-1000 records at a time)
- Consider parallel workers
- Monitor memory usage

## Testing Strategy

### Unit Tests

Test service methods with mocked Prisma client:

```typescript
// Example test structure
describe('ProductServicePostgres', () => {
  it('should create product with price history', async () => {
    // Test implementation
  });
  
  it('should handle duplicate URLs', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test API endpoints against test database:

```typescript
// Example test structure
describe('Product API', () => {
  it('GET /api/products should return all products', async () => {
    // Test implementation
  });
});
```

### Comparison Tests

Verify MongoDB and PostgreSQL return same results:

```typescript
// Compare responses from both implementations
const mongoResult = await mongoService.getAllProducts();
const postgresResult = await postgresService.getAllProducts();
expect(normalize(mongoResult)).toEqual(normalize(postgresResult));
```

## Rollback Strategy

If issues arise, rollback is straightforward:

1. **Keep MongoDB Running**: Don't delete MongoDB data until PostgreSQL is stable
2. **Switch Back**: 
   - Update imports in controllers to use old services
   - Change `src/index.ts` to use MongoDB connection
   - Restart server

3. **Code Changes Required**:
   ```typescript
   // In productController.ts
   import productService from "../services/productService"; // Instead of productServicePostgres
   
   // In index.ts
   import { connectDB } from "./config/dbConfig"; // Instead of connectPostgres
   ```

## Deployment Checklist

- [ ] PostgreSQL instance provisioned and accessible
- [ ] Environment variables configured
- [ ] Prisma migrations applied (`npx prisma migrate deploy`)
- [ ] Data migration completed
- [ ] Validation tests passed
- [ ] API smoke tests successful
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] MongoDB kept as backup for N days

## Future Enhancements

### Potential Additions

1. **Full-Text Search**: PostgreSQL `tsvector` for product search
2. **Materialized Views**: For complex analytics queries
3. **Partitioning**: Partition PriceHistory by date for better performance
4. **Triggers**: Automatic price change notifications
5. **Row-Level Security**: Multi-tenant support
6. **Read Replicas**: Scale read operations

### Schema Evolution

Prisma migrations make schema changes simple:

```bash
# Modify prisma/schema.prisma
# Generate migration
npx prisma migrate dev --name add_new_field

# Apply to production
npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

**Issue**: Prisma Client not found
```bash
npx prisma generate
```

**Issue**: Migration fails with connection error
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check network/firewall settings

**Issue**: Type errors after migration
```bash
npm run build
```

**Issue**: Price history not migrating
- Check MongoDB connection
- Verify priceHistory array structure
- Review migration script logs

## Support & Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs
- **Migration Script**: `scripts/migrate-data.ts`
- **Schema Definition**: `prisma/schema.prisma`

## Conclusion

This migration provides:
- ✅ Improved data integrity with foreign keys
- ✅ Better query performance with indexes
- ✅ Type-safe database access with Prisma
- ✅ Easier schema evolution with migrations
- ✅ Full backward compatibility for API clients
- ✅ Comprehensive migration tooling

The application is now running on PostgreSQL with zero downtime possible through gradual migration strategy.
