"""
Interactive terminal chat with the ShoppingAssistant.

Lets you manually test intent detection, product search, recommendations,
reviews, etc. against your REAL MongoDB Atlas data (not mocked) -- useful
for sanity-checking behavior beyond what the pytest suite covers.

Usage (from the `ai` project root, with venv activated):
    python scripts/chat_cli.py

Type 'exit' or 'quit' to stop. Type 'raw' to toggle showing the full
JSON response instead of just the message.
"""

import json
import sys
from pathlib import Path

# Make the project root (parent of this scripts/ folder) importable,
# so `from assistant.engine import ...` works regardless of which
# directory this script is launched from.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from assistant.engine import ShoppingAssistant


def main():
    print("=" * 60)
    print("  MegaHimalayan Shopping Assistant -- terminal test mode")
    print("=" * 60)
    print("Type a message and press Enter.")
    print("Commands: 'exit' / 'quit' to stop, 'raw' to toggle full JSON output.\n")

    assistant = ShoppingAssistant()
    show_raw = False

    while True:
        try:
            text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            sys.exit(0)

        if not text:
            continue

        if text.lower() in ("exit", "quit"):
            print("Bye!")
            break

        if text.lower() == "raw":
            show_raw = not show_raw
            print(f"[raw JSON output: {'ON' if show_raw else 'OFF'}]\n")
            continue

        result = assistant.chat(text)

        if show_raw:
            print(json.dumps(result, indent=2, default=str))
        else:
            print(f"\nIntent: {result.get('intent')}")
            print(f"Bot: {result.get('message')}\n")

            products = result.get("products") or []
            if products:
                print(f"({len(products)} product(s) returned)")
                for p in products:
                    name = p.get("name", "?")
                    price = p.get("price", "?")
                    print(f"  - {name} (Rs {price})")
                print()

            if "error" in result:
                print(f"[error]: {result['error']}\n")


if __name__ == "__main__":
    main()