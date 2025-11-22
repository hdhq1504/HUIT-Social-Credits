/**
 * Global error handler middleware.
 * Bắt các lỗi không được xử lý và trả về response lỗi chuẩn.
 * @param {Error} err - Error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} _next - Express next middleware function.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") console.error(err);
  res.status(status).json({ error: message });
}
