"use client";
import {usePathname} from "next/navigation"; import MainNav from "./MainNav";
export default function AppChrome(){const p=usePathname(); if(p.startsWith("/ofertas")||p.startsWith("/oferta/")||p.startsWith("/admin/login")) return null; return <header className="globalHeader"><div className="globalHeaderInner"><div className="adminBrandRow"><a className="brand" href="/operacao">Garimpo Afiliados</a><form action="/api/admin/logout" method="post"><button className="logoutBtn" type="submit">Sair</button></form></div><MainNav/></div></header>}
