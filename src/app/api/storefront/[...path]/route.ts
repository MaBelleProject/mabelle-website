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

  let upstream: Response;
  try {
    upstream = await fetch(
      `${process.env.API_URL}/storefront/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`,
      { method: req.method, headers, body: hasBody ? await req.arrayBuffer() : undefined, cache: "no-store" },
    );
  } catch {
    return NextResponse.json({ message: "Cannot reach the server" }, { status: 502 });
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
