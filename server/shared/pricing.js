/**
 * Single source of truth for product pricing across all categories
 * Handles variant pricing (replacement, not addition) and optional add-ons
 */

/**
 * Resolves the final pricing for a product with optional variant and add-ons
 * 
 * @param {Object} product - Product document from database
 * @param {Object|null} variant - Selected variant (optional)
 * @param {Array} addOns - Array of add-ons with addon_price field (optional)
 * @returns {Object} { price, finalPrice, savePct }
 */
export function resolvePrice(product, variant = null, addOns = []) {
  if (!product) {
    throw new Error('Product is required for price resolution');
  }

  // Step 1: Determine base price (variant replaces, not adds)
  let basePrice = product.price;
  let discount = product.discountPrice;

  if (variant) {
    // Variant price replaces product price entirely
    if (variant.price !== null && variant.price !== undefined) {
      basePrice = variant.price;
      
      // Variant discount replaces product discount when variant has its own price
      discount = variant.discountPrice || null;
    } else {
      // No variant price set - use product price but check for variant-specific discount
      basePrice = product.price;
      discount = variant.discountPrice !== null && variant.discountPrice !== undefined 
        ? variant.discountPrice 
        : product.discountPrice;
    }
  }

  // Step 2: Apply discount (only if discount is valid and lower than base)
  let finalBase = basePrice;
  if (discount !== null && discount !== undefined && discount < basePrice) {
    finalBase = discount;
  }

  // Step 3: Add any add-ons on top of the resolved price
  const addOnTotal = addOns.reduce((sum, addOn) => {
    return sum + (Number(addOn.addon_price) || 0);
  }, 0);

  const finalPrice = finalBase + addOnTotal;

  // Step 4: Calculate savings percentage (based on original price vs final base, excluding add-ons)
  let savePct = 0;
  if (finalBase < basePrice) {
    savePct = Math.round(((basePrice - finalBase) / basePrice) * 100);
  }

  return {
    price: basePrice,           // Original price (with variant override)
    finalPrice: finalPrice,     // Final price after discount + add-ons
    savePct: savePct           // Discount percentage (excluding add-ons)
  };
}

/**
 * Resolves pricing for all variants of a product
 * Returns pricing info for each in-stock variant plus the base product
 * 
 * @param {Object} product - Product document with populated variants
 * @returns {Object} { product: {...}, variants: [...] }
 */
export function resolveProductPricing(product) {
  if (!product) {
    throw new Error('Product is required for pricing resolution');
  }

  // Base product pricing
  const productPricing = resolvePrice(product);

  // Variant pricing (only for in-stock variants)
  const variantPricing = [];
  
  if (Array.isArray(product.variants)) {
    product.variants.forEach((variant, index) => {
      // Only include in-stock variants in pricing calculations
      if (variant.stock > 0) {
        const pricing = resolvePrice(product, variant);
        variantPricing.push({
          ...variant.toObject ? variant.toObject() : variant,
          index,
          ...pricing
        });
      }
    });
  }

  return {
    product: {
      ...productPricing,
      // Additional fields for ProductCard logic
      hasVariants: variantPricing.length > 0,
      variantPriceRange: getVariantPriceRange(variantPricing)
    },
    variants: variantPricing
  };
}

/**
 * Helper function to determine if we should show "From Rs. X" pricing
 * Only shows "From" when variant prices actually differ from each other
 */
function getVariantPriceRange(variantPricing) {
  if (variantPricing.length === 0) {
    return null;
  }

  const prices = variantPricing.map(v => v.finalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // Only show "From" if there's actually a price range
  const showFromPrice = minPrice < maxPrice;
  
  return {
    min: minPrice,
    max: maxPrice,
    showFromPrice
  };
}