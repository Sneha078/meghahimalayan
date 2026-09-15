const BASE = "/api/v1/rewards";

export async function getBalance() {
  const res = await fetch(`${BASE}/balance`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Could not fetch balance");
  }

  return data;
}

export async function getCatalog(maxPoints) {
  const query = maxPoints ? `?maxPoints=${maxPoints}` : "";

  const res = await fetch(`${BASE}/catalog${query}`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Could not fetch rewards catalog");
  }

  return data;
}

// shippingInfo is required now — redeeming creates a real Order that needs
// a delivery address, same shape checkout uses:
// { name, address, city, state, pincode, phoneNo }
export async function redeemProduct(productId, shippingInfo) {
  const res = await fetch(`${BASE}/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ productId, shippingInfo }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Redemption failed");
  }

  // Now returns { success, message, order, balance } — RewardsPage.jsx
  // uses data.order to show the order number after a successful redeem.
  return data;
}

export async function getRedeemPreview(points, subtotal) {
  const res = await fetch(
    `${BASE}/redeem-preview?points=${points}&subtotal=${subtotal}`,
    {
      credentials: "include",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Could not calculate discount");
  }

  return data;
}

export async function getHistory(type) {
  const query = type && type !== "all" ? `?type=${type}` : "";

  const res = await fetch(`${BASE}/history${query}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Could not fetch history");
  }

  return data;
}