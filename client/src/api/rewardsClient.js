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

export async function redeemProduct(productId) {
  const res = await fetch(`${BASE}/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ productId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Redemption failed");
  }

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