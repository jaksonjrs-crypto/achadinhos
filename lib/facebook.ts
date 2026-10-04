const VERSION=process.env.META_GRAPH_VERSION?.trim()||'v23.0';
function credentials(){
  const token=process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim(),pageId=process.env.FACEBOOK_PAGE_ID?.trim();
  if(!token||!pageId||!/^\d+$/.test(pageId))throw new Error('Facebook: configure o ID e o token de acesso da página.');
  return {token,pageId};
}
export function facebookConfigured(){return Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim()&&/^\d+$/.test(process.env.FACEBOOK_PAGE_ID?.trim()||''));}
async function graph(path:string,body?:URLSearchParams){
  const {token}=credentials();
  const response=await fetch(`https://graph.facebook.com/${VERSION}${path}`,{
    method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`},body,
    redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.error){
    if(data.error?.code===190)throw new Error('Facebook: token da página recusado ou expirado. Reconecte a página.');
    if([10,200].includes(data.error?.code))throw new Error('Facebook: a página precisa das permissões pages_manage_posts e pages_read_engagement.');
    throw new Error('Facebook: a API não confirmou a operação. Confira o canal antes de repetir.');
  }
  return data;
}
export async function verifyFacebookConnection(){
  const {pageId}=credentials();
  const data=await graph('/me?fields=id,name');
  if(String(data.id)!==pageId)throw new Error('Facebook: o token deve pertencer à página configurada, não ao perfil pessoal ou a outra página.');
  return {id:String(data.id),name:String(data.name||'')};
}
export async function publishFacebookPhoto(input:{imageUrl:string;message:string}){
  const image=new URL(input.imageUrl);
  if(image.protocol!=='https:'||image.username||image.password)throw new Error('Facebook: informe uma imagem pública HTTPS.');
  await verifyFacebookConnection();
  const {pageId}=credentials();
  const data=await graph(`/${encodeURIComponent(pageId)}/photos`,new URLSearchParams({url:image.toString(),message:input.message,published:'true'}));
  const id=data.post_id||data.id;
  if(!id)throw new Error('Facebook: envio não confirmado. Confira a página antes de repetir.');
  return {postId:String(id)};
}
