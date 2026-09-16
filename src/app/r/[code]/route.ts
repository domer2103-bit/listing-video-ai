import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "lva_ref";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

/** Referral entry point — does no lookup itself. Just remembers the code in
 * a cookie so that whichever flow the visitor actually signs up through
 * (quick-generate or chat) can attribute the new account, without needing
 * this route to know anything about users or plans. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const response = NextResponse.redirect(new URL("/", request.url), 308);
  response.cookies.set(COOKIE_NAME, code, {
    maxAge: COOKIE_MAX_AGE_SEC,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
