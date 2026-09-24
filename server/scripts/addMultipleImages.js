import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample additional images for testing gallery functionality
const additionalImages = [
  {
    public_id: "mega_himalayan/products/sample1",
    url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500&h=500&fit=crop"
  },
  {
    public_id: "mega_himalayan/products/sample2", 
    url: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=500&h=500&fit=crop"
  },
  {
    public_id: "mega_himalayan/products/sample3",
    url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500&h=500&fit=crop"
  }
];

const addMultipleImagesToProduct = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first product to add images to
    const product = await Product.findOne();
    
    if (!product) {
      console.log('No products found');
      process.exit(1);
    }

    console.log(`Found product: ${product.name}`);
    console.log(`Current images: ${product.image.length}`);

    // Add additional images to the existing ones
    product.image = [...product.image, ...additionalImages];
    
    await product.save();
    
    console.log(`Updated product with ${product.image.length} total images`);
    console.log('Successfully added multiple images for gallery testing');

  } catch (error) {
    console.error('Error adding images:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addMultipleImagesToProduct();