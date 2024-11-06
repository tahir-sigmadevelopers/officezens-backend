import bcrypt from "bcryptjs/dist/bcrypt.js";
import ErrorHandler from "../middlewares/Error.js";
import User from "../models/user.js";
import setCookie from "../cookie/setCookie.js";
import sendMail from "../utils/sendEmail.js";
import crypto from "crypto";
import cloudinary from "cloudinary";

export const registerUser = async (req, res, next) => {
  try {
    // const myCloud = await cloudinary.v2.uploader.upload(req.body.image, {
    //   folder: "User",
    //   width: 150,
    //   crop: "scale",
    // });

    // console.log(req.body.image);
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) return next(new ErrorHandler(`User Already Exists`, 400));

    // const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name,
      email,
      password
    });

    return res.status(201).json({
      success: true,
      message: `${user.name} Registered Successfully`,
      user
    })
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Creating the User ${error.message}`,
        500
      )
    );
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!password) {
      return next(new ErrorHandler("Please Enter Email & Password", 400));
    }


    let user = await User.findOne({ email }).select("+password")



    if (!user) return next(new ErrorHandler(`User Does Not Exists`, 400));

    // const isMatched = await bcrypt.compare(password, user.password);
    const isMatched = password === user.password


    if (!isMatched) return next(new ErrorHandler(`Invalid Credentials`, 401));

    return res.status(200).json({
      success: true,
      message: `Welcome Back ${user.name}!`,
      user
    })
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Log in User ${error.message}`, 500)
    );
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Login User  ${error.message}`, 500)
    );
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    let user = await User.findOne(req.user._id).select("+password");

    const isMatched = await bcrypt.compare(req.body.oldPassword, user.password);

    if (!isMatched)
      return next(new ErrorHandler(`Old Password Does Not Match`, 401));

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(
        new ErrorHandler(`Password and Confirm Password Does Not Match`, 405)
      );
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password Updated Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Updating User Password ${error.message}`,
        500
      )
    );
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    let user = await User.findById(req.user._id);


    // Image Deletion and Updation Code Starts Here
    if (req.body.image) {
      if (user.image && user.image.public_id) {
        let userImageId = user.image.public_id;
        await cloudinary.v2.uploader.destroy(userImageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.image, {
          folder: "User",
          width: 150,
          crop: "scale",
        });

        user.image = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
    }
    // Image Deletion and Updation Code Ends Here

    // Update only the name and email if they are provided in the request
    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occurred While Updating User Profile ${error.message}`,
        500
      )
    );
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    return res
      .status(200)
      .cookie("ecommerce", "", {
        expires: new Date(Date.now()),
        sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "Development" ? false : true,
      })
      .json({
        success: true,
        message: "Logout Successfully!",
      });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Log Out User ${error.message}`, 500)
    );
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.body.email });

    if (!user) return next(new ErrorHandler(`User Does Not Exists`, 400));

    let resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // let resetPasswordURL = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/v1/password/reset/${resetToken}`;
    let resetPasswordURL = `${process.env.FRONT_END_URL}/password/reset/${resetToken}`;

    let message = `You Requested For Password Reset , Your Reset Password Token is :- \n\n ${resetPasswordURL} \n\n If You Have Not Requested For Reset Password , Please Ignore this mail. `;

    try {
      await sendMail({
        email: user.email,
        subject: "TSO ECOMMERCE WEBSITE, PASSWORD RESET REQUEST",
        message,
      });

      return res.status(200).json({
        success: true,
        message: `Mail Sent to ${user.email} Successfully`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return next(
        new ErrorHandler(
          `Error Occured While Forget User Password ${error.message}`,
          500
        )
      );
    }
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Forget User Password ${error.message}`,
        500
      )
    );
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    let resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.ecommerce)
      .digest(`hex`);

    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return next(new ErrorHandler(`User Does Not Exists`, 400));

    if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler(`Password Does Not Match`, 405));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    setCookie(user, res, "Password Reset Successfully!", 201);
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Reset User Password ${error.message}`,
        500
      )
    );
  }
};

// Admin Routes

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    const usersCount = await User.countDocuments();

    return res.status(200).json({
      success: true,
      users,
      usersCount,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Getting All Users ${error.message}`,
        500
      )
    );
  }
};

export const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id)


    if (!user) {
      return res.status(404).json({ message: "User not found ", success: false, id })
    }
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Getting User Detail ${error.message}`,
        500
      )
    );
  }
};

// like role , name, email
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    let user = await User.findById(req.params.id);

    if (!user) return next(new ErrorHandler(`User Does Not Exists`, 400));

    user.name = name;
    user.email = email;
    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User Updated Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Updating User Profile ${error.message}`,
        500
      )
    );
  }
};

export const deleteUserProfile = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) return next(new ErrorHandler(`User Does Not Exists`, 400));

    let userImageId = user.image.public_id;
    await cloudinary.v2.uploader.destroy(userImageId);

    await User.deleteOne(user);

    return res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Delete User Profile ${error.message}`,
        500
      )
    );
  }
};
