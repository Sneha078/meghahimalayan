"""
Shared helper utilities used by AI engines.
"""


def build_product_text(product: dict) -> str:
    """
    Build a textual representation of a MegaHimalayan product.

    Uses only attributes that exist in the Product Mongoose schema.
    """

    fields = [
        # ----------------------------------------------------
        # Common product attributes
        # ----------------------------------------------------

        product.get("name"),
        product.get("category"),
        product.get("brand"),
        product.get("subcategory"),
        product.get("gender"),
        product.get("description"),

        # ----------------------------------------------------
        # Eyeglasses
        # ----------------------------------------------------

        product.get("frameShape"),
        product.get("frameMaterial"),
        product.get("frameColor"),
        product.get("lensType"),

        # ----------------------------------------------------
        # Watches
        # ----------------------------------------------------

        product.get("watchType"),
        product.get("dialColor"),
        product.get("strapMaterial"),
        product.get("caseSize"),
        product.get("movementType"),
        product.get("waterResistance"),

        # ----------------------------------------------------
        # Perfumes
        # ----------------------------------------------------

        product.get("fragranceFamily"),
        product.get("fragranceType"),
        product.get("volume"),
    ]

    return " ".join(
        str(field)
        for field in fields
        if field not in (None, "")
    ).strip()


def safe_round(
    value,
    digits: int = 4,
) -> float:
    """
    Safely round a numeric value.
    """

    try:
        return round(
            float(value),
            digits,
        )

    except (TypeError, ValueError):
        return 0.0