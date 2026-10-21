export const BOT_PATTERN='facebookexternalhit|facebot|bot|crawler|spider|preview|headless';
export const CHANNELS=['vitrine','instagram','facebook','whatsapp','telegram','pinterest','tiktok'] as const;
export function clickChannel(value:unknown){return CHANNELS.includes(value as any)?String(value):'vitrine';}
export function countClick(agent:string|null,test:string|null){return test!=='1'&&!new RegExp(BOT_PATTERN,'i').test(agent||'');}
