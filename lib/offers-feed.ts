import type { Offer } from './offers';

export const FEED_CHANNELS = ['facebook', 'instagram', 'pinterest'] as const;
export type FeedChannel = typeof FEED_CHANNELS[number];
const SITE = 'https://www.minhavitrinedeachados.com.br';
const xml = (value: unknown) => String(value ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));

export function buildOffersFeed(offers: Offer[], channel: FeedChannel, now = new Date()) {
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const items = offers.filter(o => {
    const created = new Date(o.created_at).getTime();
    let imageIsPublic = false;
    try { imageIsPublic = new URL(String(o.image_url)).protocol === 'https:'; } catch {}
    return o.status === 'published' && o.price > 0 && Number.isFinite(o.price) && imageIsPublic
      && Number.isFinite(created) && created <= now.getTime() && created >= now.getTime() - 14 * 86400000;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Vitrine dos Achados — ${xml(channel)}</title>
<link>${SITE}/ofertas</link>
<description>Novas ofertas selecionadas da Vitrine dos Achados.</description>
<language>pt-BR</language>
<lastBuildDate>${now.toUTCString()}</lastBuildDate>
<atom:link href="${SITE}/ofertas/feed?channel=${channel}" rel="self" type="application/rss+xml"/>
${items.map(o => {
    const link = `${SITE}/oferta/${o.id}?channel=${channel}`;
    const title = o.title.length > 80 ? o.title.slice(0, 79).trim() + '…' : o.title;
    const description = `${title}\n${money.format(o.price)}. Preço pode mudar.\nLink de afiliado: podemos receber comissão, sem custo extra para você.\n#VitrineDosAchados`;
    // Identity is tied to the offer, never to its price or last update.
    return `<item><title>${xml(title)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><description>${xml(description)}</description><pubDate>${new Date(o.created_at).toUTCString()}</pubDate></item>`;
  }).join('\n')}
</channel></rss>`;
}
