export function errorHandler(err, req, res, next) {
    console.error(err); // internal logging only
  
    const isProd = process.env.NODE_ENV === "production";
  
    res.status(err.status || 500).json({
      error: {
        code: err.code || "INTERNAL_ERROR",
        message: isProd ? "Something went wrong." : err.message,
      },
    });
  }