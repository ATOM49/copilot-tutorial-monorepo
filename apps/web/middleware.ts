import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only set if missing (so you can later replace with real auth)
  if (!req.cookies.get("copilot_auth")) {
    res.cookies.set(
      "copilot_auth",
      JSON.stringify({
        userId: "dev-user",
        tenantId: "dev-tenant",
        roles: ["admin"],
      }),
      {
        path: "/",
        sameSite: "lax",
        // For the stub, keep it readable. For real auth, make it httpOnly + secure.
        httpOnly: false,
      }
    );
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
