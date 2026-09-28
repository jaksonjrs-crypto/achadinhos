export type ScoreInput = {
  price?: number | null;
  original_price?: number | null;
  sold_quantity?: number | null;
  available_quantity?: number | null;
  free_shipping?: boolean | null;
};

export function opportunityScore(p: ScoreInput) {
  let score = 35;
  const reasons: string[] = [];

  if (p.original_price && p.price && p.original_price > p.price) {
    const discount = (p.original_price - p.price) / p.original_price;
    const pts = Math.min(30, Math.round(discount * 100));
    score += pts;
    reasons.push(`desconto +${pts}`);
  }
  if ((p.sold_quantity || 0) >= 50) { score += 15; reasons.push("demanda +15"); }
  else if ((p.sold_quantity || 0) >= 10) { score += 8; reasons.push("demanda +8"); }

  if (p.free_shipping) { score += 10; reasons.push("frete grátis +10"); }
  if ((p.available_quantity || 0) > 0) { score += 5; reasons.push("estoque +5"); }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}
