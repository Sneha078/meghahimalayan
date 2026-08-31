"""
Main AI shopping assistant engine.

This is a lightweight, API-free assistant that orchestrates
the existing AI services:

    Recommendation
    Semantic Search
    VADER Sentiment Analysis

No Ollama, Anthropic, OpenAI, or other paid LLM is required.
"""

import re

from assistant.intent import (
    detect_intent,
    extract_price,
    extract_product_id,
    extract_color,
    detect_category,
    SEARCH,
    RECOMMEND,
    SIMILAR,
    REVIEW,
    FILTER,
    PRODUCT_INFO,
    HELP,
)

from assistant import tools
from assistant.response import (
    format_help,
    format_product_info,
    format_product_list,
    format_recommendations,
    format_reviews,
    format_similar_products,
)


def _resolve_product_id(message: str) -> str | None:
    """
    Resolve a product ID from a message, either directly (e.g. "W005")
    or by falling back to a product-name search (e.g. "dior scent")
    and taking the top match's real ID.

    Used by intents that need a specific product (SIMILAR, REVIEW) so
    the user doesn't have to already know/type the exact product ID.
    """
    product_id = extract_product_id(message)

    if product_id:
        return product_id

    candidates = tools.search_products(message, top_k=1)

    if candidates:
        return candidates[0].get("id")

    return None


_VAGUE_CHEAP_WORDS = {"cheap", "affordable", "budget", "inexpensive"}


def _is_price_conscious(message: str) -> bool:
    """Return True if the message implies sorting cheap-first."""
    msg = message.lower()
    return (
        any(w in msg for w in _VAGUE_CHEAP_WORDS)
        or extract_price(message) is not None
    )


def _sort_by_price(products: list[dict]) -> list[dict]:
    return sorted(products, key=lambda p: p.get("price") or 0)


class ShoppingAssistant:
    """
    Main shopping assistant.

    Usage:

        assistant = ShoppingAssistant()

        result = assistant.chat(
            "Show me watches under 5000"
        )
    """

    def chat(self, message: str) -> dict:
        """
        Process a user message and return a structured response.
        """

        if not message or not message.strip():
            return {
                "message": "Please tell me what you're looking for.",
                "intent": "unknown",
                "products": [],
            }

        intent = detect_intent(message)

        try:

            # -----------------------------------------
            # HELP
            # -----------------------------------------

            if intent == HELP:
                return {
                    "message": format_help(),
                    "intent": intent,
                    "products": [],
                }

            # -----------------------------------------
            # PRODUCT INFORMATION
            # -----------------------------------------

            if intent == PRODUCT_INFO:

                product_id = extract_product_id(message)

                if not product_id:
                    return {
                        "message": "Please specify a product ID.",
                        "intent": intent,
                        "products": [],
                    }

                product = tools.get_product(product_id)

                return {
                    "message": format_product_info(product),
                    "intent": intent,
                    "product": product,
                    "products": [product] if product else [],
                }

            # -----------------------------------------
            # SIMILAR PRODUCTS
            # -----------------------------------------

            if intent == SIMILAR:

                # Try an explicit ID first (e.g. "similar to W005"),
                # then fall back to resolving a product by name/search
                # (e.g. "similar to dior scent") so the user isn't
                # required to already know the exact product ID.
                product_id = _resolve_product_id(message)

                if not product_id:
                    return {
                        "message": (
                            "I couldn't find a product matching that. "
                            "Try naming the product, or provide a "
                            "product ID, for example W005."
                        ),
                        "intent": intent,
                        "products": [],
                    }

                products = tools.get_similar_products(
                    product_id,
                    top_k=5,
                )

                return {
                    "message": format_similar_products(products),
                    "intent": intent,
                    "products": products,
                }

            # -----------------------------------------
            # RECOMMENDATIONS
            # -----------------------------------------

            if intent == RECOMMEND:

                product_id = extract_product_id(message)
                category   = detect_category(message)
                max_price  = extract_price(message)
                color      = extract_color(message)

                # If the user mentioned a category, price, or colour
                # alongside "suggest/recommend", honour those constraints
                # first. The generic hybrid recommender has no awareness
                # of request context.
                if category or max_price or color:
                    products = tools.filter_products(
                        category=category,
                        max_price=max_price,
                        color=color,
                    )
                    # Sort cheapest-first when the user asked for cheap/affordable
                    if _is_price_conscious(message):
                        products = _sort_by_price(products)
                    products = products[:5]

                    parts = []
                    if color:
                        parts.append(color.lower())
                    if category:
                        parts.append(category)
                    label = " ".join(parts) if parts else "products"

                    if max_price:
                        title = f"Here are some {label} under Rs. {max_price:,.0f}:"
                    else:
                        title = f"Here are some {label} you might like:"

                    return {
                        "message": format_product_list(products, title=title),
                        "intent": intent,
                        "products": products,
                    }

                if product_id:
                    products = tools.get_recommendations(
                        product_id=product_id,
                        top_k=5,
                    )
                else:
                    products = tools.get_recommendations(
                        viewed_product_ids=[],
                        top_k=5,
                    )

                return {
                    "message": format_recommendations(products),
                    "intent": intent,
                    "products": products,
                }

            # -----------------------------------------
            # REVIEWS / SENTIMENT
            # -----------------------------------------

            if intent == REVIEW:

                product_id = extract_product_id(message)

                # Check if explicit product ID is missing
                if not product_id:
                    # Only attempt name-based resolution when the message
                    # likely contains a real product name rather than a
                    # bare pronoun reference ("what do people say about it?").
                    # Pronoun-only queries should prompt the user for a
                    # product ID instead of returning a spurious match.
                    _PRONOUN_ONLY_RE = re.compile(
                        r"\b(it|this|that|them|these|those)\b\s*[?!.]*$",
                        re.IGNORECASE,
                    )
                    if _PRONOUN_ONLY_RE.search(message.strip()):
                        return {
                            "message": (
                                "Please specify a product ID to check reviews."
                            ),
                            "intent": intent,
                            "products": [],
                        }
                    resolved_id = _resolve_product_id(message)
                    if not resolved_id:
                        return {
                            "message": (
                                "Please specify a product ID to check reviews."
                            ),
                            "intent": intent,
                            "products": [],
                        }
                    product_id = resolved_id

                review_data = tools.analyze_product_reviews(
                    product_id
                )

                return {
                    "message": format_reviews(review_data),
                    "intent": intent,
                    "review_analysis": review_data,
                    "products": [],
                }

            # -----------------------------------------
            # PRICE / CATEGORY FILTER
            # -----------------------------------------

            if intent == FILTER:

                max_price = extract_price(message)
                category  = detect_category(message)
                color     = extract_color(message)

                # "cheap" / "affordable" / "budget" trigger FILTER but
                # contain no numeric price. Apply a reasonable ceiling so
                # the query isn't completely unfiltered.
                if max_price is None and any(w in message.lower() for w in _VAGUE_CHEAP_WORDS):
                    max_price = 10000  # Rs. 10,000 default ceiling

                products = tools.filter_products(
                    category=category,
                    max_price=max_price,
                    color=color,
                )

                # Sort cheapest-first when the user asked for cheap/affordable
                # or specified a max price (implies budget consciousness)
                if _is_price_conscious(message):
                    products = _sort_by_price(products)

                products = products[:5]

                # Build a descriptive title
                parts = []
                if color:
                    parts.append(color.lower())
                if category:
                    parts.append(category)
                label = " ".join(parts) if parts else "products"

                if max_price:
                    title = f"Here are some {label} under Rs. {max_price:,.0f}:"
                else:
                    title = f"Here are some {label} matching your filters:"

                return {
                    "message": format_product_list(
                        products,
                        title=title,
                    ),
                    "intent": intent,
                    "products": products,
                }

            # -----------------------------------------
            # GENERAL SEARCH
            # -----------------------------------------

            products = tools.search_products(
                message,
                top_k=5,
            )

            return {
                "message": format_product_list(
                    products,
                    title="Here are some products matching your search:",
                ),
                "intent": SEARCH,
                "products": products,
            }

        except Exception as exc:

            return {
                "message": (
                    "Sorry, I couldn't process that request right now."
                ),
                "intent": intent,
                "products": [],
                "error": str(exc),
            }


# Shared assistant instance
assistant = ShoppingAssistant()