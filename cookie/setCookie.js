
import jwt from "jsonwebtoken";
const setCookie = async (user, res, message, statusCode = 200) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  res
    .status(statusCode)
    .cookie("ecommerce", token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "development" ? false : true,
    })
    .json({
      success: true,
      message,
      user,
    });
};
;

export default setCookie;
