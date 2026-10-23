// v3.6.6 — faixa de redes (com YouTube): ícones pequenos em cima, nome da plataforma embaixo.
const REDES=[
  {nome:'Instagram',icone:'📸',url:'https://www.instagram.com/minhavitrinedosachados/'},
  {nome:'TikTok',icone:'🎵',url:'https://www.tiktok.com/@vitrinedosachadosoferta1'},
  {nome:'Facebook',icone:'👍',url:'https://www.facebook.com/1400401546480269'},
  {nome:'Pinterest',icone:'📌',url:'https://br.pinterest.com/jack_vitrine_dos_achados/'},
  {nome:'YouTube',icone:'▶️',url:'https://www.youtube.com/@minhavitrinedosachados'},
  {nome:'Telegram',icone:'✈️',url:'https://t.me/vitrinedosachadosofertas'},
];
export default function FollowStrip(){return <aside className="followStrip" aria-label="Siga a Vitrine">
  <strong>Receba os achados do dia</strong>
  <nav className="followIcons">{REDES.map(r=><a key={r.nome} href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Vitrine dos Achados no ${r.nome}`}>
    <span aria-hidden="true">{r.icone}</span><small>{r.nome}</small></a>)}</nav>
</aside>}
