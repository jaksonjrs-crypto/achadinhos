import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT external_user_id, expires_at, scopes, updated_at
      FROM marketplace_connections
      WHERE marketplace='mercadolivre'
      ORDER BY updated_at DESC LIMIT 1
    `;
    if (!rows[0]) return NextResponse.json({ connected: false });
    return NextResponse.json({ connected: true, ...rows[0] });
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e?.message }, { status: 500 });
  }
}
