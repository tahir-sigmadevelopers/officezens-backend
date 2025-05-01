/**
 * Middleware for validating image uploads
 */

/**
 * Validates a base64 image string
 * @param {string} base64Str - The base64 encoded image string
 * @param {number} maxSizeKB - Maximum size in KB
 * @returns {Object} - { valid: boolean, error: string or null }
 */
const validateBase64Image = (base64Str, maxSizeKB = 500) => {
  // Check if it's a valid base64 image string
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
    return {
      valid: false,
      error: 'Invalid image format. Must be a base64 encoded image.'
    };
  }
  
  // Check image type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const typeMatch = base64Str.match(/data:(.*?);base64/);
  const type = typeMatch ? typeMatch[1] : '';
  
  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `Invalid image type: ${type}. Only JPEG, JPG, PNG and WEBP are allowed.`
    };
  }
  
  // Check size (the base64 string length * 0.75 is approximately the size in bytes)
  const base64Data = base64Str.split(',')[1] || '';
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  const sizeInKB = sizeInBytes / 1024;
  
  if (sizeInKB > maxSizeKB) {
    return {
      valid: false,
      error: `Image size (${Math.ceil(sizeInKB)}KB) exceeds the ${maxSizeKB}KB limit.`
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Middleware to validate image uploads for products
 */
export const validateProductImages = (req, res, next) => {
  try {
    // Validate main product images
    if (req.body.images) {
      let images = [];
      
      if (typeof req.body.images === 'string') {
        images.push(req.body.images);
      } else if (Array.isArray(req.body.images)) {
        images = req.body.images;
      }
      
      // Validate each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Skip validation for existing images (objects with url)
        if (image.url) continue;
        
        const validation = validateBase64Image(image);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: `Main image ${i+1}: ${validation.error}`
          });
        }
      }
    }
    
    // Validate variation images if present
    if (req.body.variations) {
      let variations = [];
      
      if (typeof req.body.variations === 'string') {
        try {
          variations = JSON.parse(req.body.variations);
        } catch (e) {
          variations = req.body.variations.split(',').map(v => ({ name: v.trim() }));
        }
      } else if (Array.isArray(req.body.variations)) {
        variations = req.body.variations;
      }
      
      // Validate each variation's image if present
      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        
        if (variation.image && typeof variation.image === 'string' && variation.image.startsWith('data:image')) {
          const validation = validateBase64Image(variation.image);
          if (!validation.valid) {
            return res.status(400).json({
              success: false,
              message: `Variation ${i+1} image: ${validation.error}`
            });
          }
        }
      }
    }
    
    // All validations passed, proceed to next middleware
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Image validation error: ${error.message}`
    });
  }
};

export default validateProductImages; 