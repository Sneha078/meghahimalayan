import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { useAuth } from "./AuthContext";

import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  clearCartApi,
  applyCoupon as apiApplyCoupon,
  removeCoupon as apiRemoveCoupon,
} from "../api/cartClient";

const CartContext = createContext();

const GUEST_CART_KEY = "guest_cart";

function normalizeCartItem(item) {
  const product = item.product ?? {};

  return {
    id: item._id,
    productId: product._id ?? item.product,
    name: product.name ?? "",
    slug: product.slug ?? "",
    brand: product.brand ?? "",
    image: product.image ?? [],
    price: item.price ?? product.discountPrice ?? product.price ?? 0,
    originalPrice: product.price ?? item.price ?? 0,
    quantity: item.quantity ?? 1,
    category: product.category ?? "",
    stock: product.stock ?? 0,
    prescription: item.prescription ?? null,
    variant: item.variant ?? null,
  };
}

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function mergeGuestIntoBackend(guestItems) {
  const seen = new Map();

  for (const item of guestItems) {
    const pid = item.productId ?? item.id;
    const prescriptionKey = item.prescription ? JSON.stringify(item.prescription) : 'no_prescription';
    const variantKey = item.variant ? JSON.stringify(item.variant) : 'no_variant';
    const uniqueKey = `${pid}_${prescriptionKey}_${variantKey}`;

    if (seen.has(uniqueKey)) {
      seen.get(uniqueKey).quantity += item.quantity;
    } else {
      seen.set(uniqueKey, {
        productId: pid,
        quantity: item.quantity,
        prescription: item.prescription,
        variant: item.variant,
      });
    }
  }

  return Array.from(seen.values());
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Pull the full cart from the backend and reflect it in state.
   */
  const syncCart = useCallback(async () => {
    try {
      const data = await getCart();
      const cart = data.cart ?? {};

      setCartItems(
        (cart.items ?? []).map(normalizeCartItem)
      );

      setCouponCode(cart.couponCode ?? "");
      setDiscount(cart.discount ?? 0);
    } catch (err) {
      console.error("Failed to sync cart", err);
    }
  }, []);

  /**
   * Load cart when auth state changes.
   */
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setLoading(true);

      const guestItems = loadGuestCart();

      const sync = async () => {
        try {
          if (guestItems.length > 0) {
            const merged = mergeGuestIntoBackend(guestItems);

            localStorage.removeItem(GUEST_CART_KEY);

            await Promise.all(
              merged.map((item) =>
                apiAddToCart(
                  item.productId,
                  item.quantity,
                  item.prescription,
                  item.variant
                ).catch(() => {})
              )
            );
          }

          await syncCart();
        } catch (err) {
          console.error("Failed to load cart", err);

          const data = await getCart().catch(() => ({
            cart: {},
          }));

          const cart = data.cart ?? {};

          setCartItems(
            (cart.items ?? []).map(normalizeCartItem)
          );

          setCouponCode(cart.couponCode ?? "");
          setDiscount(cart.discount ?? 0);
        } finally {
          setLoading(false);
        }
      };

      sync();
    } else {
      setCartItems(loadGuestCart());

      setCouponCode("");
      setDiscount(0);

      setLoading(false);
    }
  }, [user, authLoading, syncCart]);

  // --------------------------------------------------
  // Guest cart helpers
  // --------------------------------------------------

  const addItemGuest = useCallback((product, qty = 1, prescription = undefined, variant = undefined) => {
    const quantity = Number(qty) || product.quantity || 1;
    const productId = product.id ?? product._id;
    const itemPrescription = prescription ?? product.prescription ?? null;
    const itemVariant = variant ?? product.selectedVariant ?? null;

    setCartItems((prev) => {
      // If prescription data or variant is attached, don't merge - create separate line
      const existing = !itemPrescription && !itemVariant
        ? prev.find((item) => (item.productId ?? item.id) === productId && !item.prescription && !item.variant)
        : null;

      let next;

      if (existing) {
        next = prev.map((item) =>
          (item.productId ?? item.id) === productId && !item.prescription && !item.variant
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      } else {
        const uniqueGuestId = itemPrescription || itemVariant ? `${productId}_${Date.now()}` : productId;
        next = [
          ...prev,
          {
            id: uniqueGuestId,
            productId,
            name: product.name ?? "",
            slug: product.slug ?? "",
            brand: product.brand ?? "",
            image: product.image ?? [],
            price:
              product.discountPrice ??
              product.price ??
              0,
            originalPrice: product.price ?? 0,
            quantity,
            category: product.category ?? "",
            stock: product.stock ?? 0,
            prescription: itemPrescription,
            variant: itemVariant,
          },
        ];
      }

      saveGuestCart(next);

      return next;
    });
  }, []);

  const addItemAuth = useCallback(
    async (product, qty = 1, prescription = undefined, variant = undefined) => {
      const productId = product.id ?? product._id;
      const quantity = Number(qty) || product.quantity || 1;
      const itemPrescription = prescription ?? product.prescription ?? undefined;
      const itemVariant = variant ?? product.selectedVariant ?? undefined

      try {
        await apiAddToCart(productId, quantity, itemPrescription, itemVariant);
      } catch (err) {
        console.error("Failed to add to cart", err);
        throw err;
      }

      await syncCart();
    },
    [syncCart]
  );

  const addItem = useCallback(
    (product, qtyOrPrescription = 1, maybePrescription = undefined, maybeVariant = undefined) => {
      let quantity = 1;
      let prescription = undefined;

      if (typeof qtyOrPrescription === 'number') {
        quantity = qtyOrPrescription;
        prescription = maybePrescription;
      } else if (typeof qtyOrPrescription === 'object' && qtyOrPrescription !== null) {
        prescription = qtyOrPrescription;
        quantity = Number(maybePrescription) || product.quantity || 1;
      } else {
        quantity = product.quantity || 1;
        prescription = product.prescription;
      }

      if (user) {
        return addItemAuth(product, quantity, prescription, maybeVariant);
      }

      return addItemGuest(product, quantity, prescription, maybeVariant);
    },
    [user, addItemAuth, addItemGuest]
  );

  // --------------------------------------------------
  // Update quantity
  // --------------------------------------------------

  const updateQuantity = useCallback(
    async (id, delta) => {
      if (user) {
        const item = cartItems.find(
          (i) => i.id === id
        );

        if (!item) return;

        const newQuantity = item.quantity + delta;

        try {
          if (newQuantity < 1) {
            await apiRemoveCartItem(id);
          } else {
            await apiUpdateCartItem(id, newQuantity);
          }
        } catch (err) {
          console.error(
            "Failed to update cart",
            err
          );
        }

        await syncCart();
      } else {
        setCartItems((prev) => {
          const next = prev
            .map((item) =>
              item.id === id
                ? {
                    ...item,
                    quantity: Math.max(
                      0,
                      item.quantity + delta
                    ),
                  }
                : item
            )
            .filter(
              (item) => item.quantity > 0
            );

          saveGuestCart(next);

          return next;
        });
      }
    },
    [user, cartItems, syncCart]
  );

  // --------------------------------------------------
  // Remove item
  // --------------------------------------------------

  const removeItem = useCallback(
    async (id) => {
      if (user) {
        try {
          await apiRemoveCartItem(id);
        } catch (err) {
          console.error(
            "Failed to remove item",
            err
          );
        }

        await syncCart();
      } else {
        setCartItems((prev) => {
          const next = prev.filter(
            (item) => item.id !== id
          );

          saveGuestCart(next);

          return next;
        });
      }
    },
    [user, syncCart]
  );

  // --------------------------------------------------
  // Clear cart
  // --------------------------------------------------

  const clearCart = useCallback(async () => {
    if (user) {
      try {
        await clearCartApi();
      } catch (err) {
        console.error(
          "Failed to clear cart",
          err
        );
      }

      await syncCart();
    } else {
      setCartItems([]);
      setCouponCode("");
      setDiscount(0);

      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [user, syncCart]);

  // --------------------------------------------------
  // Coupon
  // --------------------------------------------------

  const applyCoupon = useCallback(
    async (code) => {
      if (!user) {
        throw new Error(
          "Login to apply coupons"
        );
      }

      const data = await apiApplyCoupon(code);

      await syncCart();

      return data;
    },
    [user, syncCart]
  );

  const removeCoupon = useCallback(
    async () => {
      if (!user) return;

      await apiRemoveCoupon();

      await syncCart();
    },
    [user, syncCart]
  );

  // --------------------------------------------------
  // Computed values (memoized to prevent unnecessary re-renders)
  // --------------------------------------------------

  const subtotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const totalItems = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const discounted = useMemo(() => 
    Math.max(0, subtotal - discount),
    [subtotal, discount]
  );

  // Memoize provider value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
    couponCode,
    discount,
    discounted,
    applyCoupon,
    removeCoupon,
    loading,
  }), [
    cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
    couponCode,
    discount,
    discounted,
    applyCoupon,
    removeCoupon,
    loading,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}