import { NextRequest } from "next/server";

// A tiny 1x1 transparent PNG (base64) used as a safe placeholder for broken images.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAF6Xx9kAAAAASUVORK5CYII=";

export async function GET(_: NextRequest) {
  const buf = Buffer.from(PNG_BASE64, "base64");
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
