from shared import product_service


class Autocomplete:
    """
    Fast prefix-based autocomplete.
    """

    def __init__(self):
        self.suggestions: list[str] = []
        self._built = False

    def _build(self) -> None:
        products = product_service.get_all_products()

        values = set()

        for product in products:
            name = str(product.get("name", "")).strip()
            brand = str(product.get("brand", "")).strip()

            if name:
                values.add(name)

            if brand:
                values.add(brand)

        self.suggestions = sorted(
            values,
            key=lambda value: value.lower(),
        )

        self._built = True

    def search(
        self,
        query: str,
        limit: int = 8,
    ) -> list[str]:
        if not self._built:
            self._build()

        query = query.strip().lower()

        if not query:
            return []

        matches = [
            suggestion
            for suggestion in self.suggestions
            if suggestion.lower().startswith(query)
        ]

        return matches[:limit]

    def rebuild(self) -> None:
        """
        Rebuild suggestions after products are added/updated.
        """
        self._build()