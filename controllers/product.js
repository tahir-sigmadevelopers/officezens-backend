import Product from "../models/product.js";
import ErrorHandler from "../middlewares/Error.js";
import cloudinary from "cloudinary";
import Category from "../models/category.js";



export const newProduct = async (req, res) => {
  try {


    // Check if variations are received as a string and split them into an array
    if (typeof req.body?.variations === 'string') {
      req.body.variations = req.body.variations.split(','); // Split by comma into an array
    }


    let images = [];

    // Ensure images is always an array
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    const imagesLinks = [];

    // Upload each image to Cloudinary
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // Ensure the image is a base64 string
      if (typeof image !== "string" || !image.startsWith("data:image")) {
        throw new Error(`Invalid image format at index ${i}`);
      }

      // Upload base64 image to Cloudinary
      const result = await cloudinary.v2.uploader.upload(image, {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    // Update req.body.images with Cloudinary links
    req.body.images = imagesLinks;

    // Create product in the database
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





export const newCategory = async (req, res, next) => {
  try {

    if (!req.body.category || !Array.isArray(req.body.subCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category data. 'category' and 'subCategory' are required.",
      });
    }

    const category = await Category.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Category Added Successfully",
      category,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Error Occured While Creating the Product ${error}`, 500)
    );
  }
};



export const getAllProducts = async (req, res, next) => {
  try {
    const baseQuery = {};

    const { category, price, search, sort, subCategory } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.Product_Per_Page) || 8;
    const skip = limit * (page - 1);

    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (price) {
      baseQuery.price = { $lte: Number(price) };
    }

    if (category) {
      baseQuery.category = category.trim();  // Ensure spaces are removed
    }

    if (subCategory) {
      baseQuery.subCategory = subCategory.trim(); // Ensure spaces are removed
    }

    // Fetch products with sorting and pagination
    const productsPromise = Product.find(baseQuery)
      .sort(sort ? { price: sort === "asc" ? 1 : -1 } : {})
      .limit(limit)
      .skip(skip);

    // Fetch total filtered products count
    const filteredOnlyProducts = await Product.find(baseQuery);

    let totalPages = Math.ceil(filteredOnlyProducts.length / limit);

    return res.status(200).json({
      success: true,
      message: "All Products",
      products: await productsPromise,
      totalPages
    });

  } catch (error) {
    return next(
      new ErrorHandler(`Error Occurred While Getting the Product ${error}`, 500)
    );
  }
};






export const getAllCategories = async (req, res, next) => {
  try {

    let allCategories = await Category.find();


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


    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Images Start Here
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
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      product,
      message: "Product Updated Successfully"
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
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler("This Category Does Not Exist!", 404));
    }

    await Category.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Category Deleted Successfully",
      categoryId: category._id,
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
