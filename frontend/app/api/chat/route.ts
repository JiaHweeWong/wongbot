import type { NextRequest } from "next/server";

const BACKEND_URL = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";
  const body = await request.text();

  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": clientIp,
    },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
