import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const origin = req.headers.get("origin") || req.nextUrl.origin;
  const res = await fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/vtc-reservation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, base_url: origin }),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ success: false, error: `n8n error (${res.status}): ${text.slice(0, 200)}` }, { status: 500 });
  }
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
