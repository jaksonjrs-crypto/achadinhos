export const PUBLICATION_TIMES = ['09:00','13:00','16:00','19:00','20:30'] as const;

export function validatePublicationTimes(value:unknown,startHour:number,endHour:number):string[]{
  if(!Array.isArray(value)||value.length<1||value.length>20)throw new Error('Escolha de 1 a 20 envios por dia.');
  const times=value.map(time=>{
    if(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Preencha todos os horários no formato HH:mm.');
    const [h,m]=time.split(':').map(Number);
    if(h*60+m<startHour*60||h*60+m>=endHour*60)throw new Error('Os horários de envio devem ficar dentro da janela permitida.');
    return time;
  });
  if(new Set(times).size!==times.length)throw new Error('Os horários de envio não podem se repetir.');
  return times.sort();
}

// Only the latest slot is eligible. Delays never drain missed slots in a batch.
export function duePublicationSlot(now:Date,startHour:number,endHour:number,times:readonly string[]=PUBLICATION_TIMES):string|null {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const minute=Number(parts.find(p=>p.type==='hour')?.value)*60+Number(parts.find(p=>p.type==='minute')?.value);
  if(minute<startHour*60||minute>=endHour*60)return null;
  const slot=[...times].sort().reverse().find(time=>{
    const [h,m]=time.split(':').map(Number);return h*60+m<=minute&&h>=startHour&&h<endHour;
  });
  if(!slot)return null;
  const [h,m]=slot.split(':').map(Number);
  return minute-(h*60+m)<90?slot:null;
}
