export const BOT_PATTERN='facebookexternalhit|facebot|bot|crawler|spider|preview|headless';
export const CHANNELS=['vitrine','instagram','stories','facebook','whatsapp','telegram','pinterest','tiktok','pessoal'] as const;
export function clickChannel(value:unknown){return CHANNELS.includes(value as any)?String(value):'vitrine';}
export const ADMIN_DEVICE_COOKIE='vda_admin_device';
export const APP_PATTERN='FBAN|FBAV|FB_IAB|Instagram';
export function countClick(agent:string|null,test:string|null,adminDevice?:string|null){return test!=='1'&&adminDevice!=='1'&&!new RegExp(BOT_PATTERN,'i').test(agent||'');}
