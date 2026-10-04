import {NextRequest,NextResponse} from 'next/server';
import {getAutopilotPolicy} from '@/lib/autopilot-policy';
import {instagramConfigured} from '@/lib/instagram';
import {db} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({ok:true,policy:await getAutopilotPolicy(),cronConfigured:Boolean(process.env.CRON_SECRET),instagramConfigured:instagramConfigured(),telegramConfigured:Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID)})}catch{return NextResponse.json({ok:false,error:'Não foi possível carregar as regras.'},{status:500})}}
export async function POST(req:NextRequest){
  try{
    await getAutopilotPolicy();
    const input=await req.json();
    const enabled=input.enabled===true;
    const telegramAuto=input.telegram_auto_publish===true;
    if(telegramAuto&&(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID))return NextResponse.json({ok:false,error:'Configure o bot e o canal do Telegram antes de ativar o envio automático.'},{status:400});
    const instagramAuto=input.instagram_auto_publish===true;
    const scheduled=input.scheduled_publish===true;
    if(instagramAuto&&!instagramConfigured())return NextResponse.json({ok:false,error:'Configure a conta do Instagram antes de ativar o envio automático.'},{status:400});
    if(instagramAuto&&!scheduled)return NextResponse.json({ok:false,error:'Ative os cinco horários para enviar automaticamente ao Instagram.'},{status:400});
    const min=Number(input.min_score),max=Number(input.max_per_day),start=Number(input.start_hour),end=Number(input.end_hour),cooldown=Number(input.cooldown_days);
    if(!Number.isInteger(min)||min<0||min>100||!Number.isInteger(max)||max<1||max>20||!Number.isInteger(start)||start<0||start>23||!Number.isInteger(end)||end<=start||end>24||!Number.isInteger(cooldown)||cooldown<1||cooldown>90)return NextResponse.json({ok:false,error:'Regras inválidas.'},{status:400});
    const sql=db();
    await sql`UPDATE autopilot_policy SET enabled=${enabled},min_score=${min},max_per_day=${max},start_hour=${start},end_hour=${end},cooldown_days=${cooldown},telegram_auto_publish=${telegramAuto},instagram_auto_publish=${instagramAuto},scheduled_publish=${scheduled},updated_at=NOW() WHERE id=1`;
    return NextResponse.json({ok:true,policy:await getAutopilotPolicy()});
  }catch{return NextResponse.json({ok:false,error:'Não foi possível salvar as regras.'},{status:500})}
}
