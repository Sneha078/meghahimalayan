import HandleError from "../utils/handleError.js";

// Centralized Express error-handling middleware.
// Must be registered LAST in index.js (after all routes).
// Receives errors from:
//   - next(new HandleError(...))   — operational errors we throw
//   - next(err)                    — caught by handleAsyncError wrapper
//   - Express itself               — e.g. body-parser limit exceeded

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //if the error has status code use it else use 500
  err.message    = err.message    || "Internal Server Error";

  // Handles invalid MongoDB ID
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid ${err.path}: ${err.value}`;
    err = new HandleError(message, 404);
  }

  // Mongoose: duplicate key (e.g. duplicate email on register)
  if (err.code === 11000) {
    const field   = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered`;
    err = new HandleError(message, 400);
  }

  // Mongoose schema validation(data must satisfy mongoose schema)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    err = new HandleError(message, 400);
  }

  // Handles invalid JWT Token
  if (err.name === "JsonWebTokenError") {
    err = new HandleError("Invalid token. Please login again", 401);
  }

  // JWT: token expired 
  if (err.name === "TokenExpiredError") {
    err = new HandleError("Token has expired. Please login again", 401);
  }

  // Express body-parser: payload too large 
  if (err.type === "entity.too.large") {
    err = new HandleError("Request payload is too large", 413);
  }

  const response = {
    success: false,
    message: err.message,
  };

  // Include stack trace in development only — never expose it in production
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

export default errorMiddleware;
