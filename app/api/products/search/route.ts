import { NextRequest, NextResponse } from "next/server";
import { mlFetch, SITE_ID } from "../../../../lib/ml";
import { opportunityScore } from "../../../../lib/score";
import { assertSafeQuery } from "../../../../lib/safety";
import { db } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json({ error: "Informe ao menos 2 caracteres." }, { status: 400 });
    assertSafeQuery(q);

    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20)));
    const url = `/sites/${encodeURIComponent(SITE_ID)}/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    const res = await mlFetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const upstream = {
        status: res.status,
        error: typeof data?.error === "string" ? data.error : null,
        code: typeof data?.code === "string" ? data.code : null,
        message: typeof data?.message === "string" ? data.message : "A API do Mercado Livre recusou a busca.",
        blocked_by: typeof data?.blocked_by === "string" ? data.blocked_by : null
      };
      console.error("[ML_SEARCH_UPSTREAM]", upstream);
      return NextResponse.json({
        error: `Mercado Livre respondeu ${res.status}: ${upstream.message}`,
        upstream
      }, { status: res.status });
    }

    const sql = db();
    const products = [];
    for (const item of (data.results || [])) {
      const scoring = opportunityScore(item);
      const row = {
        id: item.id,
        title: item.title,
        price: item.price,
        original_price: item.original_price,
        permalink: item.permalink,
        thumbnail: item.thumbnail,
        currency_id: item.currency_id,
        seller_id: item.seller?.id ? String(item.seller.id) : null,
        category_id: item.category_id,
        available_quantity: item.available_quantity,
        sold_quantity: item.sold_quantity,
        free_shipping: !!item.shipping?.free_shipping,
        opportunity_score: scoring.score,
        score_reasons: scoring.reasons
      };
      products.push(row);

      const saved = await sql`
        INSERT INTO products
          (marketplace, external_id, title, permalink, thumbnail, price, original_price, currency_id,
           seller_id, category_id, available_quantity, sold_quantity, free_shipping, opportunity_score,
           score_reason, raw, updated_at)
        VALUES
          ('mercadolivre', ${row.id}, ${row.title}, ${row.permalink}, ${row.thumbnail}, ${row.price},
           ${row.original_price}, ${row.currency_id}, ${row.seller_id}, ${row.category_id},
           ${row.available_quantity}, ${row.sold_quantity}, ${row.free_shipping},
           ${row.opportunity_score}, ${JSON.stringify(scoring)}, ${JSON.stringify(item)}, NOW())
        ON CONFLICT (marketplace, external_id)
        DO UPDATE SET
          title=EXCLUDED.title, permalink=EXCLUDED.permalink, thumbnail=EXCLUDED.thumbnail,
          price=EXCLUDED.price, original_price=EXCLUDED.original_price, available_quantity=EXCLUDED.available_quantity,
          sold_quantity=EXCLUDED.sold_quantity, free_shipping=EXCLUDED.free_shipping,
          opportunity_score=EXCLUDED.opportunity_score, score_reason=EXCLUDED.score_reason,
          raw=EXCLUDED.raw, updated_at=NOW()
        RETURNING id
      `;
      if (row.price != null && saved[0]?.id) {
        await sql`
          INSERT INTO price_history(product_id, price, original_price)
          VALUES (${saved[0].id}, ${row.price}, ${row.original_price})
        `;
      }
    }

    products.sort((a, b) => b.opportunity_score - a.opportunity_score);
    return NextResponse.json({ query: q, total: data.paging?.total ?? products.length, products });
  } catch (e: any) {
    const status = String(e?.message || "").includes("categoria") ? 400 : 500;
    return NextResponse.json({ error: e?.message || "Erro interno" }, { status });
  }
}
