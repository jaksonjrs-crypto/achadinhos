export const HOME_DAYS=[5,10,15,20,30] as const;
export function validHomeDays(value:number){return HOME_DAYS.some(day=>day===value);}
export function activeHomeOffer(offer:{status?:string;home_until?:string|null},now=Date.now()){
  return (!offer.status||offer.status==='published')&&Boolean(offer.home_until)&&new Date(offer.home_until!).getTime()>now;
}
