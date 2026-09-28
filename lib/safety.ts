const BLOCKED = [
  "arma", "armas", "munição", "municao", "pistola", "revólver", "revolver",
  "rifle", "espingarda", "faca tática", "faca tatica", "canivete", "taser",
  "spray de pimenta", "cigarro", "cigarros", "vape", "nicotina", "tabaco",
  "cerveja", "vinho", "whisky", "vodka", "cachaça", "cachaca", "bebida alcoólica",
  "maconha", "cannabis", "thc", "cbd", "cocaína", "cocaina", "esteroide",
  "aposta", "apostas", "cassino", "casino", "pornografia"
];

export function assertSafeQuery(q: string) {
  const normalized = q.toLocaleLowerCase("pt-BR");
  if (BLOCKED.some(term => normalized.includes(term))) {
    throw new Error("Esta categoria não está disponível para pesquisa.");
  }
}
