import {deflateRawSync} from 'node:zlib';
import {needsLinkReview} from './shopee-links';
export const EXPORT_HEADERS=['Nome','Categoria','Marketplace','Preço Atual','Preço Anterior','Link Afiliado','ID Produto Shopee','Sub ID','URL Imagem','Status','Data Criação','Link Testar'];
const labels:Record<string,string>={draft:'Rascunho',published:'Publicada',expired:'Expirada'};
export function exportRows(offers:any[],origin:string){
  return offers.map(o=>[o.title,o.category,o.marketplace,Number(o.price),o.original_price==null?'':Number(o.original_price),o.affiliate_url,o.external_id||'',o.sub_id||'',o.image_url||'',labels[o.status]||o.status,String(o.created_at instanceof Date?o.created_at.toISOString():o.created_at),`${origin}/go/${o.id}?channel=vitrine`]);
}
function safeText(v:unknown){return String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')}
export function csvExport(rows:unknown[][]){
  // Quoted fields still execute as formulas in spreadsheet applications. Neutralize them.
  const cell=(v:unknown)=>{let s=safeText(v);if(typeof v!=='number'&&/^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  return '\uFEFF'+[EXPORT_HEADERS,...rows].map(r=>r.map(cell).join(',')).join('\r\n');
}
const xml=(v:unknown)=>safeText(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
function crc32(data:Buffer){let c=0xffffffff;for(const b of data){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
// Small standards-based OOXML package, no server-side office installation required.
function zip(files:Record<string,string>){
  const parts:Buffer[]=[],directory:Buffer[]=[];let offset=0;
  for(const [path,text] of Object.entries(files)){
    const name=Buffer.from(path),raw=Buffer.from(text),data=deflateRawSync(raw),crc=crc32(raw);
    const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(8,8);h.writeUInt32LE(crc,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(raw.length,22);h.writeUInt16LE(name.length,26);
    const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(8,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);
    parts.push(h,name,data);directory.push(c,name);offset+=h.length+name.length+data.length;
  }
  const cd=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...parts,cd,end]);
}
export function xlsxExport(rows:unknown[][],verifiedLinks:Set<string>=new Set()){
  const sheetRows=[EXPORT_HEADERS,...rows].map((row,i)=>'<row r="'+(i+1)+'">'+row.map((v,j)=>{
    const ref=String.fromCharCode(65+j)+(i+1);
    const suspect=i>0&&j===5&&needsLinkReview(String(v))&&!verifiedLinks.has(String(v));
    const style=i===0?1:suspect?2:typeof v==='number'?3:0;
    return typeof v==='number'&&Number.isFinite(v)?`<c r="${ref}" s="${style}"><v>${v}</v></c>`:`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  }).join('')+'</row>').join('');
  return zip({
    '[Content_Types].xml':'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Ofertas" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><color rgb="FFB91C1C"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF14532D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    'xl/worksheets/sheet1.xml':`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:L${rows.length+1}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="45" customWidth="1"/><col min="2" max="5" width="18" customWidth="1"/><col min="6" max="6" width="48" customWidth="1"/><col min="7" max="8" width="28" customWidth="1"/><col min="9" max="9" width="40" customWidth="1"/><col min="10" max="11" width="24" customWidth="1"/><col min="12" max="12" width="48" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:L${rows.length+1}"/></worksheet>`
  });
}
