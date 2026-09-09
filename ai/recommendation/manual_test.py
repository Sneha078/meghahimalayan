from recommendation.engine import recommendation_engine

product_id = input("Enter product ID: ")

results = recommendation_engine.get_similar_products(
    product_id=product_id,
    top_k=5
)

print(f"\nRecommended products for {product_id}:")

if not results:
    print("No recommendations found.")
else:
    for i, product in enumerate(results, 1):
        print(
            f"{i}. {product['name']} "
            f"({product['category']}) "
            f"- Score: {product['score']}"
        )