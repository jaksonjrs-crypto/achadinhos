import { NextRequest, NextResponse } from "next/server";
import { mlFetch } from "../../../../lib/ml";

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("id") || "").trim().toUpperCase();
    if (!/^ML[A-Z]\d+$/.test(id)) return NextResponse.json({ error: "ID de item inválido." }, { status: 400 });
    const res = await mlFetch(`/items/${encodeURIComponent(id)}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
