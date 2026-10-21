import {listPublishedOffers,listHomeHighlights} from './offers';
import {getVitrineConfig,DEFAULT_HIGHLIGHT_TITLE} from './vitrine-config';
export async function getVitrineHome(){
  const [catalog,highlights,settings]=await Promise.allSettled([listPublishedOffers(),listHomeHighlights(),getVitrineConfig()]);
  if(catalog.status==='rejected')throw catalog.reason;
  const config=settings.status==='fulfilled'?settings.value:{titulo:DEFAULT_HIGHLIGHT_TITLE,exibir_titulo:true,destaque_ativo:false};
  return {todas:catalog.value,destaques:config.destaque_ativo&&highlights.status==='fulfilled'?highlights.value:[],config};
}
