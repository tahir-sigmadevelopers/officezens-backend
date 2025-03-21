import mongoose from 'mongoose';
import Product from '../models/product.js';

console.log('Starting script...');

// Use a default MongoDB connection string for local development
const MONGODB_URI = 'mongodb://localhost:27017/ecommerce';
console.log('Using MongoDB URI:', MONGODB_URI);

// Function to display variation details
const displayVariationDetails = (variations) => {
  console.log("\nVariation Details:");
  if (!variations || variations.length === 0) {
    console.log("No variations found");
    return;
  }

  variations.forEach((variation, index) => {
    console.log(`\nVariation ${index + 1}:`);
    if (typeof variation === 'string') {
      console.log(`  Name: ${variation}`);
      console.log(`  Type: String (old format)`);
      console.log(`  Price: N/A`);
    } else {
      console.log(`  Name: ${variation.name}`);
      console.log(`  Color: ${variation.color || 'N/A'}`);
      console.log(`  Image: ${variation.image?.url ? 'Yes' : 'No'}`);
      console.log(`  Price: ${variation.price !== undefined ? variation.price : 'Not defined'}`);
      console.log(`  Full object:`, JSON.stringify(variation, null, 2));
    }
  });
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Find all products
    return Product.find({}).select('name variations');
  })
  .then((products) => {
    console.log(`Found ${products.length} products`);
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.name}`);
      displayVariationDetails(product.variations);
    });
    
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  })
  .catch((error) => {
    console.error('Error:', error);
    if (mongoose.connection) {
      mongoose.connection.close();
    }
  }); 