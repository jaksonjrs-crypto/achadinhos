const STOP_WORDS = new Set([
  "com","para","de","da","do","das","dos","e","em","por","um","uma","p","c"
]);

/**
 * Compact product name for admin UI, creatives and social copy.
 * Keeps the original database title untouched.
 */
export function productDisplayTitle(title:string,maxChars=46,maxWords=7){
  const clean=String(title||"").replace(/\s+/g," ").trim();
  if(!clean) return "Produto";
  const words=clean.split(" ");
  if(clean.length<=maxChars && words.length<=maxWords) return clean;

  const selected:string[]=[];
  for(const word of words){
    const candidate=[...selected,word].join(" ");
    if(selected.length>=maxWords || candidate.length>maxChars) break;
    selected.push(word);
  }

  // Avoid ending on a connector such as "com" or "para".
  while(selected.length>2 && STOP_WORDS.has(selected[selected.length-1].toLocaleLowerCase("pt-BR"))){
    selected.pop();
  }
  return selected.join(" ") || clean.slice(0,maxChars).trim();
}
