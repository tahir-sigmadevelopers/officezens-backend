import mongoose from 'mongoose';
import Product from '../models/product.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

const migrateVariations = async () => {
  try {
    console.log('Starting migration of product variations...');
    
    // Find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);
    
    let migratedCount = 0;
    
    // Process each product
    for (const product of products) {
      // Check if variations need migration (are strings or don't have name property)
      if (product.variations && product.variations.length > 0) {
        const needsMigration = product.variations.some(variation => 
          typeof variation === 'string' || 
          (typeof variation === 'object' && !variation.name)
        );
        
        if (needsMigration) {
          // Transform variations to new format
          const newVariations = product.variations.map(variation => {
            if (typeof variation === 'string') {
              return {
                name: variation,
                color: "",
                image: { public_id: "", url: "" }
              };
            } else if (typeof variation === 'object' && !variation.name) {
              // Handle any other unexpected format
              return {
                name: String(variation),
                color: "",
                image: { public_id: "", url: "" }
              };
            }
            return variation;
          });
          
          // Update the product
          product.variations = newVariations;
          await product.save();
          migratedCount++;
          console.log(`Migrated product: ${product._id} - ${product.name}`);
        }
      }
    }
    
    console.log(`Migration complete. Migrated ${migratedCount} products.`);
    
  } catch (error) {
    console.error('Migration Error:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

// Run the migration
migrateVariations(); 