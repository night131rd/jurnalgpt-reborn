export const runtime = "nodejs";

export async function GET() {
  return new Response(
    JSON.stringify({
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
