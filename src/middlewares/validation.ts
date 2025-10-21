import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * Creates a validation middleware for Express routes
 * @param schema - Zod schema object with optional body, query, and params properties
 * @returns Express middleware function
 */
export function validate(schema: { body?: z.ZodSchema; query?: z.ZodSchema; params?: z.ZodSchema }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errorMessages,
        });
        return;
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        message: "Internal server error during validation",
      });
      return;
    }
  };
}
