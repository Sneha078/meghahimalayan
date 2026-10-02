import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/productModel.js';

dotenv.config();

const fixSellingPrices = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Fetching all products...');
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    let updated = 0;
    let skipped = 0;

    console.log('\n🔧 Updating sellingPrice for all products...\n');

    for (const product of products) {
      const correctSellingPrice = product.discountPrice != null && product.discountPrice > 0
        ? product.discountPrice
        : product.price;

      if (product.sellingPrice !== correctSellingPrice) {
        product.sellingPrice = correctSellingPrice;
        await product.save({ validateBeforeSave: false });
        updated++;
        console.log(`✓ Updated: ${product.name} (Rs ${correctSellingPrice})`);
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   - Updated: ${updated} products`);
    console.log(`   - Skipped: ${skipped} products (already correct)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixSellingPrices();
