import mongoose from '../server/node_modules/mongoose/index.js';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
dotenv.config({ path: 'server/.env' });

import Order from '../server/models/orderModel.js';
import Return from '../server/models/returnModel.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const orders = await Order.find({ orderStatus: 'Delivered' }).sort({ createdAt: -1 }).limit(5);
  console.log(`Found ${orders.length} delivered orders:`);

  for (const o of orders) {
    console.log('--------------------------------------------------');
    console.log('Order ID:', o._id);
    console.log('Order Number:', o.orderNumber);
    console.log('totalPrice:', o.totalPrice);
    console.log('itemsPrice:', o.itemsPrice);
    console.log('discount:', o.discount);
    console.log('pointsDiscount:', o.pointsDiscount);
    console.log('shippingPrice:', o.shippingPrice);
    console.log('taxPrice:', o.taxPrice);
    console.log('refundedAmount:', o.refundedAmount);
    console.log('orderItems count:', o.orderItems?.length);
    for (const item of o.orderItems) {
      console.log(`  - Item: ${item.name}, qty: ${item.quantity}, price: ${item.price}, product: ${item.product}`);
    }

    const returns = await Return.find({ order: o._id, isDeleted: false });
    console.log(`  Returns count: ${returns.length}`);
    for (const r of returns) {
      console.log(`    - Return ID: ${r._id}, status: ${r.status}, refundStatus: ${r.refundStatus}, requestedAmount: ${r.refund?.requestedAmount}`);
    }
  }

  await mongoose.disconnect();
}

check().catch(console.error);
