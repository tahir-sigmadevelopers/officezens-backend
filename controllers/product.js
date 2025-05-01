import Product from "../models/product.js";
import ErrorHandler from "../middlewares/Error.js";
import cloudinary from "cloudinary";
import Category from "../models/category.js";



export const newProduct = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.description || !req.body.price || !req.body.stock) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, description, price, and stock are required"
      });
    }

    // Process main product images
    let images = [];

    // Validate images exist
    if (!req.body.images || req.body.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required"
      });
    }

    // Ensure images is always an array
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    const imagesLinks = [];
    let uploadSuccess = true;

    // Upload each image to Cloudinary
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // Ensure the image is a base64 string
      if (typeof image !== "string" || !image.startsWith("data:image")) {
        return res.status(400).json({
          success: false,
          message: `Invalid image format at index ${i}. Images must be in base64 format.`
        });
      }

      try {
        // Calculate base64 size (approx)
        const base64Size = Math.round((image.length * 3) / 4);
        const sizeInKB = base64Size / 1024;
        
        // Check if image exceeds 500KB
        if (sizeInKB > 500) {
          return res.status(400).json({
            success: false,
            message: `Image at index ${i} exceeds the 500KB size limit`
          });
        }

        // Upload base64 image to Cloudinary
        const result = await cloudinary.v2.uploader.upload(image, {
          folder: "products",
          quality: "auto:good",
          fetch_format: "auto",
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      } catch (uploadError) {
        console.error(`Error uploading image ${i}:`, uploadError);
        uploadSuccess = false;
        
        // Delete any images that were already uploaded
        for (const uploadedImage of imagesLinks) {
          await cloudinary.v2.uploader.destroy(uploadedImage.public_id);
        }
        
        return res.status(500).json({
          success: false,
          message: `Failed to upload image: ${uploadError.message}`
        });
      }
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
          variations = req.body.variations.split(',').map(v => ({ name: v.trim(), price: 0 }));
        }
      } else if (Array.isArray(req.body.variations)) {
        variations = req.body.variations;
      }

      // Validate variations
      if (variations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one product variation is required"
        });
      }

      // Process variation images if they exist
      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        
        // Validate variation name
        if (!variation.name || variation.name.trim() === "") {
          return res.status(400).json({
            success: false,
            message: `Variation at index ${i} must have a name`
          });
        }
        
        // If variation has an image, upload it to Cloudinary
        if (variation.image && typeof variation.image === 'string' && variation.image.startsWith('data:image')) {
          try {
            // Calculate base64 size (approx)
            const base64Size = Math.round((variation.image.length * 3) / 4);
            const sizeInKB = base64Size / 1024;
            
            // Check if image exceeds 500KB
            if (sizeInKB > 500) {
              return res.status(400).json({
                success: false,
                message: `Variation image at index ${i} exceeds the 500KB size limit`
              });
            }
            
            const result = await cloudinary.v2.uploader.upload(variation.image, {
              folder: "product-variations",
              quality: "auto:good",
              fetch_format: "auto",
            });
            
            variation.image = {
              public_id: result.public_id,
              url: result.secure_url
            };
          } catch (uploadError) {
            console.error(`Error uploading variation image ${i}:`, uploadError);
            
            // Clean up all uploaded resources on failure
            for (const uploadedImage of imagesLinks) {
              await cloudinary.v2.uploader.destroy(uploadedImage.public_id);
            }
            
            // Clean up previously uploaded variation images
            for (let j = 0; j < i; j++) {
              if (variations[j].image && variations[j].image.public_id) {
                await cloudinary.v2.uploader.destroy(variations[j].image.public_id);
              }
            }
            
            return res.status(500).json({
              success: false,
              message: `Failed to upload variation image: ${uploadError.message}`
            });
          }
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
    const limit = Number(process.env.Product_Per_Page) || 30;
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

    // Select only necessary fields to reduce payload size
    const fieldsToSelect = {
      name: 1,
      price: 1,
      images: { $slice: 1 }, // Only get the first image
      stock: 1,
      category: 1,
      subCategory: 1,
      ratings: 1,
    };

    // Fetch products with sorting and pagination
    const productsPromise = Product.find(baseQuery)
      .select(fieldsToSelect)
      .sort(sort ? { price: sort === "asc" ? 1 : -1 } : {})
      .limit(limit)
      .skip(skip)
      .lean(); // Use lean() for faster queries as it returns plain JS objects

    // Fetch total filtered products count (use countDocuments for better performance)
    const totalCount = await Product.countDocuments(baseQuery);

    let totalPages = Math.ceil(totalCount / limit);
    
    // Get the products
    const products = await productsPromise;

    // Set cache headers (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Expires', new Date(Date.now() + 300000).toUTCString());

    return res.status(200).json({
      success: true,
      message: "All Products",
      products,
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
    // Get all categories with lean() for better performance
    let allCategories = await Category.find().lean();

    // Set cache headers (10 minutes for categories since they change less frequently)
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.setHeader('Expires', new Date(Date.now() + 600000).toUTCString());

    return res.status(200).json({
      success: true,
      allCategories,
    });

  } catch (error) {
    return next(
      new ErrorHandler(`Error Occurred While Getting the Product Categories ${error}`, 500)
    );
  }
};

export const getLatestProducts = async (req, res, next) => {
  try {
    // Select only necessary fields to reduce payload size
    const fieldsToSelect = {
      name: 1,
      price: 1,
      images: { $slice: 1 }, // Only get the first image
      description: 1,
      stock: 1,
      category: 1,
    };

    // Get latest products with lean() for better performance
    let latestProducts = await Product.find()
      .select(fieldsToSelect)
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // Set cache headers (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Expires', new Date(Date.now() + 300000).toUTCString());

    return res.status(200).json({
      success: true,
      latestProducts,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occurred While Getting Latest Products ${error}`,
        500
      )
    );
  }
};

export const getOldProducts = async (req, res, next) => {
  try {
    // Select only necessary fields to reduce payload size
    const fieldsToSelect = {
      name: 1,
      price: 1,
      images: { $slice: 1 }, // Only get the first image
      description: 1,
      stock: 1,
      category: 1,
    };

    // Get oldest products with lean() for better performance
    let oldProducts = await Product.find()
      .select(fieldsToSelect)
      .sort({ createdAt: +1 })
      .limit(8)
      .lean();

    // Set cache headers (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Expires', new Date(Date.now() + 300000).toUTCString());

    return res.status(200).json({
      success: true,
      oldProducts,
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        `Error Occurred While Getting Latest Products ${error}`,
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

    // Validate required fields
    if (req.body.name !== undefined && req.body.name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Product name cannot be empty"
      });
    }

    if (req.body.description !== undefined && req.body.description.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Product description cannot be empty"
      });
    }

    if (req.body.price !== undefined && (isNaN(req.body.price) || Number(req.body.price) <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Product price must be a positive number"
      });
    }

    if (req.body.stock !== undefined && (isNaN(req.body.stock) || Number(req.body.stock) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Product stock cannot be negative"
      });
    }

    // Process main product images
    if (req.body.images) {
      let images = [];

      // Validate images array is not empty
      if (Array.isArray(req.body.images) && req.body.images.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one product image is required"
        });
      }

      if (typeof req.body.images === "string") {
        // Check if it's a JSON string containing image objects
        try {
          const parsedImages = JSON.parse(req.body.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            // User is keeping the existing images, no need to process
            req.body.images = parsedImages;
            // Skip the image processing and continue with update
          } else {
            // Not a valid array, treat as single image
            images.push(req.body.images);
          }
        } catch (e) {
          // Not JSON, treat as single image (base64 or URL)
        images.push(req.body.images);
        }
      } else {
        images = req.body.images;
      }

      // Only process if images aren't already processed (i.e., not objects with url)
      if (!Array.isArray(req.body.images) || !req.body.images[0].url) {
        // Track uploaded images for rollback in case of failure
        const uploadedImagesIds = [];
        const imagesLinks = [];

        try {
      // Delete old images from Cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }

      // Upload new images to Cloudinary
      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // Check if it's a new image (base64) or an existing one (object with url)
        if (typeof image === "string" && image.startsWith("data:image")) {
              // Calculate base64 size (approx)
              const base64Size = Math.round((image.length * 3) / 4);
              const sizeInKB = base64Size / 1024;
              
              // Check if image exceeds 500KB
              if (sizeInKB > 500) {
                throw new Error(`Image at index ${i} exceeds the 500KB size limit`);
              }

              // Upload the image
            const result = await cloudinary.v2.uploader.upload(image, {
              folder: "products",
                quality: "auto:good",
                fetch_format: "auto",
            });

              uploadedImagesIds.push(result.public_id);
            imagesLinks.push({
              public_id: result.public_id,
              url: result.secure_url,
            });
        } else if (image.url) {
          // Keep existing image
          imagesLinks.push(image);
            } else {
              throw new Error(`Invalid image format at index ${i}`);
            }
          }

          // Update the request body with new images
          req.body.images = imagesLinks;
        } catch (error) {
          // Rollback - Delete any newly uploaded images
          for (const id of uploadedImagesIds) {
            await cloudinary.v2.uploader.destroy(id);
          }

          return res.status(400).json({
            success: false,
            message: `Image processing failed: ${error.message}`
          });
        }
      }
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
          variations = req.body.variations.split(',').map(v => ({ name: v.trim(), price: 0 }));
        }
      } else if (Array.isArray(req.body.variations)) {
        variations = req.body.variations;
      }

      // Validate variations
      if (variations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one product variation is required"
        });
      }

      // Track uploaded variation images for rollback
      const uploadedVariationImageIds = [];

      try {
      // Normalize variations to ensure they have the correct structure
      variations = variations.map(variation => {
        // If variation is a string, convert to object
        if (typeof variation === 'string') {
          return { name: variation, price: 0, image: { public_id: "", url: "" } };
        }
        
        // If variation name is a stringified JSON, parse it
        if (variation.name && typeof variation.name === 'string' && 
            variation.name.startsWith('{') && variation.name.includes('"name":"')) {
          try {
            const parsedVariation = JSON.parse(variation.name);
            return {
              name: parsedVariation.name || "",
              price: parsedVariation.price || variation.price || 0,
              image: variation.image || { public_id: "", url: "" }
            };
          } catch (e) {
            // If parsing fails, use as is
          }
        }
          
          // Validate variation name
          if (!variation.name || variation.name.trim() === "") {
            throw new Error("Variation name cannot be empty");
        }
        
        // Ensure variation has all required fields
        return {
          name: variation.name || "",
          price: variation.price || 0,
          image: variation.image || { public_id: "", url: "" }
        };
      });

      // Process variation images if they exist
      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        
        // If variation has an image and it's a new image (base64)
        if (variation.image && typeof variation.image === 'string' && variation.image.startsWith('data:image')) {
            // Calculate base64 size (approx)
            const base64Size = Math.round((variation.image.length * 3) / 4);
            const sizeInKB = base64Size / 1024;
            
            // Check if image exceeds 500KB
            if (sizeInKB > 500) {
              throw new Error(`Variation image at index ${i} exceeds the 500KB size limit`);
            }
            
            // Delete old image if it exists
            if (product.variations[i] && product.variations[i].image && product.variations[i].image.public_id) {
              await cloudinary.v2.uploader.destroy(product.variations[i].image.public_id);
            }
            
            // Upload new image
            const result = await cloudinary.v2.uploader.upload(variation.image, {
              folder: "product-variations",
              quality: "auto:good",
              fetch_format: "auto",
            });
            
            uploadedVariationImageIds.push(result.public_id);
            variation.image = {
              public_id: result.public_id,
              url: result.secure_url
            };
        } else if (variation.image && variation.image.url) {
          // Keep existing image with url property as is
          // No need to process anything
        } else if (variation.image && typeof variation.image === 'object' && Object.keys(variation.image).length === 0) {
          // Empty object - no image provided
          // Check if there's an existing one to keep
            if (i < product.variations.length && product.variations[i] && product.variations[i].image) {
              variation.image = product.variations[i].image;
            } else {
              variation.image = { public_id: "", url: "" };
            }
        } else {
          // No image provided or invalid format, check if there's an existing one to keep
          if (i < product.variations.length && product.variations[i] && product.variations[i].image) {
            variation.image = product.variations[i].image;
          } else {
            variation.image = { public_id: "", url: "" };
          }
        }
      }
      
      req.body.variations = variations;
      } catch (error) {
        // Rollback - Delete any newly uploaded variation images
        for (const id of uploadedVariationImageIds) {
          await cloudinary.v2.uploader.destroy(id);
        }

        return res.status(400).json({
          success: false,
          message: `Variation processing failed: ${error.message}`
        });
      }
    }

    // Update the product in the database
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
            price: 0,
            image: { public_id: "", url: "" },
          };
        }
        
        // Case 2: Object format but with stringified JSON in name
        if (variation.name && typeof variation.name === 'string' && 
            variation.name.startsWith('{') && variation.name.includes('"name":"')) {
          try {
            const parsedVariation = JSON.parse(variation.name);
            return {
              name: parsedVariation.name || "",
              price: parsedVariation.price || variation.price || 0,
              image: variation.image || { public_id: "", url: "" }
            };
          } catch (e) {
            // If parsing fails, use as is
            return {
              name: variation.name || "",
              price: typeof variation.price === 'number' ? variation.price : 0,
              image: variation.image || { public_id: "", url: "" }
            };
          }
        }
        
        // Case 3: Ensure all fields exist
        return {
          name: variation.name || "",
          price: typeof variation.price === 'number' ? variation.price : 0,
          image: variation.image || { public_id: "", url: "" }
        };
      });

 
    
    // Set cache headers for product details (10 minutes)
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.setHeader('Expires', new Date(Date.now() + 600000).toUTCString());

    return res.status(200).json({
      success: true,
      product,
    });
  }} catch (error) {
    return next(
      new ErrorHandler(`Error Occurred While Getting the Product ${error}`, 500)
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
