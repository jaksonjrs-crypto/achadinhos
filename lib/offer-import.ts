import ExcelJS from 'exceljs';
import {validateManualLink} from './manual-affiliate';
import {productSafetyCheck} from './product-safety';
import {ensureAffiliateRegistry} from './affiliate-registry';

export const IMPORT_HEADERS=['Nome','Categoria','Marketplace','Preço Atual','Preço Anterior','Link Afiliado','ID Produto Shopee','Sub ID','URL Imagem','Status','Data Criação','Link Testar'];
export type ImportRow={row:number;title:string;category:string;marketplace:string;price:number;original:number|null;link:string;itemId:string;subId:string;image:string;status:string;created:string;testLink:string};
const normalize=(v:unknown)=>String(v??'').trim();
function price(v:unknown){const s=normalize(v).replace(/R\$|\s/g,'');return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s);}
export function csvRows(text:string){
  text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/)[0];const sep=first.includes(';')?';':',';
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell!=='')throw Error('CSV inválido: aspas inesperadas.');else quoted=!quoted;}
    else if(c===sep&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw Error('CSV inválido: aspas não fechadas.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
}
// Reject oversized ZIP expansion before ExcelJS inflates the uploaded XLSX.
function checkZip(buffer:Buffer){
  let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
  if(end<0)throw Error('Excel inválido. Use .xlsx.');
  const count=buffer.readUInt16LE(end+10);let at=buffer.readUInt32LE(end+16),total=0;
  if(count>500)throw Error('Excel contém arquivos demais.');
  for(let i=0;i<count;i++){if(at+46>buffer.length||buffer.readUInt32LE(at)!==0x02014b50)throw Error('Excel inválido.');
    const size=buffer.readUInt32LE(at+24);total+=size;if(size>10*1024*1024||total>20*1024*1024)throw Error('Excel descompactado excede 20 MB.');
    at+=46+buffer.readUInt16LE(at+28)+buffer.readUInt16LE(at+30)+buffer.readUInt16LE(at+32);
  }
}
export async function parseImport(buffer:Buffer,name:string):Promise<ImportRow[]>{
  if(buffer.length>2*1024*1024)throw Error('Limite de arquivo: 2 MB.');
  let matrix:unknown[][];
  if(name.toLowerCase().endsWith('.csv'))matrix=csvRows(buffer.toString('utf8'));
  else if(name.toLowerCase().endsWith('.xlsx')){
    checkZip(buffer);const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer as any);
    const sheet=workbook.worksheets[0];if(!sheet||sheet.rowCount>1001||sheet.columnCount>30)throw Error('Use até 1.000 ofertas e 30 colunas.');
    matrix=[];sheet.eachRow(row=>{const values:unknown[]=[];for(let col=1;col<=sheet.columnCount;col++){const c=row.getCell(col),v=c.value;if(v&&typeof v==='object'&&('formula' in v||'sharedFormula' in v))throw Error(`Linha ${row.number}: substitua fórmulas por valores.`);values.push(v instanceof Date?v.toISOString():c.text);}matrix.push(values);});
  }else throw Error('Escolha Excel (.xlsx) ou CSV.');
  if(matrix.length<2||matrix.length>1001)throw Error('Use de 1 a 1.000 ofertas.');
  const header=matrix[0].map(normalize),indexes=IMPORT_HEADERS.map(h=>header.indexOf(h));
  if(indexes.some(i=>i<0)||new Set(header).size!==header.length)throw Error('Colunas ausentes ou duplicadas. Use as 12 colunas da exportação da Central.');
  return matrix.slice(1).map((r,i)=>{const v=indexes.map(n=>normalize(r[n]));return {row:i+2,title:v[0],category:v[1],marketplace:v[2],price:price(v[3]),original:v[4]?price(v[4]):null,link:v[5],itemId:v[6],subId:v[7],image:v[8],status:({Publicada:'published',Rascunho:'draft',Expirada:'expired'} as Record<string,string>)[v[9]]||v[9],created:v[10],testLink:v[11]};});
}
export function validateImportRow(r:ImportRow){
  if(!r||typeof r!=='object')throw Error('Linha inválida.');
  if(String(r.marketplace).trim().toLowerCase()!=='shopee')return 'Outro marketplace preservado; importação por ID Shopee.';
  if(!r.itemId)return 'Sem ID Shopee: linha preservada. Informe o ID real para importar.';
  validateManualLink(String(r.itemId),String(r.link),String(r.subId||''));
  if([r.title,r.category,r.link,r.image,r.subId,r.created,r.testLink].some(v=>typeof v!=='string'||v.length>2000))throw Error('Campo inválido ou muito longo.');
  return null;
}
export function validateNewOffer(r:ImportRow){
  if(!r.title||!r.category||!Number.isFinite(r.price)||r.price<=0||!(r.original===null||Number.isFinite(r.original)&&r.original>=0))throw Error('Nova oferta precisa de nome, categoria e preço válido.');
  if(!['published','draft','expired'].includes(r.status))throw Error('Status inválido.');
  if(!productSafetyCheck(r.title,r.category).allowed)throw Error('Categoria de produto não permitida.');
  if(r.image){const u=new URL(r.image);if(!['https:','http:'].includes(u.protocol))throw Error('URL da imagem inválida.');}
  if(r.status==='published'&&!r.image)throw Error('Nova oferta publicada precisa de imagem.');
  if(r.created&&!Number.isFinite(Date.parse(r.created)))throw Error('Data de criação inválida.');
}
export async function importOffers(rows:ImportRow[],dryRun=true){
  const sql=await ensureAffiliateRegistry();
  const existing=await sql`SELECT id,external_id,affiliate_url,affiliate_sub_id FROM offers WHERE LOWER(TRIM(marketplace))='shopee'`;
  const details:any[]=[];let updated=0,created=0,failed=0,skipped=0;const seen=new Set<string>();
  for(const r of rows){
    try{
      const skip=validateImportRow(r);if(skip){skipped++;details.push({row:r.row,status:'skipped',message:skip});continue;}
      if(seen.has(r.itemId))throw Error('ID Shopee duplicado no arquivo/lote.');seen.add(r.itemId);
      const matches=existing.filter(o=>String(o.external_id)===r.itemId);
      if(matches.length>1)throw Error('Há mais de uma oferta com este ID. Revise as duplicatas antes de importar.');
      const old=matches[0];if(!old)validateNewOffer(r);
      if(old&&old.affiliate_url===r.link&&(!r.subId||old.affiliate_sub_id===r.subId)){skipped++;details.push({row:r.row,status:'skipped',message:'Sem alteração.'});continue;}
      if(!dryRun){
        // Table lock is held for one short transaction. It prevents two imports
        // from concurrently creating the same item, without a new unique index
        // that could fail on pre-existing catalog duplicates.
        const result=await sql.transaction([
          sql`LOCK TABLE offers IN SHARE ROW EXCLUSIVE MODE`,
          sql`WITH previous AS (SELECT id,affiliate_url,affiliate_sub_id FROM offers WHERE LOWER(TRIM(marketplace))='shopee' AND external_id=${r.itemId}),
          changed AS (UPDATE offers o SET affiliate_url=${r.link},affiliate_sub_id=COALESCE(NULLIF(${r.subId},''),o.affiliate_sub_id),affiliate_status='pending',affiliate_note='Importado manualmente. Verificação pendente. Sub ID registrado localmente.',updated_at=NOW()
            FROM previous p WHERE o.id=p.id AND (SELECT COUNT(*) FROM previous)=1 AND p.affiliate_url=${old?.affiliate_url??null} AND p.affiliate_sub_id IS NOT DISTINCT FROM ${old?.affiliate_sub_id??null} RETURNING o.id,p.affiliate_url AS old_url),
          inserted AS (INSERT INTO offers(title,category,marketplace,price,original_price,affiliate_url,external_id,affiliate_sub_id,image_url,status,created_at,affiliate_status,affiliate_note,sync_status)
            SELECT ${r.title},${r.category},'Shopee',${r.price},${r.original},${r.link},${r.itemId},${r.subId},${r.image||null},${r.status},COALESCE(${r.created||null}::timestamptz,NOW()),'pending','Importado manualmente. Verificação pendente.','linked'
            WHERE NOT EXISTS(SELECT 1 FROM previous) AND ${!old} RETURNING id),
          audited AS (INSERT INTO affiliate_link_audit(offer_id,old_url,new_url,external_id,status,message)
            SELECT id,old_url,${r.link},${r.itemId},'manual_import',${`Importação manual; Sub ID: ${r.subId||'preservado'}. Verificação pendente.`} FROM changed
            UNION ALL SELECT id,'',${r.link},${r.itemId},'manual_import','Nova oferta importada; verificação pendente.' FROM inserted RETURNING offer_id)
          SELECT offer_id FROM audited`
        ]);
        if(!result[1].length)throw Error('Oferta mudou durante a importação. Recarregue o arquivo e tente novamente.');
      }
      if(old)updated++;else created++;
      details.push({row:r.row,status:old?'updated':'created',message:`${dryRun?'Previsto: ':''}${old?'atualizar link e Sub ID':'criar oferta'}; verificação pendente.`});
    }catch(e:any){failed++;details.push({row:r?.row,status:'failed',message:e.message||'Falha ao importar linha.'});}
  }
  return {updated,created,failed,skipped,details};
}
