"use client";
import {usePathname} from "next/navigation";
import Image from "next/image";
import MainNav from "./MainNav";

export default function AppChrome(){
  const p=usePathname();
  if(p.startsWith("/ofertas")||p.startsWith("/politica-de-privacidade")){
    return <header className="publicHeader">
      <nav className="publicHeaderInner" aria-label="Navegação da Vitrine">
        <a className="publicBrand" href="/ofertas" aria-label="Vitrine dos Achados — início">
          <Image src="/brand/logo-horizontal.png" alt="Vitrine dos Achados" width={720} height={330} priority className="publicBrandLogo"/>
        </a>
        <div className="publicLinks">
          <a className={p.startsWith("/ofertas")?"current":""} href="/ofertas#ofertas">Ofertas</a>
          <a className={p.startsWith("/politica-de-privacidade")?"current":""} href="/politica-de-privacidade">Privacidade</a>
        </div>
      </nav>
    </header>;
  }
  if(p.startsWith("/oferta/")||p.startsWith("/admin/login")) return null;
  return <header className="globalHeader"><div className="globalHeaderInner"><div className="adminBrandRow"><a className="brand" href="/operacao">Garimpo Afiliados</a><form action="/api/admin/logout" method="post"><button className="logoutBtn" type="submit">Sair</button></form></div><MainNav/></div></header>;
}
