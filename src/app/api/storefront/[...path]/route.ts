import { NextRequest, NextResponse } from "next/server";

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (path.some(seg => seg === ".." || seg === "." || seg.includes("/") || seg.includes("\\"))) {
    return NextResponse.json({ message: "Bad path" }, { status: 400 });
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  let upstream: Response;
  try {
    upstream = await fetch(
      `${process.env.API_URL}/storefront/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`,
      { method: req.method, headers, body: hasBody ? await req.arrayBuffer() : undefined, cache: "no-store" },
    );
  } catch {
    return NextResponse.json({ message: "Cannot reach the server" }, { status: 502 });
  }

  const resHeaders = new Headers();
  resHeaders.set("content-type", upstream.headers.get("content-type") ?? "application/json");

  // Forward Set-Cookie headers so the browser stores the customer session cookie
  const setCookies = typeof upstream.headers.getSetCookie === "function"
    ? upstream.headers.getSetCookie()
    : upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie")!] : [];
  for (const c of setCookies) resHeaders.append("set-cookie", c);

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: resHeaders,
  });
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
