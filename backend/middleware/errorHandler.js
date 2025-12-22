// middleware/errorHandler.js
const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("Request error", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    status: err.status || 500,
  });

  const status = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
