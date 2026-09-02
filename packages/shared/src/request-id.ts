/** Request correlation ids. Every API response carries one (X-Request-Id). */

export function newRequestId(): string {
  // randomUUID is available in Node 22 and the edge/web runtime.
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `req_${uuid.replace(/-/g, "").slice(0, 24)}`;
}

export const REQUEST_ID_HEADER = "x-request-id";
