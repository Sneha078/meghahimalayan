import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/productModel.js';

dotenv.config();

const testPriceFilter = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Testing price filtering...\n');
    
    // Test: Products above Rs 40,000
    const highPriceProducts = await Product.find({ sellingPrice: { $gte: 40000 } })
      .select('name price discountPrice sellingPrice')
      .limit(5)
      .lean();
    
    console.log('Products with sellingPrice >= Rs 40,000:');
    highPriceProducts.forEach(p => {
      console.log(`  - ${p.name}: Rs ${p.sellingPrice.toLocaleString()}`);
    });
    
    const totalHighPrice = await Product.countDocuments({ sellingPrice: { $gte: 40000 } });
    console.log(`\n✅ Total products above Rs 40,000: ${totalHighPrice}\n`);
    
    // Test: Products between Rs 10,000-25,000
    const midRangeCount = await Product.countDocuments({ 
      sellingPrice: { $gte: 10000, $lte: 25000 } 
    });
    console.log(`✅ Products Rs 10,000-25,000: ${midRangeCount}`);
    
    // Test: Products under Rs 10,000
    const lowPriceCount = await Product.countDocuments({ 
      sellingPrice: { $lt: 10000 } 
    });
    console.log(`✅ Products under Rs 10,000: ${lowPriceCount}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testPriceFilter();
