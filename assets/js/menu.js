/**
 * menu.js — Renderização e filtros do cardápio
 * Ki-Delícia Pastelaria
 */

import { formatBRL } from './ui.js';
import { addToCart }  from './cart.js';

/** Referência ao array de itens do cardápio (gerenciado pelo main). */
let _menu = [];

/** Define o menu atual (chamado pelo main.js após carregar do storage). */
export function setMenu(menu) {
  _menu = menu;
}

/** Retorna o menu atual. */
export function getMenu() {
  return _menu;
}

/**
 * Renderiza o cardápio nas grids correspondentes.
 * Aplica filtro de busca se houver texto no input de pesquisa.
 */
export function renderMenu() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();

  const trad = _menu.filter(i =>
    i.cat === 'tradicional' &&
    (i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
  );

  const esp = _menu.filter(i =>
    i.cat === 'especial' &&
    (i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
  );

  _renderGrid('grid-tradicional', trad, false);
  _renderGrid('grid-especial',    esp,  true);
}

/**
 * Renderiza os itens em uma grid específica.
 * @param {string} gridId
 * @param {any[]} items
 * @param {boolean} isEspecial
 */
function _renderGrid(gridId, items, isEspecial) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:.85rem;">Nenhum item encontrado.</p>';
    return;
  }

  grid.innerHTML = items.map(i => `
    <div class="item-card ${isEspecial ? 'especial' : ''}">
      <div class="item-name">${i.name}</div>
      <div class="item-desc">${i.desc}</div>
      <div class="item-footer">
        <div class="item-price">${formatBRL(i.price)}</div>
        <button class="btn-add" data-id="${i.id}" title="Adicionar ao pedido" aria-label="Adicionar ${i.name}">+</button>
      </div>
    </div>`).join('');

  // Delegação de eventos nos botões "+"
  grid.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = _menu.find(m => m.id === Number(btn.dataset.id));
      if (item) addToCart(item);
    });
  });
}

/**
 * Adiciona um novo item ao cardápio.
 * @param {{ name: string, desc: string, cat: string, price: number }} data
 * @returns {object} O item criado
 */
export function addMenuItem(data) {
  const newId = Math.max(0, ..._menu.map(i => i.id)) + 1;
  const item  = { id: newId, ...data };
  _menu.push(item);
  return item;
}

/**
 * Atualiza o preço de um item no cardápio.
 * @param {number} id
 * @param {number} price
 * @returns {boolean} true se atualizou, false se não encontrou
 */
export function updateMenuItemPrice(id, price) {
  const item = _menu.find(i => i.id === id);
  if (!item) return false;
  item.price = price;
  return true;
}
