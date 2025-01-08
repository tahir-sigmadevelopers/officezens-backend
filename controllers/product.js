import Product from "../models/product.js";
import ErrorHandler from "../middlewares/Error.js";
import apiFeatures from "../utils/apiFeatures.js";
import cloudinary from "cloudinary";

export const newProduct = async (req, res, next) => {
  try {
    let images = [];


    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    const imagesLinks = [];

    for (let i = 0; i < images?.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
    // req.body.user = req.user._id;

    const product = await Product.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Product Added Successfully",
      product,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Creating the Product ${error}`, 500)
    );
  }
};


export const getAllProducts = async (req, res, next) => {
  try {
    // Define the base query object
    const baseQuery = {};

    // Extract query parameters from the request
    const { category, price, search, sort } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.Product_Per_Page) || 8;
    const skip = limit * (page - 1);

    // Build the base query
    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (price) {
      baseQuery.price = {
        $lte: Number(price)
      };
    }

    if (category) {
      baseQuery.category = category;
    }

    // Define the products promise with sorting, limiting, and skipping
    const productsPromise = Product.find(baseQuery)
      .sort(sort ? { price: sort === "asc" ? 1 : -1 } : {})
      .limit(limit)
      .skip(skip);

    // Execute both the filtered products and the full products count queries
    const [products, filteredOnlyProducts] = await Promise.all([
      productsPromise,
      Product.find(baseQuery)
    ]);

    // Calculate the total pages
    let totalPages = Math.ceil(filteredOnlyProducts.length / limit);


    // Return the response
    return res.status(200).json({
      success: true,
      message: "All Products",
      products,
      totalPages
    });

  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Getting the Product ${error}`, 500)
    );
  }
};

export const getAllCategories = async (req, res, next) => {
  try {

    let allCategoriesData = await Product.distinct("category");

    const allCategories = allCategoriesData.slice(0, 10);

    return res.status(200).json({
      success: true,
      allCategories,
    });

  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Getting the Product Categories ${error}`, 500)
    );
  }
};

export const getLatestProducts = async (req, res, next) => {
  try {

    let latestProducts = await Product.find().sort({ createdAt: -1 }).limit(8)

    return res.status(200).json({
      success: true,
      latestProducts,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Getting Latest Products ${error}`,
        500
      )
    );
  }
};

export const getOldProducts = async (req, res, next) => {
  try {

    let oldProducts = await Product.find().sort({ createdAt: +1 }).limit(8)

    return res.status(200).json({
      success: true,
      oldProducts,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Getting Latest Products ${error}`,
        500
      )
    );
  }
};
export const getAdminProducts = async (req, res, next) => {
  try {
    const productsCount = await Product.countDocuments();

    let products = await Product.find();

    return res.status(200).json({
      success: true,
      products,
      productsCount,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Getting Admin Products ${error}`,
        500
      )
    );
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    console.log(product);


    if (!product)
      return next(new ErrorHandler("This Product Does Not Exist!", 404));

    let images = [];

    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    if (images !== undefined) {
      // Deleting Images From Cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }

      const imagesLinks = [];

      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }

      req.body.images = imagesLinks;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json({
      success: true,
      product,
      message: "Product Updated Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Updating the Product ${error}`, 500)
    );
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorHandler("This Product Does Not Exist!", 404));
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Product Deleted Successfully",
      productId: product._id,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occurred While Deleting the Product ${error}`, 500)
    );
  }
};


export const productDetails = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product)
      return next(new ErrorHandler("This Product Does Not Exist!", 404));

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Getting the Product ${error}`, 500)
    );
  }
};

export const userReview = async (req, res, next) => {
  try {
    const { rating, comment, id } = req.body;

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    const product = await Product.findById(id).populate("reviews.user");

    if (!product) return next(new ErrorHandler(`Product Does Not Exists`, 400));

    // Adding Review Functionality
    const isReviewed = product.reviews.find(
      (rev) => rev.user._id.toString().trim() === req.user._id.toString().trim()
    );

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user._id.toString().trim() === req.user._id.toString().trim()) {
          rev.rating = rating;
          rev.comment = comment;
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }

    let avg = 0;

    product.reviews.forEach((rev) => {
      avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });
    return res.status(200).json({
      success: true,
      message: "Review Added Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Reviewing The Product ${error}`,
        500
      )
    );
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    const product = await Product.findById(req.query.productId);



    if (!product) return next(new ErrorHandler(`Product Not Found`, 404));

    return res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occured While Getting the Product Reviews ${error}`,
        500
      )
    );
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.query.productId);

    if (!product) return next(new ErrorHandler(`Product Not Found`, 404));



    let reviews = product.reviews.filter(
      (review) => review._id.toString() !== req.query.id.toString()
    );

    let ratings = 0;
    let numOfReviews = reviews.length;

    if (numOfReviews > 0) {
      let avg = 0;
      reviews.forEach((rev) => {
        avg += rev.rating;
      });
      ratings = avg / numOfReviews;
    }

    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        ratings,
        numOfReviews,
        reviews,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Review Deleted Successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occurred While Deleting the Product Review: ${error}`,
        500
      )
    );
  }
};
