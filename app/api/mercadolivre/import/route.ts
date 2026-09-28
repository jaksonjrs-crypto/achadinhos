import {NextResponse} from "next/server";

// Discovery of third-party listings is unavailable for this Mercado Livre app.
// Keep the old endpoint closed even when called directly, so catalog permalinks
// cannot be stored as if they were verified affiliate offers.
export async function POST(){
  return NextResponse.json({
    ok:false,
    error:"A descoberta de ofertas do Mercado Livre está indisponível para esta aplicação. Nenhum produto foi importado."
  },{status:409});
}
