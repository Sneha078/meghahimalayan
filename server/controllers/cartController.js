import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — resolve the effective selling price for a product
// Always uses discountPrice when it exists and is lower than price.
// ─────────────────────────────────────────────────────────────────────────────
const getEffectivePrice = (product) => {
  if (
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice < product.price
  ) {
    return product.discountPrice;
  }
  return product.price;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — refresh all item prices and remove deleted products from a cart
// Called on every GET so the cart always shows current prices.
// ─────────────────────────────────────────────────────────────────────────────
const refreshCartPrices = async (cart) => {
  let changed = false;

  // Fetch all products in one query
  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // Filter out items whose product was deleted, update prices
  const validItems = [];
  for (const item of cart.items) {
    const product = productMap.get(item.product.toString());

    if (!product) {
      // Product was deleted — silently remove from cart
      changed = true;
      continue;
    }

    const currentPrice = getEffectivePrice(product);
    if (item.price !== currentPrice) {
      item.price = currentPrice;
      changed = true;
    }

    validItems.push(item);
  }

  if (changed) {
    cart.items = validItems;
    await cart.save();
  }

  return cart;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/cart
// Returns the user's cart with refreshed prices, totals, and coupon preview.
// ─────────────────────────────────────────────────────────────────────────────
export const getCart = handleAsyncError(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name brand image price discountPrice stock isOutOfStock slug category"
  );

  // Return an empty cart object if the user has never added anything
  if (!cart) {
    return res.status(200).json({
      success: true,
      cart: {
        items: [],
        itemsPrice: 0,
        totalItems: 0,
        couponCode: "",
        discount: 0,
        shippingPrice: 0,
        totalPrice: 0,
      },
    });
  }

  // Refresh prices and remove deleted products
  cart = await refreshCartPrices(cart);

  // Re-populate after potential refresh
  await cart.populate(
    "items.product",
    "name brand image price discountPrice stock isOutOfStock slug category"
  );

  // ── Compute totals ─────────────────────────────────────────────────────────
  const itemsPrice   = cart.itemsPrice;
  const shippingPrice = itemsPrice >= 3000 ? 0 : 150;

  // Preview coupon discount (not applied until checkout)
  let discount = 0;
  let couponError = "";

  if (cart.couponCode) {
    const coupon = await Coupon.findOne({
      code: cart.couponCode,
      isActive: true,
    });

    if (!coupon || (coupon.expiresAt && coupon.expiresAt < new Date())) {
      // Coupon expired or deleted — clear it silently
      cart.couponCode = "";
      await cart.save();
      couponError = "Saved coupon is no longer valid and has been removed";
    } else if (itemsPrice < coupon.minOrder) {
      couponError = `Coupon requires a minimum order of NPR ${coupon.minOrder}`;
    } else {
      discount =
        coupon.type === "percentage"
          ? (itemsPrice * coupon.value) / 100
          : coupon.value;

      if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
      discount = Math.round(discount);
    }
  }

  const totalPrice = Math.max(0, itemsPrice + shippingPrice - discount);

  const response = {
    success: true,
    cart: {
      _id:          cart._id,
      items:        cart.items,
      couponCode:   cart.couponCode,
      itemsPrice,
      totalItems:   cart.totalItems,
      discount,
      shippingPrice,
      totalPrice,
    },
  };

  if (couponError) response.couponError = couponError;

  res.status(200).json(response);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/cart
// Add a product to the cart.
// If the product already exists, its quantity is increased.
// Body: { productId, quantity }
// ─────────────────────────────────────────────────────────────────────────────
export const addToCart = handleAsyncError(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new HandleError("Product ID is required", 400));
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    return next(new HandleError("Quantity must be a positive whole number", 400));
  }

  // Support ObjectId or slug
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
  const product = isObjectId
    ? await Product.findById(productId)
    : await Product.findOne({ slug: productId });

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  if (product.stock === 0) {
    return next(new HandleError(`"${product.name}" is out of stock`, 400));
  }

  // Find or create the user's cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const effectivePrice = getEffectivePrice(product);

  // Check if this product is already in the cart
  const existingIndex = cart.items.findIndex(
    (i) => i.product.toString() === product._id.toString()
  );

  if (existingIndex >= 0) {
    // Product already in cart — increase quantity
    const newQty = cart.items[existingIndex].quantity + qty;

    if (newQty > product.stock) {
      return next(
        new HandleError(
          `Cannot add ${qty} more. Only ${product.stock - cart.items[existingIndex].quantity} unit(s) available`,
          400
        )
      );
    }

    cart.items[existingIndex].quantity = newQty;
    cart.items[existingIndex].price    = effectivePrice; // refresh price
  } else {
    // New item — check stock
    if (qty > product.stock) {
      return next(
        new HandleError(
          `Only ${product.stock} unit(s) available for "${product.name}"`,
          400
        )
      );
    }

    cart.items.push({
      product:  product._id,
      quantity: qty,
      price:    effectivePrice,
    });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: `"${product.name}" added to cart`,
    totalItems: cart.totalItems,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/cart/:itemId
// Update the quantity of a specific cart item.
// Body: { quantity }
// To remove an item set quantity to 0 — this triggers automatic removal.
// ─────────────────────────────────────────────────────────────────────────────
export const updateCartItem = handleAsyncError(async (req, res, next) => {
  const { quantity } = req.body;
  const qty = Number(quantity);

  if (quantity === undefined || isNaN(qty) || qty < 0) {
    return next(new HandleError("Quantity must be 0 or a positive number", 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new HandleError("Cart not found", 404));
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return next(new HandleError("Item not found in cart", 404));
  }

  // quantity = 0 means remove
  if (qty === 0) {
    cart.items = cart.items.filter(
      (i) => i._id.toString() !== req.params.itemId
    );
    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      totalItems: cart.totalItems,
    });
  }

  // Validate against live stock
  const product = await Product.findById(item.product);
  if (!product) {
    cart.items = cart.items.filter(
      (i) => i._id.toString() !== req.params.itemId
    );
    await cart.save();
    return next(new HandleError("This product no longer exists", 404));
  }

  if (qty > product.stock) {
    return next(
      new HandleError(
        `Only ${product.stock} unit(s) available for "${product.name}"`,
        400
      )
    );
  }

  item.quantity = qty;
  item.price    = getEffectivePrice(product); // refresh price on update
  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart updated",
    totalItems: cart.totalItems,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/cart/:itemId
// Remove a single item from the cart.
// ─────────────────────────────────────────────────────────────────────────────
export const removeCartItem = handleAsyncError(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new HandleError("Cart not found", 404));
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return next(new HandleError("Item not found in cart", 404));
  }

  cart.items = cart.items.filter(
    (i) => i._id.toString() !== req.params.itemId
  );

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
    totalItems: cart.totalItems,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/cart
// Clear the entire cart (called after a successful order is placed).
// ─────────────────────────────────────────────────────────────────────────────
export const clearCart = handleAsyncError(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(200).json({ success: true, message: "Cart is already empty" });
  }

  cart.items      = [];
  cart.couponCode = "";
  await cart.save();

  res.status(200).json({ success: true, message: "Cart cleared successfully" });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/cart/coupon
// Apply a coupon code to the cart (preview only — does not increment usedCount).
// Body: { couponCode }
// ─────────────────────────────────────────────────────────────────────────────
export const applyCoupon = handleAsyncError(async (req, res, next) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    return next(new HandleError("Please enter a coupon code", 400));
  }

  const coupon = await Coupon.findOne({
    code:     couponCode.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    return next(new HandleError("Invalid or inactive coupon code", 400));
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return next(new HandleError("This coupon has expired", 400));
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return next(new HandleError("This coupon has reached its usage limit", 400));
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return next(new HandleError("Your cart is empty", 400));
  }

  const itemsPrice = cart.itemsPrice;

  if (itemsPrice < coupon.minOrder) {
    return next(
      new HandleError(
        `This coupon requires a minimum order of NPR ${coupon.minOrder}`,
        400
      )
    );
  }

  // Calculate preview discount
  let discount =
    coupon.type === "percentage"
      ? (itemsPrice * coupon.value) / 100
      : coupon.value;

  if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }
  discount = Math.round(discount);

  // Save coupon code to cart
  cart.couponCode = coupon.code;
  await cart.save();

  const shippingPrice = itemsPrice >= 3000 ? 0 : 150;
  const totalPrice    = Math.max(0, itemsPrice + shippingPrice - discount);

  res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" applied successfully`,
    coupon: {
      code:        coupon.code,
      description: coupon.description,
      type:        coupon.type,
      value:       coupon.value,
    },
    discount,
    itemsPrice,
    shippingPrice,
    totalPrice,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/cart/coupon
// Remove the applied coupon from the cart.
// ─────────────────────────────────────────────────────────────────────────────
export const removeCoupon = handleAsyncError(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(new HandleError("Cart not found", 404));
  }

  cart.couponCode = "";
  await cart.save();

  res.status(200).json({ success: true, message: "Coupon removed from cart" });
});
