import { resolvePrice, resolveProductPricing } from '../shared/pricing.js';

describe('Pricing Functions', () => {
  // Mock product data
  const baseProduct = {
    name: 'Test Product',
    price: 1000,
    discountPrice: null
  };

  const discountProduct = {
    name: 'Discount Product',
    price: 1000,
    discountPrice: 800
  };

  const mockVariant = {
    color: 'blue',
    stock: 10,
    price: 1200,
    discountPrice: null
  };

  const mockVariantWithDiscount = {
    color: 'red',
    stock: 5,
    price: 1200,
    discountPrice: 1000
  };

  const mockVariantNoPrice = {
    color: 'green',
    stock: 8,
    price: null,
    discountPrice: null
  };

  const mockAddOns = [
    { addon_price: 100 },
    { addon_price: 50 }
  ];

  describe('resolvePrice', () => {
    it('should handle product with no variant and no discount', () => {
      const result = resolvePrice(baseProduct);
      
      expect(result).toEqual({
        price: 1000,
        finalPrice: 1000,
        savePct: 0
      });
    });

    it('should handle product with discount and no variant', () => {
      const result = resolvePrice(discountProduct);
      
      expect(result).toEqual({
        price: 1000,
        finalPrice: 800,
        savePct: 20
      });
    });

    it('should handle variant with price only (no discount)', () => {
      const result = resolvePrice(baseProduct, mockVariant);
      
      expect(result).toEqual({
        price: 1200,
        finalPrice: 1200,
        savePct: 0
      });
    });

    it('should handle variant with price and discount', () => {
      const result = resolvePrice(baseProduct, mockVariantWithDiscount);
      
      expect(result).toEqual({
        price: 1200,
        finalPrice: 1000,
        savePct: Math.round(((1200 - 1000) / 1200) * 100)
      });
    });

    it('should fall back to product price when variant has no price', () => {
      const result = resolvePrice(discountProduct, mockVariantNoPrice);
      
      expect(result).toEqual({
        price: 1000,
        finalPrice: 800,  // Uses product discount
        savePct: 20
      });
    });

    it('should add addon prices on top of resolved price', () => {
      const result = resolvePrice(discountProduct, null, mockAddOns);
      
      expect(result).toEqual({
        price: 1000,
        finalPrice: 950, // 800 (discounted) + 100 + 50
        savePct: 20      // Discount % excludes add-ons
      });
    });

    it('should handle variant + add-ons together', () => {
      const result = resolvePrice(baseProduct, mockVariant, mockAddOns);
      
      expect(result).toEqual({
        price: 1200,
        finalPrice: 1350, // 1200 (variant) + 100 + 50
        savePct: 0
      });
    });

    it('should throw error for missing product', () => {
      expect(() => resolvePrice(null)).toThrow('Product is required for price resolution');
    });

    it('should handle invalid discount (higher than price)', () => {
      const invalidProduct = {
        price: 1000,
        discountPrice: 1200 // Invalid: discount higher than price
      };
      
      const result = resolvePrice(invalidProduct);
      
      expect(result).toEqual({
        price: 1000,
        finalPrice: 1000, // Should use original price, not invalid discount
        savePct: 0
      });
    });

    it('should handle add-ons with invalid addon_price values', () => {
      const invalidAddOns = [
        { addon_price: 100 },
        { addon_price: null },
        { addon_price: undefined },
        { addon_price: 'invalid' },
        { addon_price: 50 }
      ];
      
      const result = resolvePrice(baseProduct, null, invalidAddOns);
      
      expect(result).toEqual({
        price: 1000,
        finalPrice: 1150, // 1000 + 100 + 0 + 0 + 0 + 50
        savePct: 0
      });
    });
  });

  describe('resolveProductPricing', () => {
    const productWithVariants = {
      name: 'Multi Variant Product',
      price: 1000,
      discountPrice: 900,
      variants: [
        { color: 'blue', stock: 10, price: 1200, discountPrice: null },
        { color: 'red', stock: 0, price: 1300, discountPrice: null }, // Out of stock
        { color: 'green', stock: 5, price: null, discountPrice: null }, // Uses product price
        { color: 'yellow', stock: 3, price: 800, discountPrice: 700 }
      ],
      toObject: () => productWithVariants
    };

    it('should resolve pricing for product and all in-stock variants', () => {
      const result = resolveProductPricing(productWithVariants);
      
      expect(result.product).toEqual({
        price: 1000,
        finalPrice: 900,
        savePct: 10,
        hasVariants: true,
        variantPriceRange: {
          min: 700, // Cheapest in-stock variant (yellow with discount)
          max: 1200, // Most expensive in-stock variant (blue)
          showFromPrice: true // Prices differ
        }
      });

      expect(result.variants).toHaveLength(3); // Only in-stock variants
      
      // Blue variant
      expect(result.variants[0]).toMatchObject({
        color: 'blue',
        stock: 10,
        index: 0,
        finalPrice: 1200,
        savePct: 0
      });

      // Green variant (uses product pricing)
      expect(result.variants[1]).toMatchObject({
        color: 'green',
        stock: 5,
        index: 2,
        finalPrice: 900, // Uses product discount price
        savePct: 10
      });

      // Yellow variant (with discount)
      expect(result.variants[2]).toMatchObject({
        color: 'yellow',
        stock: 3,
        index: 3,
        finalPrice: 700,
        savePct: Math.round(((800 - 700) / 800) * 100)
      });
    });

    it('should handle product with no variants', () => {
      const noVariantProduct = {
        name: 'Single Product',
        price: 500,
        discountPrice: null,
        variants: []
      };
      
      const result = resolveProductPricing(noVariantProduct);
      
      expect(result.product).toEqual({
        price: 500,
        finalPrice: 500,
        savePct: 0,
        hasVariants: false,
        variantPriceRange: null
      });

      expect(result.variants).toHaveLength(0);
    });

    it('should not show "From" pricing when all variants have same price', () => {
      const samepriceProduct = {
        name: 'Same Price Product',
        price: 1000,
        discountPrice: null,
        variants: [
          { color: 'blue', stock: 10, price: 1000, discountPrice: null },
          { color: 'red', stock: 5, price: 1000, discountPrice: null }
        ],
        toObject: () => samepriceProduct
      };
      
      const result = resolveProductPricing(samepriceProduct);
      
      expect(result.product.variantPriceRange).toEqual({
        min: 1000,
        max: 1000,
        showFromPrice: false // All variants same price
      });
    });

    it('should handle all variants out of stock', () => {
      const outOfStockProduct = {
        name: 'Out of Stock Product',
        price: 1000,
        discountPrice: null,
        variants: [
          { color: 'blue', stock: 0, price: 1200, discountPrice: null },
          { color: 'red', stock: 0, price: 1300, discountPrice: null }
        ],
        toObject: () => outOfStockProduct
      };
      
      const result = resolveProductPricing(outOfStockProduct);
      
      expect(result.product.hasVariants).toBe(false);
      expect(result.product.variantPriceRange).toBe(null);
      expect(result.variants).toHaveLength(0);
    });

    it('should throw error for missing product', () => {
      expect(() => resolveProductPricing(null)).toThrow('Product is required for pricing resolution');
    });
  });
});