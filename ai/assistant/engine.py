"""
Main AI shopping assistant engine.

This is a lightweight, API-free assistant that orchestrates
the existing AI services:

    Recommendation
    Semantic Search
    VADER Sentiment Analysis


No Ollama, Anthropic, OpenAI, or other paid LLM is required.
"""

from assistant.intent import (
    detect_intent,
    extract_price,
    extract_product_id,
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
                        "message": "Please provide a product ID.",
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

                # Same fallback as SIMILAR: allow "reviews for dior
                # scent" without requiring an exact product ID.
                product_id = _resolve_product_id(message)

                if not product_id:
                    return {
                        "message": (
                            "I couldn't find a product matching that. "
                            "Try naming the product, or provide a "
                            "product ID, for example P006."
                        ),
                        "intent": intent,
                        "products": [],
                    }

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
                category = detect_category(message)

                products = tools.filter_products(
                    category=category,
                    max_price=max_price,
                )

                products = products[:5]

                if max_price:
                    title = (
                        f"Here are some products"
                        f"{' in the ' + category + ' category' if category else ''}"
                        f" under Rs. {max_price:,.0f}:"
                    )
                else:
                    title = "Here are some products matching your filters:"

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