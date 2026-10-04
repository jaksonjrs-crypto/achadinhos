export const PUBLICATION_TIMES = ['09:00','13:00','16:00','19:00','20:30'] as const;

// Only the latest slot is eligible. A delayed scheduler never drains the whole
// day's backlog at once, and yesterday's slots cannot leak into today's run.
export function duePublicationSlot(now:Date,startHour:number,endHour:number):string|null {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const minute=Number(parts.find(p=>p.type==='hour')?.value)*60+Number(parts.find(p=>p.type==='minute')?.value);
  if(minute<startHour*60||minute>=endHour*60)return null;
  const slot=[...PUBLICATION_TIMES].reverse().find(time=>{
    const [h,m]=time.split(':').map(Number);return h*60+m<=minute&&h>=startHour&&h<endHour;
  });
  if(!slot)return null;
  const [h,m]=slot.split(':').map(Number);
  return minute-(h*60+m)<90?slot:null;
}
