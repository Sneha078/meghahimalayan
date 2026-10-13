import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/productModel.js';

dotenv.config();

const testSunglasses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const sunglassProducts = await Product.find({
      $or: [
        { name: { $regex: 'sunglass', $options: 'i' } },
        { subcategory: { $regex: 'sunglass', $options: 'i' } },
        { description: { $regex: 'sunglass', $options: 'i' } }
      ]
    }).select('name category subcategory').limit(10).lean();
    
    console.log(`\n📊 Products mentioning "sunglasses": ${sunglassProducts.length}\n`);
    
    if (sunglassProducts.length > 0) {
      sunglassProducts.forEach(p => {
        console.log(`  - ${p.name} (${p.category}/${p.subcategory || 'no sub'})`);
      });
    } else {
      console.log('❌ No products found with "sunglasses" in name, subcategory, or description');
      console.log('\n💡 Suggestion: Your products are categorized as "eyeglasses"');
      console.log('   The AI assistant should map "sunglasses" -> "eyeglasses"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testSunglasses();
