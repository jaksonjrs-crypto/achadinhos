'use client';
import {usePathname} from 'next/navigation';
import FollowStrip from './FollowStrip';
import InstallApp from './InstallApp';
export default function PublicFollowFooter(){const p=usePathname();return p==='/'||p==='/vitrine'||p.startsWith('/ofertas')||p.startsWith('/oferta/')||p.startsWith('/politica-de-privacidade')?<footer><FollowStrip/>{p.startsWith('/ofertas')&&<InstallApp/>}</footer>:null;}
