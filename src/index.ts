import express, { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Zod Schema ---
// Define the shape of the expected request body
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  age: z.number().int().positive("Age must be a positive integer").optional(),
});

// Infer a TypeScript type from the schema
type CreateUserInput = z.infer<typeof createUserSchema>;

// --- Validation Middleware ---
// A generic middleware function to validate requests
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse and validate the request body
    schema.parse(req.body);
    // If validation succeeds, move to the next middleware/handler
    next();
  } catch (error) {
    // If validation fails, send a 400 response
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.format(),
      });
    }
    // Handle other unexpected errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

// --- Routes ---
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

// Use the validation middleware on this route
app.post("/users", validate(createUserSchema), (req: Request<any, any, CreateUserInput>, res: Response) => {
  // If we're here, the data is valid and typed!
  const { username, email, age } = req.body;

  console.log("New user created:", { username, email, age });

  // Send back the validated and typed data
  res.status(201).json({
    message: "User created successfully",
    user: req.body,
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
