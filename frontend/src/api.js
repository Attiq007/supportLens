const BASE = "/api";

export async function sendChat(message) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

export async function createTrace(user_message, bot_response, response_time_ms) {
  const res = await fetch(`${BASE}/traces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_message, bot_response, response_time_ms }),
  });
  if (!res.ok) throw new Error("Failed to save trace");
  return res.json();
}

export async function fetchTraces(category = null, search = null) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  const qs = params.toString();
  const res = await fetch(`${BASE}/traces${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch traces");
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${BASE}/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export function exportTracesUrl(category = null) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const qs = params.toString();
  return `${BASE}/traces/export${qs ? `?${qs}` : ""}`;
}
