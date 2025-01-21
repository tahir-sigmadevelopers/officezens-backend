import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({

    category: {
        type: String,
        required: [true, "Please Enter Product Category"],
    },
    subCategory: [
        {
            type: String,
            required: [true, "Please Enter Product SubCategory"],
        },
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Category = mongoose.model("Category", CategorySchema);

export default Category;
