import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, title, category, marketplace, image_url, price, original_price, affiliate_url 
      FROM offers 
      WHERE status='published' 
      ORDER BY id DESC 
      LIMIT 200
    `;
    return NextResponse.json(rows, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}
