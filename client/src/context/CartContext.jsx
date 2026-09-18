import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
const POINTS_REDEMPTION_KEY = "cart_points_redemption";

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

    if (seen.has(pid)) {
      seen.get(pid).quantity += item.quantity;
    } else {
      seen.set(pid, {
        productId: pid,
        quantity: item.quantity,
      });
    }
  }

  return Array.from(seen.values());
}

/**
 * Points redemption is kept in CartContext so Cart and Checkout
 * share the exact same selection.
 */
function loadPointsRedemption() {
  try {
    const raw = localStorage.getItem(POINTS_REDEMPTION_KEY);

    if (!raw) {
      return {
        pointsUsed: 0,
        pointsDiscount: 0,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      pointsUsed: Number(parsed.pointsUsed) || 0,
      pointsDiscount: Number(parsed.pointsDiscount) || 0,
    };
  } catch {
    return {
      pointsUsed: 0,
      pointsDiscount: 0,
    };
  }
}

function savePointsRedemption(pointsUsed, pointsDiscount) {
  localStorage.setItem(
    POINTS_REDEMPTION_KEY,
    JSON.stringify({
      pointsUsed: Number(pointsUsed) || 0,
      pointsDiscount: Number(pointsDiscount) || 0,
    })
  );
}

function removeSavedPointsRedemption() {
  localStorage.removeItem(POINTS_REDEMPTION_KEY);
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [cartItems, setCartItems] = useState([]);

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  /*
   * Shared points state
   *
   * Cart and Checkout both use these values.
   */
  const savedPoints = loadPointsRedemption();

  const [pointsUsed, setPointsUsedState] = useState(
    savedPoints.pointsUsed
  );

  const [pointsDiscount, setPointsDiscountState] = useState(
    savedPoints.pointsDiscount
  );

  const [loading, setLoading] = useState(false);

  /**
   * Update points redemption.
   *
   * This is the function Cart / PointsRedeemBox should call.
   */
  const setPointsRedemption = useCallback((points, pointsDisc) => {
    const safePoints = Number(points) || 0;
    const safeDiscount = Number(pointsDisc) || 0;

    setPointsUsedState(safePoints);
    setPointsDiscountState(safeDiscount);

    savePointsRedemption(safePoints, safeDiscount);
  }, []);

  /**
   * Clear points redemption.
   */
  const clearPointsRedemption = useCallback(() => {
    setPointsUsedState(0);
    setPointsDiscountState(0);
    removeSavedPointsRedemption();
  }, []);

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
                  item.quantity
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

      /*
       * Points are only available for logged-in users.
       * Clear them when there is no authenticated user.
       */
      setPointsUsedState(0);
      setPointsDiscountState(0);
      clearPointsRedemption();

      setLoading(false);
    }
  }, [user, authLoading, syncCart]);

  // --------------------------------------------------
  // Guest cart helpers
  // --------------------------------------------------

  const addItemGuest = useCallback((product) => {
    const quantity = product.quantity ?? 1;
    const productId = product.id ?? product._id;

    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          (item.productId ?? item.id) === productId
      );

      let next;

      if (existing) {
        next = prev.map((item) =>
          (item.productId ?? item.id) === productId
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      } else {
        next = [
          ...prev,
          {
            id: productId,
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
          },
        ];
      }

      saveGuestCart(next);

      return next;
    });
  }, []);

  const addItemAuth = useCallback(
    async (product) => {
      const productId = product.id ?? product._id;
      const quantity = product.quantity ?? 1;

      try {
        await apiAddToCart(productId, quantity);
      } catch (err) {
        console.error("Failed to add to cart", err);
      }

      await syncCart();
    },
    [syncCart]
  );

  const addItem = useCallback(
    (product) => {
      if (user) {
        return addItemAuth(product);
      }

      addItemGuest(product);
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

    /*
     * Points should not survive after the cart is cleared.
     */
    setPointsUsedState(0);
    setPointsDiscountState(0);
    clearPointsRedemption();
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
  // Computed values
  // --------------------------------------------------

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const discounted = Math.max(
    0,
    subtotal - discount
  );

  const totalPrice = Math.max(
    0,
    discounted - pointsDiscount
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,

        addItem,
        updateQuantity,
        removeItem,
        clearCart,

        subtotal,
        totalItems,

        couponCode,
        discount,

        /*
         * Shared points values
         */
        pointsUsed,
        pointsDiscount,
        setPointsRedemption,
        clearPointsRedemption,

        discounted,
        totalPrice,

        applyCoupon,
        removeCoupon,

        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}