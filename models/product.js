import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: [true, "Please Enter Product Name"],
  },
  description: {
    type: String,
    // required: [true, "Please Enter Product Description"],
  },
  price: {
    type: Number,
    // required: [true, "Please Enter Product Price"],
  },
  stock: {
    type: Number,
    // required: [true, "Please Enter Product Stock"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
        required: [true, "Please Enter Product Name"],
      },
      comment: {
        type: String,
        required: [true, "Please Enter Comment For Product"],
      },
      rating: {
        type: Number,
        required: [true, "Please Enter Product Rating"],
      },
    },
  ],
  images: [
    {
      public_id: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
  ],
  category: {
    type: String,
  },
  subCategory: {
    type: String,
  },

  variations: [
    {
      type: String,
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", ProductSchema);

export default Product;
