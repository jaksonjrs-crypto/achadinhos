import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, saveConnection } from "../../../../../lib/ml";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const expectedState = req.cookies.get("ml_oauth_state")?.value;

    if (!code) return NextResponse.json({ error: "code ausente" }, { status: 400 });
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.json({ error: "state OAuth inválido" }, { status: 400 });
    }

    const tokens = await exchangeCode(code);
    await saveConnection(tokens);

    const url = new URL("/settings?ml=connected", req.url);
    const response = NextResponse.redirect(url);
    response.cookies.delete("ml_oauth_state");
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha no callback OAuth" }, { status: 500 });
  }
}
