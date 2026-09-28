"use client";

export default function MercadoLivreImportButton(){
  return <div className="importToolbar mlImportToolbar" title="A conexão OAuth está ativa, mas a descoberta de anúncios de terceiros não foi liberada para esta aplicação.">
    <button type="button" disabled aria-disabled="true">Mercado Livre: descoberta indisponível</button>
    <span className="importState">OAuth ativo · catálogo acessível · ofertas de terceiros bloqueadas</span>
  </div>
}
