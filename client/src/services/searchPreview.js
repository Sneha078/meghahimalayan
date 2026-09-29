// src/services/searchPreview.js
//
// One place that decides where navbar / search-page results come from.
//
//  - Half-typed queries ("cont", "conta")  -> Express keyword search
//    (substring match, so it only returns products that really contain it)
//  - Full words ("contact", "acuvue")      -> AI search, but weak matches
//    are dropped; if nothing survives, fall back to the keyword search
//
// Results are always returned in the AI-service shape
// ({ id, name, brand, price, image_url, ... }) so SearchResultRow and the
// search results page can render them without changes.

import { fetchSearchResults } from "./searchClient";
import { getProducts } from "../api/productClient";

// Tune this: search a few queries you know are good matches and log
// r.similarity_score, then set the cutoff just below the lowest good score.
const MIN_SIMILARITY = 0.25;

// Queries shorter than this are treated as "still typing".
const SHORT_QUERY_LENGTH = 5;

function fromCatalogProduct(p) {
  return {
    id: p.id ?? p._id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.discountPrice ?? p.price,
    rating: p.ratings ?? 0,
    image_url: p.image?.[0]?.url ?? "",
  };
}

async function keywordSearch(query, limit) {
  const { products } = await getProducts({ keyword: query, limit });
  return products.map(fromCatalogProduct);
}

export async function fetchSearchPreview(rawQuery, limit = 5) {
  const query = rawQuery.trim();
  if (!query) return [];

  if (query.length < SHORT_QUERY_LENGTH) {
    try {
      return await keywordSearch(query, limit);
    } catch (err) {
      console.error("Keyword search failed:", err);
      // fall through to the AI search
    }
  }

  let aiResults = [];
  try {
    const data = await fetchSearchResults(query, limit);
    aiResults = (data.results ?? []).filter(
      (r) => r.similarity_score == null || r.similarity_score >= MIN_SIMILARITY
    );
  } catch (err) {
    console.error("AI search failed:", err);
  }

  if (aiResults.length > 0) return aiResults;

  try {
    return await keywordSearch(query, limit);
  } catch (err) {
    console.error("Keyword fallback failed:", err);
    return [];
  }
}