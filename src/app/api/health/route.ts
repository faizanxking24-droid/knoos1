export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    runtimeMarker: "cart-runtime-diag-104e1da-v1",
  });
}
