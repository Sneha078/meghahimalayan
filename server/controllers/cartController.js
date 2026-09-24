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
// variant is optional — when supplied, its priceDelta is added on top of
// the product's own effective price (same rule used on the product page).
const getEffectivePrice = (product, variant = null) => {
  let base;

  if (
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice >= 0 &&
    product.discountPrice < product.price
  ) {
    base = product.discountPrice;
  } else {
    base = product.price;
  }

  const delta = variant?.priceDelta ? Number(variant.priceDelta) || 0 : 0;

  return base + delta;
};

// Find a variant sub-document on a product by its _id. Returns null if the
// product has no variants array, or the id doesn't match any entry
// (e.g. an admin removed that color since it was added to the cart).
const findVariant = (product, variantId) => {
  if (!variantId || !Array.isArray(product.variants)) return null;
  return (
    product.variants.find(
      (v) => v._id.toString() === variantId.toString()
    ) || null
  );
};

// Effective stock for a cart item: variant stock when a variant is
// selected, otherwise the product's flat stock.
const getEffectiveStock = (product, variant) =>
  variant ? Number(variant.stock) || 0 : product.stock;

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

// A prescription is "present" if the customer supplied either typed
// numbers for at least one eye, or an uploaded file. An empty/all-null
// object (the schema's default shape) does not count as present.
const hasPrescriptionData = (prescription) => {
  if (!prescription) return false;

  const eyeHasValues = (eye) =>
    eye &&
    [eye.sphere, eye.cylinder, eye.axis, eye.addPower].some(
      (v) => v !== null && v !== undefined
    );

  return (
    eyeHasValues(prescription.rightEye) ||
    eyeHasValues(prescription.leftEye) ||
    Boolean(prescription.file && prescription.file.url)
  );
};

//calculate discount according to coupon type
const calculateCouponDiscount = (coupon, itemsPrice) => {
  if (!coupon) return 0;
  let discount = 0;

  // Compare case-insensitively — the stored value may be "Percentage"/
  // "Flat" (as shown in the admin UI) rather than lowercase, and a strict
  // === check here was silently producing a 0 discount for any coupon
  // whose type wasn't exactly lowercase "percentage"/"flat".
  const type = String(coupon.type || "").trim().toLowerCase();

  if (type === "percentage") {
    discount = (itemsPrice * coupon.value) / 100;
  } else if (type === "flat" || type === "fixed") {
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

    // Re-resolve the variant against the live product. If the item had a
    // variant selected but that variant no longer exists on the product
    // (color discontinued/removed by admin), drop the line entirely —
    // same treatment as the product itself disappearing, since the exact
    // SKU the customer chose is gone.
    let variant = null;

    if (item.variant?.variantId) {
      variant = findVariant(product, item.variant.variantId);

      if (!variant) {
        changed = true;
        continue;
      }

      // Keep the display snapshot (color/colorHex/image) in sync in case
      // the admin edited the variant's photos or renamed the color.
      const freshImage = variant.images?.[0]
        ? { public_id: variant.images[0].public_id, url: variant.images[0].url }
        : { public_id: "", url: "" };

      if (
        item.variant.color !== variant.color ||
        item.variant.colorHex !== (variant.colorHex || "") ||
        item.variant.image?.url !== freshImage.url
      ) {
        item.variant.color = variant.color;
        item.variant.colorHex = variant.colorHex || "";
        item.variant.image = freshImage;
        changed = true;
      }
    }

    const effectiveStock = getEffectiveStock(product, variant);

    if (effectiveStock <= 0) {
      changed = true;
      continue;
    }

    if (item.quantity > effectiveStock) {
      item.quantity = effectiveStock;
      changed = true;
    }

    const currentPrice = getEffectivePrice(product, variant);

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
      "name slug brand image images price discountPrice stock isOutOfStock category variants",
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
// Body: { productId, quantity, prescription?, variant? }
// variant, if supplied: { variantId } — the _id of the chosen entry in
// product.variants. Only variantId is trusted from the client; color,
// colorHex and image are always taken fresh from the product so a
// tampered/stale client value can't spoof what was actually purchased.
export const addToCart = handleAsyncError(
  async (req, res, next) => {
    const { productId, quantity = 1, prescription, variant: variantInput } = req.body;

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

    // ── Resolve variant (if the product has any and one was requested) ──
    let variant = null;
    let variantSnapshot = null;

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const variantId = variantInput?.variantId;

      if (!variantId) {
        return next(
          new HandleError(
            `Please select a color for "${product.name}"`,
            400
          )
        );
      }

      if (!isValidObjectId(variantId)) {
        return next(
          new HandleError("Invalid variant selected", 400)
        );
      }

      variant = findVariant(product, variantId);

      if (!variant) {
        return next(
          new HandleError(
            "Selected color is no longer available for this product",
            400
          )
        );
      }

      variantSnapshot = {
        variantId: variant._id,
        color: variant.color,
        colorHex: variant.colorHex || "",
        image: variant.images?.[0]
          ? { public_id: variant.images[0].public_id, url: variant.images[0].url }
          : { public_id: "", url: "" },
      };
    }

    const effectiveStock = getEffectiveStock(product, variant);

    if (effectiveStock <= 0) {
      return next(
        new HandleError(
          variant
            ? `"${product.name}" in ${variant.color} is out of stock`
            : `"${product.name}" is out of stock`,
          400
        )
      );
    }

    // Prescription-required products must have prescription data attached.
    // Non-prescription products ignore any prescription data sent by
    // mistake, rather than erroring — nothing to validate against.
    if (product.isPrescriptionRequired && !hasPrescriptionData(prescription)) {
      return next(
        new HandleError(
          `Please provide your prescription details for "${product.name}"`,
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

    const effectivePrice = getEffectivePrice(product, variant);

    // Prescription items are never merged into an existing line — each
    // one belongs to a specific person's eyes, so a second submission for
    // the same product (even with identical numbers) is its own line
    // item, not an increment to an existing one.
    if (product.isPrescriptionRequired) {
      if (qty > effectiveStock) {
        return next(
          new HandleError(
            `Only ${effectiveStock} unit(s) available for "${product.name}"${variant ? ` in ${variant.color}` : ""}`,
            400
          )
        );
      }

      cart.items.push({
        product: product._id,
        quantity: qty,
        price: effectivePrice,
        prescription,
        variant: variantSnapshot,
      });

      await cart.save();

      return res.status(200).json({
        success: true,
        message: `"${product.name}" added to cart`,
        totalItems: cart.totalItems,
      });
    }

    // A line merges only when product AND selected variant both match —
    // two different colors of the same product are separate lines, same
    // as how prescription items never merge.
    const existingItem = cart.items.find((item) => {
      if (item.product.toString() !== product._id.toString()) return false;
      if (item.prescription) return false;

      const itemVariantId = item.variant?.variantId?.toString() ?? null;
      const newVariantId = variantSnapshot?.variantId?.toString() ?? null;

      return itemVariantId === newVariantId;
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + qty;

      if (newQuantity > effectiveStock) {
        const remaining = Math.max(
          0,
          effectiveStock - existingItem.quantity
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
      if (qty > effectiveStock) {
        return next(
          new HandleError(
            `Only ${effectiveStock} unit(s) available for "${product.name}"${variant ? ` in ${variant.color}` : ""}`,
            400
          )
        );
      }

      cart.items.push({
        product: product._id,
        quantity: qty,
        price: effectivePrice,
        variant: variantSnapshot,
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

    // Re-resolve the variant (if this line has one) against the live
    // product, same as refreshCart does — the color may have been
    // removed since it was added.
    let variant = null;

    if (item.variant?.variantId) {
      variant = findVariant(product, item.variant.variantId);

      if (!variant) {
        cart.items.pull(req.params.itemId);
        await cart.save();

        return next(
          new HandleError(
            "This color is no longer available for this product",
            400
          )
        );
      }
    }

    const effectiveStock = getEffectiveStock(product, variant);

    if (effectiveStock <= 0) {
      cart.items.pull(req.params.itemId);
      await cart.save();

      return next(
        new HandleError(
          variant
            ? `"${product.name}" in ${variant.color} is out of stock`
            : `"${product.name}" is out of stock`,
          400
        )
      );
    }

    if (qty > effectiveStock) {
      return next(
        new HandleError(
          `Only ${effectiveStock} unit(s) available for "${product.name}"${variant ? ` in ${variant.color}` : ""}`,
          400
        )
      );
    }

    item.quantity = qty;
    item.price = getEffectivePrice(product, variant);

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