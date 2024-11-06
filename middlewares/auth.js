import User from "../models/user.js";
import ErrorHandler from "./Error.js";
import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    const { ecommerce } = req.cookies;

    if (!ecommerce) return next(new ErrorHandler(`Login First`, 401));

    const decoded = jwt.verify(ecommerce, process.env.JWT_SECRET);

    req.user = await User.findById(decoded._id);

    next();
  } catch (error) {
    return next(new ErrorHandler(`Error Occured ${error}`, 401));
  }
};

export const adminRoutes = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new ErrorHandler(`Only Admin Allowed`, 405));
  }

  next();
};

export default isAuthenticated;
