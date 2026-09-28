import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Product from '../../models/productModel.js';
import Cart from '../../models/cartModel.js';
import Order from '../../models/orderModel.js';
import User from '../../models/userModel.js';

describe('Pricing Integration Flow', () => {
  let authToken;
  let userId;
  let watchProduct;
  let eyeglassesProduct;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/meghahimalayan-test');
    }

    // Create test user and get auth token
    const userRes = await request(app)
      .post('/api/v1/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
      });
    
    userId = userRes.body.user._id;
    authToken = userRes.body.token;
  });

  beforeEach(async () => {
    // Clean up test data
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    // Create test products
    watchProduct = await Product.create({
      name: 'Test Watch',
      slug: 'test-watch',
      description: 'A test watch with variants',
      category: 'watches',
      brand: 'TestBrand',
      price: 10000,
      discountPrice: 9000,
      stock: 100,
      user: userId,
      variants: [
        {
          color: 'Silver',
          colorHex: '#C0C0C0',
          stock: 10,
          price: 12000,
          discountPrice: null, // No variant discount
          images: []
        },
        {
          color: 'Gold',
          colorHex: '#FFD700',
          stock: 5,
          price: 15000,
          discountPrice: 13000, // With variant discount
          images: []
        },
        {
          color: 'Black',
          colorHex: '#000000',
          stock: 8,
          price: null, // Uses product price
          discountPrice: null,
          images: []
        }
      ]
    });

    eyeglassesProduct = await Product.create({
      name: 'Test Eyeglasses',
      slug: 'test-eyeglasses',
      description: 'Test eyeglasses without variants',
      category: 'eyeglasses',
      brand: 'TestBrand',
      price: 5000,
      discountPrice: 4000,
      stock: 20,
      user: userId,
      variants: [] // No variants
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Product Page -> Cart -> Order Flow (Watches)', () => {
    it('should show correct pricing throughout the flow for variant products', async () => {
      // 1. Get product details (should include resolved pricing)
      const productRes = await request(app)
        .get(`/api/v1/product/${watchProduct._id}`);

      expect(productRes.status).toBe(200);
      const product = productRes.body.product;

      // Verify base product pricing
      expect(product.price).toBe(10000);
      expect(product.finalPrice).toBe(9000);
      expect(product.savePct).toBe(10);
      expect(product.hasVariants).toBe(true);
      expect(product.variantPriceRange.showFromPrice).toBe(true);
      expect(product.variantPriceRange.min).toBe(9000); // Black variant uses product discount
      expect(product.variantPriceRange.max).toBe(13000); // Gold variant with discount

      // Verify variant pricing
      const silverVariant = product.variants.find(v => v.color === 'Silver');
      expect(silverVariant.finalPrice).toBe(12000);
      expect(silverVariant.savePct).toBe(0);

      const goldVariant = product.variants.find(v => v.color === 'Gold');
      expect(goldVariant.finalPrice).toBe(13000);
      expect(goldVariant.savePct).toBe(Math.round(((15000 - 13000) / 15000) * 100));

      const blackVariant = product.variants.find(v => v.color === 'Black');
      expect(blackVariant.finalPrice).toBe(9000); // Uses product pricing
      expect(blackVariant.savePct).toBe(10);

      // 2. Add Gold variant to cart
      const cartRes = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: watchProduct._id,
          quantity: 1,
          variant: { variantId: goldVariant._id }
        });

      expect(cartRes.status).toBe(200);

      // 3. Get cart and verify pricing
      const getCartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getCartRes.status).toBe(200);
      const cart = getCartRes.body.cart;
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].price).toBe(13000); // Server calculated variant price
      expect(cart.items[0].variant.color).toBe('Gold');
      expect(cart.itemsPrice).toBe(13000);

      // 4. Create order and verify final pricing
      const orderRes = await request(app)
        .post('/api/v1/order/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingInfo: {
            name: 'Test User',
            address: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '12345',
            phoneNo: '9876543210'
          },
          paymentInfo: { method: 'COD' }
        });

      expect(orderRes.status).toBe(201);
      const order = orderRes.body.order;

      expect(order.orderItems).toHaveLength(1);
      expect(order.orderItems[0].price).toBe(13000); // Final verified price
      expect(order.orderItems[0].variant.color).toBe('Gold');
      expect(order.itemsPrice).toBe(13000);
    });

    it('should handle products without variants correctly', async () => {
      // 1. Get eyeglasses product (no variants)
      const productRes = await request(app)
        .get(`/api/v1/product/${eyeglassesProduct._id}`);

      expect(productRes.status).toBe(200);
      const product = productRes.body.product;

      expect(product.price).toBe(5000);
      expect(product.finalPrice).toBe(4000);
      expect(product.savePct).toBe(20);
      expect(product.hasVariants).toBe(false);
      expect(product.variantPriceRange).toBe(null);

      // 2. Add to cart (no variant)
      const cartRes = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: eyeglassesProduct._id,
          quantity: 2
        });

      expect(cartRes.status).toBe(200);

      // 3. Verify cart pricing
      const getCartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getCartRes.status).toBe(200);
      const cart = getCartRes.body.cart;
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].price).toBe(4000); // Discounted price
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.itemsPrice).toBe(8000); // 4000 * 2

      // 4. Create order
      const orderRes = await request(app)
        .post('/api/v1/order/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingInfo: {
            name: 'Test User',
            address: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '12345',
            phoneNo: '9876543210'
          },
          paymentInfo: { method: 'COD' }
        });

      expect(orderRes.status).toBe(201);
      const order = orderRes.body.order;

      expect(order.orderItems[0].price).toBe(4000);
      expect(order.orderItems[0].quantity).toBe(2);
      expect(order.itemsPrice).toBe(8000);
    });

    it('should reject invalid variant selection', async () => {
      const fakeVariantId = new mongoose.Types.ObjectId();
      
      const cartRes = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: watchProduct._id,
          quantity: 1,
          variant: { variantId: fakeVariantId }
        });

      expect(cartRes.status).toBe(400);
      expect(cartRes.body.message).toContain('no longer available');
    });

    it('should handle variant without price (fallback to product price)', async () => {
      const blackVariant = watchProduct.variants.find(v => v.color === 'Black');
      
      const cartRes = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: watchProduct._id,
          quantity: 1,
          variant: { variantId: blackVariant._id }
        });

      expect(cartRes.status).toBe(200);

      const getCartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      const cart = getCartRes.body.cart;
      expect(cart.items[0].price).toBe(9000); // Product discount price, not variant price
    });
  });

  describe('ProductCard "From Rs. X" Logic', () => {
    it('should show "From Rs. X" in product listings when variants have different prices', async () => {
      const productsRes = await request(app)
        .get('/api/v1/products');

      expect(productsRes.status).toBe(200);
      const products = productsRes.body.products;

      const watchInListing = products.find(p => p._id === watchProduct._id.toString());
      expect(watchInListing.hasVariants).toBe(true);
      expect(watchInListing.variantPriceRange.showFromPrice).toBe(true);
      expect(watchInListing.variantPriceRange.min).toBe(9000);

      const eyeglassesInListing = products.find(p => p._id === eyeglassesProduct._id.toString());
      expect(eyeglassesInListing.hasVariants).toBe(false);
      expect(eyeglassesInListing.variantPriceRange).toBe(null);
    });
  });
});