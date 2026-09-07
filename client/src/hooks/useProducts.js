// src/hooks/useProducts.js
import { useEffect, useState } from "react";
import { getProducts } from "../api/productClient";

/**
 * Fetches products from the real backend.
 * Usage: const { products, loading, error } = useProducts({ category: "watches" })
 */
export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [productcount, setProductCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts(params);
        if (!cancelled) {
          setProducts(data.products || [])
          setProductCount(data.productcount ?? 0)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { products, productcount, totalPages, loading, error };
}