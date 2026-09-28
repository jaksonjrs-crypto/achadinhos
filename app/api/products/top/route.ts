import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT external_id, title, permalink, thumbnail, price, original_price,
             currency_id, opportunity_score, updated_at
      FROM products
      WHERE marketplace='mercadolivre'
      ORDER BY opportunity_score DESC, updated_at DESC
      LIMIT 30
    `;
    return NextResponse.json({ products: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
