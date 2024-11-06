import mongoose from "mongoose";
// import validator from "validator";
// import crypto from "crypto";
const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: [true, "User Already Exist With This Email"],
    // validate: [validator.isEmail, "Please Enter Valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter Password"],
    select: false,
  },

  role: {
    type: String,
    default: "user",
  },

  // image: {
  //   public_id: {
  //     type: String,
  //   },
  //   url: {
  //     type: String,
  //   },
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // resetPasswordToken: String,
  // resetPasswordExpire: Date,
});

// userSchema.methods.getResetPasswordToken = function (password) {
//   const resetToken = crypto.randomBytes(16).toString("hex");

//   this.resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest(`hex`);

//   this.resetPasswordExpire = Date.now() + 15 * 60 * 60 * 1000;

//   return resetToken;
// };




const User = mongoose.model("User", userSchema);

export default User;
