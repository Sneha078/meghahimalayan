const STORAGE_KEY = "recentlyViewed";
const MAX_ITEMS = 8;

/**
 * Call this from your ProductDetails page (on mount) to log a view:
 *   import { trackProductView } from "../utils/recentlyViewed";
 *   useEffect(() => { trackProductView(product._id); }, [product._id]);
 */
export function trackProductView(productId) {
  if (!productId) return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = [productId, ...existing.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail silently
  }
}

export function getRecentlyViewedIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}