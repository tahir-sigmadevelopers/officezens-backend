import Product from "../models/product.js";
import ErrorHandler from "../middlewares/Error.js";
import cloudinary from "cloudinary";
import Category from "../models/category.js";



export const newProduct = async (req, res) => {
  try {
    // Process main product images
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

    // Process variations
    if (req.body.variations) {
      let variations = [];
      
      if (typeof req.body.variations === 'string') {
        try {
          // Try to parse as JSON
          variations = JSON.parse(req.body.variations);
        } catch (e) {
          // If not valid JSON, treat as comma-separated string
          variations = req.body.variations.split(',').map(v => ({ name: v.trim() }));
        }
      } else if (Array.isArray(req.body.variations)) {
        variations = req.body.variations;
      }

      // Process variation images if they exist
      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        
        // If variation has an image, upload it to Cloudinary
        if (variation.image && typeof variation.image === 'string' && variation.image.startsWith('data:image')) {
          const result = await cloudinary.v2.uploader.upload(variation.image, {
            folder: "product-variations",
          });
          
          variation.image = {
            public_id: result.public_id,
            url: result.secure_url
          };
        }
      }
      
      req.body.variations = variations;
    }

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
    const limit = Number(process.env.Product_Per_Page) || 20;
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
      return next(new ErrorHandler("Product Not Found", 404));
    }

    // Process main product images
    if (req.body.images) {
      let images = [];

      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else {
        images = req.body.images;
      }

      // Delete old images from Cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }

      const imagesLinks = [];

      // Upload new images to Cloudinary
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // Check if it's a new image (base64) or an existing one (object with url)
        if (typeof image === "string" && image.startsWith("data:image")) {
          const result = await cloudinary.v2.uploader.upload(image, {
            folder: "products",
          });

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        } else if (image.url) {
          // Keep existing image
          imagesLinks.push(image);
        }
      }

      req.body.images = imagesLinks;
    }

    // Process variations
    if (req.body.variations) {
      let variations = [];
      
      if (typeof req.body.variations === 'string') {
        try {
          // Try to parse as JSON
          variations = JSON.parse(req.body.variations);
        } catch (e) {
          // If not valid JSON, treat as comma-separated string
          variations = req.body.variations.split(',').map(v => ({ name: v.trim() }));
        }
      } else if (Array.isArray(req.body.variations)) {
        variations = req.body.variations;
      }

      // Normalize variations to ensure they have the correct structure
      variations = variations.map(variation => {
        // If variation is a string, convert to object
        if (typeof variation === 'string') {
          return { name: variation, color: "", image: { public_id: "", url: "" } };
        }
        
        // If variation name is a stringified JSON, parse it
        if (variation.name && typeof variation.name === 'string' && 
            variation.name.startsWith('{') && variation.name.includes('"name":"')) {
          try {
            const parsedVariation = JSON.parse(variation.name);
            return {
              name: parsedVariation.name || "",
              color: parsedVariation.color || variation.color || "",
              image: variation.image || { public_id: "", url: "" }
            };
          } catch (e) {
            // If parsing fails, use as is
          }
        }
        
        // Ensure variation has all required fields
        return {
          name: variation.name || "",
          color: variation.color || "",
          image: variation.image || { public_id: "", url: "" }
        };
      });

      // Process variation images if they exist
      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        
        // If variation has an image and it's a new image (base64)
        if (variation.image && typeof variation.image === 'string' && variation.image.startsWith('data:image')) {
          // Delete old image if it exists
          if (product.variations[i] && product.variations[i].image && product.variations[i].image.public_id) {
            await cloudinary.v2.uploader.destroy(product.variations[i].image.public_id);
          }
          
          // Upload new image
          const result = await cloudinary.v2.uploader.upload(variation.image, {
            folder: "product-variations",
          });
          
          variation.image = {
            public_id: result.public_id,
            url: result.secure_url
          };
        } else if (variation.image && variation.image.url) {
          // Keep existing image
        } else {
          // No image provided, check if there's an existing one to keep
          if (i < product.variations.length && product.variations[i] && product.variations[i].image) {
            variation.image = product.variations[i].image;
          } else {
            variation.image = { public_id: "", url: "" };
          }
        }
      }
      
      req.body.variations = variations;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return next(new ErrorHandler(`Error Occurred: ${error.message}`, 500));
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

    // Transform variations to ensure consistent format
    if (product.variations && product.variations.length > 0) {
      // Convert to plain object to modify
      product = product.toObject();
      
      // Process each variation to ensure consistent format
      product.variations = product.variations.map(variation => {
        // Case 1: String format (old)
        if (typeof variation === 'string') {
          return {
            name: variation,
            color: "",
            image: { public_id: "", url: "" }
          };
        }
        
        // Case 2: Object format but with stringified JSON in name
        if (variation.name && typeof variation.name === 'string' && 
            variation.name.startsWith('{') && variation.name.includes('"name":"')) {
          try {
            const parsedVariation = JSON.parse(variation.name);
            return {
              name: parsedVariation.name || "",
              color: parsedVariation.color || variation.color || "",
              image: variation.image || { public_id: "", url: "" }
            };
          } catch (e) {
            // If parsing fails, use as is
          }
        }
        
        // Case 3: Ensure all fields exist
        return {
          name: variation.name || "",
          color: variation.color || "",
          image: variation.image || { public_id: "", url: "" }
        };
      });
    }

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
