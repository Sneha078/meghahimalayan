import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixOrderForReturns = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find orders that need to be fixed for returns testing
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${orders.length} recent orders:`);
    
    for (let order of orders) {
      console.log(`\nOrder: ${order.orderNumber}`);
      console.log(`Status: ${order.orderStatus}`);
      console.log(`DeliveredAt: ${order.deliveredAt}`);
      console.log(`Created: ${order.createdAt}`);
      
      // If order is not delivered, mark it as delivered with a recent date
      if (order.orderStatus !== 'Delivered') {
        order.orderStatus = 'Delivered';
        order.deliveredAt = new Date(); // Set delivered date to now
        await order.save();
        console.log(`✅ Updated order ${order.orderNumber} to Delivered status`);
      } else if (!order.deliveredAt) {
        order.deliveredAt = new Date(); // Set delivered date to now
        await order.save();
        console.log(`✅ Added deliveredAt date to order ${order.orderNumber}`);
      } else {
        console.log(`ℹ️  Order ${order.orderNumber} already properly set up for returns`);
      }
    }

  } catch (error) {
    console.error('Error fixing orders:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

fixOrderForReturns();