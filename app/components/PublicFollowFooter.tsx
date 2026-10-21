'use client';
import {usePathname} from 'next/navigation';
import FollowStrip from './FollowStrip';
export default function PublicFollowFooter(){const p=usePathname();return p==='/'||p==='/vitrine'||p.startsWith('/ofertas')||p.startsWith('/oferta/')||p.startsWith('/politica-de-privacidade')?<footer><FollowStrip/></footer>:null;}
