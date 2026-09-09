"""
Response formatting for the shopping assistant.

No LLM is used here. Responses are generated from structured
product/service results.
"""


def format_product(product: dict) -> str:
    """Format one product for display."""

    name = product.get("name", "Unknown product")
    category = product.get("category", "")
    brand = product.get("brand") or ""
    price = product.get("price")

    parts = [name]

    if brand:
        parts.append(f"by {brand}")

    if category:
        parts.append(f"({category})")

    if price is not None:
        parts.append(f"- Rs. {price:,.0f}")

    return " ".join(parts)


def format_product_list(
    products: list[dict],
    title: str = "Here are some products I found:",
) -> str:

    if not products:
        return (
            "I couldn't find any matching products. "
            "Try changing your search or budget."
        )

    lines = [title, ""]

    for index, product in enumerate(products, start=1):
        lines.append(
            f"{index}. {format_product(product)}"
        )

    return "\n".join(lines)


def format_recommendations(
    products: list[dict],
) -> str:

    if not products:
        return (
            "I don't have enough information to make a recommendation yet."
        )

    return format_product_list(
        products,
        title="Based on your request, you might like:",
    )


def format_similar_products(
    products: list[dict],
) -> str:

    if not products:
        return "I couldn't find similar products."

    return format_product_list(
        products,
        title="Here are some products similar to it:",
    )


def format_product_info(
    product: dict | None,
) -> str:

    if not product:
        return "I couldn't find that product."

    name = product.get("name", "Unknown")
    description = product.get("description") or "No description available."
    price = product.get("price")
    rating = product.get("rating")

    response = [
        f"**{name}**",
        "",
        description,
    ]

    if price is not None:
        response.append(f"\nPrice: Rs. {price:,.0f}")

    if rating is not None:
        response.append(f"Rating: {rating}/5")

    return "\n".join(response)


def format_reviews(review_data: dict) -> str:

    if review_data["review_count"] == 0:
        return "There are no reviews for this product yet."

    sentiment = review_data["overall_sentiment"]
    count = review_data["review_count"]

    response = [
        f"I found {count} review(s).",
        f"Overall customer sentiment: **{sentiment}**.",
    ]

    average = review_data.get("average_compound")

    if average is not None:
        response.append(
            f"Average sentiment score: {average}"
        )

    response.append("")

    for review in review_data["reviews"]:
        response.append(
            f"- {review['user_name']} "
            f"({review['rating']}/5): "
            f"{review['sentiment']}"
        )

    return "\n".join(response)


def format_help() -> str:

    return """
Hi! 👋 I'm your shopping assistant.

I can help you with:

• 🔎 Finding products
• ✨ Recommending products
• 🔄 Finding products similar to another product
• 💰 Finding products within a budget
• ⭐ Checking customer reviews
• 🧴 Finding perfumes and fragrances
• ⌚ Finding watches
• 👓 Finding eyeglasses

Try asking:

"Show me watches under 5000"

"Find a fresh perfume for summer"

"Recommend something similar"

"What do people say about this product?"
""".strip()