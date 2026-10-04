/**
 * data.js — Dados do cardápio e estado da aplicação
 * Ki-Delícia Pastelaria
 */

/** @type {MenuItem[]} */
export const DEFAULT_MENU = [
  // ── Tradicionais ──
  { id: 1,  cat: 'tradicional', name: 'Quatro Queijos',     desc: 'Mussarela, parmesão, catupiry, provolone, cheddar, orégano e tomate.',           price: 13.00 },
  { id: 2,  cat: 'tradicional', name: 'Baiano',             desc: 'Calabresa, mussarela, ovo, tomate, catupiry, cebola, pimenta muito forte.',       price: 12.00 },
  { id: 3,  cat: 'tradicional', name: 'Português',          desc: 'Presunto, mussarela, ovo, calabresa, catupiry e cebola.',                         price: 12.00 },
  { id: 4,  cat: 'tradicional', name: 'Carne Tradicional',  desc: 'Carne moída, catupiry, tomate, milho, mussarela e cebola.',                       price: 15.00 },
  { id: 5,  cat: 'tradicional', name: 'Frango Tradicional', desc: 'Frango desfiado, catupiry, mussarela, tomate e milho.',                           price: 12.00 },
  { id: 6,  cat: 'tradicional', name: 'Bauru',              desc: 'Presunto, catupiry, tomate, orégano e mussarela.',                                price: 10.00 },
  { id: 7,  cat: 'tradicional', name: 'Calabresa',          desc: 'Calabresa, catupiry, tomate, mussarela e cebola.',                                price: 12.00 },
  { id: 8,  cat: 'tradicional', name: 'Queijo Tradicional', desc: 'Queijo, mussarela, tomate e orégano.',                                            price: 12.00 },
  // ── Especiais ──
  { id: 9,  cat: 'especial',    name: 'Nordestino',         desc: 'Mussarela, carne seca desfiada, catupiry, milho, tomate e cebola.',                            price: 15.00 },
  { id: 10, cat: 'especial',    name: 'Frango CheeseBacon', desc: 'Frango desfiado, mussarela, catupiry, bacon, cream cheese, milho e tomate.',                   price: 18.00 },
  { id: 11, cat: 'especial',    name: 'Moda Pasteleiro',    desc: 'Frango desfiado, presunto, calabresa, mussarela, catupiry, bacon, milho verde e tomate.',       price: 20.00 },
  { id: 12, cat: 'especial',    name: 'Camarão',            desc: 'Camarões inteiros, catupiry, mussarela, cream cheese, milho, cebola e tomate.',                price: 25.00 },
  { id: 13, cat: 'especial',    name: 'Catubresa',          desc: 'Calabresa, mussarela, catupiry, bacon, cream cheese, milho e tomate.',                         price: 16.00 },
  { id: 14, cat: 'especial',    name: 'Caipirão',           desc: 'Frango desfiado, mussarela, ovo, pimentão, milho e tomate.',                                   price: 13.00 },
  { id: 15, cat: 'especial',    name: 'Mexicano',           desc: 'Mussarela, calabresa, catupiry, bacon, ovo, cebola, pimenta moderada e tomate.',               price: 13.00 },
];

export const STATUS_LABELS = {
  pendente:   'Pendente',
  preparando: 'Preparando',
  pronto:     'Pronto! 🎉',
  entregue:   'Entregue',
};

export const STATUS_NEXT = {
  pendente:   'preparando',
  preparando: 'pronto',
  pronto:     'entregue',
  entregue:   null,
};

export const STATUS_BADGE = {
  pendente:   'badge-pending',
  preparando: 'badge-making',
  pronto:     'badge-ready',
  entregue:   'badge-delivered',
};
