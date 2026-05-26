import { NextResponse } from "next/server";

const INTERNAL_TOKEN_COOKIE = "internal_ops_token";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(INTERNAL_TOKEN_COOKIE);
  return response;
}
