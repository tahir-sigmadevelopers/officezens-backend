class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default ErrorHandler;

export const ErrorMiddlerware = (err, req, res, next) => {
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;

  // MongoDB Cast Error -- Invalid Object_id
  if (err.name === "CastError") {
    const message = `Resource Not Found - Invalid : ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //WRONG JWT ERROR
  if (err.name === "JsonWebTokenError") {
    const message = `Invalid JWT , Please Try Again`;

    err = new ErrorHandler(message, 400);
  }

  // JWT EXPIRE ERROR
  if (err.name === "TokenExpiredError") {
    const message = `JWT is Expired , Please Try Again`;

    err = new ErrorHandler(message, 400);
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
