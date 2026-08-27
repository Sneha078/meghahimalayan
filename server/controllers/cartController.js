import mongoose from "mongoose";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// HELPERS
//check valid MongoDB ObjectID
const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

//determine products actual Selling Price
const getEffectivePrice = (product) => {
  if (
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice >= 0 &&
    product.discountPrice < product.price
  ) {
    return product.discountPrice;
  }
  return product.price;
};

//check product availability
const isProductAvailable = (product) => {
  if (!product) return false;

  if (
    product.isDeleted !== undefined &&
    product.isDeleted === true
  ) {
    return false;
  }

  if (
    product.isActive !== undefined &&
    product.isActive === false
  ) {
    return false;
  }
  return true;
};

//calculate discount according to coupon type
const calculateCouponDiscount = (coupon, itemsPrice) => {
  if (!coupon) return 0;
  let discount = 0;

  if (coupon.type === "percentage") {
    discount = (itemsPrice * coupon.value) / 100;
  } else if (coupon.type === "flat") {
    discount = coupon.value;
  }

  if (
    coupon.maxDiscount !== null &&
    coupon.maxDiscount !== undefined &&
    discount > coupon.maxDiscount
  ) {
    discount = coupon.maxDiscount;
  }
  discount = Math.min(discount, itemsPrice);
  return Math.round(discount);
};

// Validate coupon for cart preview.
// The Order controller MUST validate the coupon again during checkout.
const validateCoupon = async (couponCode, itemsPrice) => {
  if (!couponCode) {
    return { coupon: null, discount: 0, error: null };
  }
  const normalizedCode = String(couponCode)
    .trim()
    .toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isActive: true,
  });

  if (!coupon) {
    return {
      coupon: null,
      discount: 0,
      error: "Invalid or inactive coupon code",
    };
  }

  if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
    return {
      coupon: null,
      discount: 0,
      error: "This coupon has expired",
    };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      coupon: null,
      discount: 0,
      error: "This coupon has reached its usage limit",
    };
  }

  if (itemsPrice < coupon.minOrder) {
    return {
      coupon,
      discount: 0,
      error: `This coupon requires a minimum order of NPR ${coupon.minOrder}`,
    };
  }

  return {
    coupon,
    discount: calculateCouponDiscount(coupon, itemsPrice),
    error: null,
  };
};

// Cart price is only a snapshot.
// Product DB remains authoritative.
const refreshCart = async (cart) => {
  if (!cart || cart.items.length === 0) return cart;

  const productIds = cart.items.map((item) => item.product);

  const products = await Product.find({
    _id: { $in: productIds },
  });

  const productMap = new Map(
    products.map((product) => [
      product._id.toString(),
      product,
    ])
  );

  let changed = false;
  const validItems = [];

  for (const item of cart.items) {
    const product = productMap.get(item.product.toString());

    if (!product || !isProductAvailable(product)) {
      changed = true;
      continue;
    }

    if (product.stock <= 0) {
      changed = true;
      continue;
    }

    if (item.quantity > product.stock) {
      item.quantity = product.stock;
      changed = true;
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

//Prepare final cart summary for frontend 
const buildCartResponse = async (cart) => {
  if (!cart) {
    return {
      _id: null,
      items: [],
      couponCode: "",
      itemsPrice: 0,
      totalItems: 0,
      discount: 0,
      totalPrice: 0,
    };
  }

  const itemsPrice = cart.itemsPrice;
  let discount = 0;
  let couponError = "";

  if (cart.couponCode) {
    const result = await validateCoupon(
      cart.couponCode,
      itemsPrice
    );

    if (result.error) {
      couponError = result.error;
      cart.couponCode = "";
      await cart.save();
    } else {
      discount = result.discount;
    }
  }

  // Shipping is calculated during checkout after client shipping rules are defined.
  const totalPrice = Math.max(0, itemsPrice - discount);

  const response = {
    _id: cart._id,
    items: cart.items,
    couponCode: cart.couponCode,
    itemsPrice,
    totalItems: cart.totalItems,
    discount,
    totalPrice,
  };

  if (couponError) {
    response.couponError = couponError;
  }

  return response;
};

// GET CART
// GET /api/v1/cart
export const getCart = handleAsyncError(async (req, res) => {
  let cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    return res.status(200).json({
      success: true,
      cart: {
        _id: null,
        items: [],
        couponCode: "",
        itemsPrice: 0,
        totalItems: 0,
        discount: 0,
        totalPrice: 0,
      },
    });
  }

  cart = await refreshCart(cart);
  await cart.populate({
    path: "items.product",
    select:
      "name slug brand image images price discountPrice stock isOutOfStock category",
  });

  cart.items = cart.items.filter((item) => item.product);
  const response = await buildCartResponse(cart);

  return res.status(200).json({
    success: true,
    cart: response,
  });
});

// ADD TO CART
// POST /api/v1/cart
// Body: { productId, quantity }
export const addToCart = handleAsyncError(
  async (req, res, next) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return next(
        new HandleError("Product ID is required", 400)
      );
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return next(
        new HandleError(
          "Quantity must be a positive whole number",
          400
        )
      );
    }

    let product;
    if (isValidObjectId(productId)) {
      product = await Product.findById(productId);
    } else {
      product = await Product.findOne({
        slug: String(productId).trim().toLowerCase(),
      });
    }

    if (!product) {
      return next(
        new HandleError("Product not found", 404)
      );
    }

    if (!isProductAvailable(product)) {
      return next(
        new HandleError(
          "This product is currently unavailable",
          400
        )
      );
    }

    if (product.stock <= 0) {
      return next(
        new HandleError(
          `"${product.name}" is out of stock`,
          400
        )
      );
    }

    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === product._id.toString()
    );

    const effectivePrice = getEffectivePrice(product);

    if (existingItem) {
      const newQuantity = existingItem.quantity + qty;

      if (newQuantity > product.stock) {
        const remaining = Math.max(
          0,
          product.stock - existingItem.quantity
        );

        return next(
          new HandleError(
            `Cannot add ${qty} more. Only ${remaining} additional unit(s) available`,
            400
          )
        );
      }
      existingItem.quantity = newQuantity;
      existingItem.price = effectivePrice;
    } else {
      if (qty > product.stock) {
        return next(
          new HandleError(
            `Only ${product.stock} unit(s) available for "${product.name}"`,
            400
          )
        );
      }

      cart.items.push({
        product: product._id,
        quantity: qty,
        price: effectivePrice,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: `"${product.name}" added to cart`,
      totalItems: cart.totalItems,
    });
  }
);

// UPDATE CART ITEM
// PUT /api/v1/cart/:itemId
// Body: { quantity }
// quantity = 0 → remove
export const updateCartItem = handleAsyncError(
  async (req, res, next) => {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return next(
        new HandleError("Quantity is required", 400)
      );
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      return next(
        new HandleError(
          "Quantity must be 0 or a positive whole number",
          400
        )
      );
    }

    if (!isValidObjectId(req.params.itemId)) {
      return next(
        new HandleError("Invalid cart item ID", 400)
      );
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return next(
        new HandleError("Cart not found", 404)
      );
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return next(
        new HandleError(
          "Item not found in cart",
          404
        )
      );
    }

    if (qty === 0) {
      cart.items.pull(req.params.itemId);
      await cart.save();

      return res.status(200).json({
        success: true,
        message: "Item removed from cart",
        totalItems: cart.totalItems,
      });
    }

    const product = await Product.findById(item.product);

    if (!product) {
      cart.items.pull(req.params.itemId);
      await cart.save();

      return next(
        new HandleError(
          "This product no longer exists",
          404
        )
      );
    }

    if (!isProductAvailable(product)) {
      cart.items.pull(req.params.itemId);
      await cart.save();

      return next(
        new HandleError(
          "This product is no longer available",
          400
        )
      );
    }

    if (product.stock <= 0) {
      cart.items.pull(req.params.itemId);
      await cart.save();

      return next(
        new HandleError(
          `"${product.name}" is out of stock`,
          400
        )
      );
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
    item.price = getEffectivePrice(product);

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      totalItems: cart.totalItems,
    });
  }
);

// REMOVE CART ITEM
// DELETE /api/v1/cart/:itemId
export const removeCartItem = handleAsyncError(
  async (req, res, next) => {
    if (!isValidObjectId(req.params.itemId)) {
      return next(
        new HandleError(
          "Invalid cart item ID",
          400
        )
      );
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return next(
        new HandleError("Cart not found", 404)
      );
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return next(
        new HandleError(
          "Item not found in cart",
          404
        )
      );
    }

    cart.items.pull(req.params.itemId);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      totalItems: cart.totalItems,
    });
  }
);

// CLEAR CART
// DELETE /api/v1/cart
export const clearCart = handleAsyncError(
  async (req, res) => {
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty",
      });
    }

    cart.items = [];
    cart.couponCode = "";

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  }
);

// APPLY COUPON
// POST /api/v1/cart/coupon
// Body: { couponCode }
export const applyCoupon = handleAsyncError(
  async (req, res, next) => {
    const { couponCode } = req.body;

    if (!couponCode || !String(couponCode).trim()) {
      return next(
        new HandleError(
          "Please enter a coupon code",
          400
        )
      );
    }

    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart || cart.items.length === 0) {
      return next(
        new HandleError(
          "Your cart is empty",
          400
        )
      );
    }

    cart = await refreshCart(cart);

    if (cart.items.length === 0) {
      return next(
        new HandleError(
          "Your cart is empty because the products are no longer available",
          400
        )
      );
    }

    const itemsPrice = cart.itemsPrice;

    const normalizedCode = String(couponCode)
      .trim()
      .toUpperCase();

    const result = await validateCoupon(
      normalizedCode,
      itemsPrice
    );

    if (result.error) {
      return next(
        new HandleError(result.error, 400)
      );
    }

    cart.couponCode = result.coupon.code;

    await cart.save();

    const totalPrice = Math.max(
      0,
      itemsPrice - result.discount
    );

    return res.status(200).json({
      success: true,
      message:
        `Coupon "${result.coupon.code}" applied successfully`,
      coupon: {
        code: result.coupon.code,
        description: result.coupon.description,
        type: result.coupon.type,
        value: result.coupon.value,
      },
      itemsPrice,
      discount: result.discount,
      totalPrice,
    });
  }
);

// REMOVE COUPON
// DELETE /api/v1/cart/coupon
export const removeCoupon = handleAsyncError(
  async (req, res, next) => {
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return next(
        new HandleError("Cart not found", 404)
      );
    }

    cart.couponCode = "";

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Coupon removed successfully",
    });
  }
);