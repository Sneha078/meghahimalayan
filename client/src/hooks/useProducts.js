// src/hooks/useProducts.js
import { useEffect, useState, useMemo } from "react";
import { getProducts } from "../api/productClient";

/**
 * Fetches products from the real backend.
 * Usage: const { products, loading, error } = useProducts({ category: "watches" })
 */
export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [productCount, setProductCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the params to prevent unnecessary API calls
  // Only changes when the actual values change, not when a new object is created
  const memoizedParams = useMemo(() => params, [
    params.category,
    params.gender, 
    params.brand,
    params.subcategory,
    params.minPrice,
    params.maxPrice,
    params.discount,
    params.sort,
    params.limit,
    params.page,
    params.keyword
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts(memoizedParams);
        if (!cancelled) {
          setProducts(data.products || [])
          setProductCount(data.productCount ?? 0)
          setTotalPages(data.totalPages ?? 1 )}
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [memoizedParams]);

  return { products, productCount, totalPages, loading, error };
}