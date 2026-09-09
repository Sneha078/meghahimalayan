const AI_API_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:8000";

/** 
 * Fetch autocomplete suggstions.
 * @param {string} query
 * @returns {Promise<Object>}
 */

export async function fetchAutocomplete(query) {
    const trimmedQuery = query.trim();

    if(!trimmedQuery) {
        return {
            success: true,
            query: "",
            suggestions: [],
        }
    }

    const response = await fetch(
            `${AI_API_URL}/search/autocomplete?q=${encodeURIComponent(trimmedQuery)}`
    )
    if (!response.ok) {
        throw new Error(`Autocomplete request failed: ${response.status}`)
    }
    return response.json()
}

/**
 * Fetch full hybrid search results.
 * @param {string} query
 * @param {number} topK
 * @returns {Promise>Object>}
 */

export async function fetchSearchResults(query, topK = 5) {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
        return {
            success: true,
            query: "",
            results: [],
            count: 0,
        }
    }

    const params = new URLSearchParams({
        q: trimmedQuery,
        top_k: String(topK),
    })

    const response= await fetch(
        `${AI_API_URL}/search?${params.toString()}`
    )

    if(!response.ok) {
        throw new Error(`Search request failed: ${response.status}`)
    }

    return response.json();
}