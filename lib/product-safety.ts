const BLOCKED_TERMS=[
  "arma","armas","munição","municao","revólver","revolver","pistola","rifle","espingarda",
  "faca tática","faca tatica","canivete automático","canivete automatico","soco inglês","soco ingles",
  "taser","spray de pimenta",
  "cerveja","vinho","vodka","whisky","uísque","uisque","cachaça","licor","gin alcoólico","gin alcoolico",
  "cigarro","cigarros","vape","vaper","pod descartável","pod descartavel","nicotina",
  "cannabis","maconha","thc","cbd","cocaína","cocaina","ecstasy","lsd","cogumelo alucinógeno","cogumelo alucinogeno",
  "cassino","casino","aposta esportiva","apostas esportivas","bet esportiva","roleta online","slot machine",
  "pornografia","pornográfico","pornografico","sex doll","vibrador sexual","dildo",
  "veneno","raticida concentrado","explosivo","fogos de artifício","fogos de artificio"
];

export function productSafetyCheck(...parts:(string|null|undefined)[]){
  const text=parts.filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  // "Vinho" can describe a clothing color, as in "Vestido ... Vinho Único".
  // Keep the beverage restriction when the listing mentions alcohol/volume.
  const wineColor=/\b(vestido|blusa|camisa|calça|calca|short|bermuda|saia|body|roupa)\b/.test(text)
    &&!/(garrafa|bebida|alco[oó]l|espumante|cabernet|merlot|vinho do porto|vinho tinto|vinho seco|\d+\s*(ml|litros?)\b)/.test(text);
  const matches=BLOCKED_TERMS.filter(term=>text.includes(term)&&!(term==='vinho'&&wineColor));
  return {allowed:matches.length===0,matches};
}
