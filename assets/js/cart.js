/**
 * cart.js — Lógica do carrinho de compras
 * Ki-Delícia Pastelaria
 */

import { formatBRL, toast } from './ui.js';

/** @type {Array<{id: number, name: string, price: number, qty: number}>} */
let _cart = [];

/** Retorna uma cópia do carrinho atual. */
export function getCart() {
  return [..._cart];
}

/** Limpa o carrinho. */
export function clearCart() {
  _cart = [];
  _update();
}

/**
 * Adiciona um item ao carrinho (ou incrementa a quantidade).
 * @param {{ id: number, name: string, price: number }} item
 */
export function addToCart(item) {
  const existing = _cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty++;
  } else {
    _cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  }
  _update();
  toast(`${item.name} adicionado! 🥟`);
}

/**
 * Altera a quantidade de um item no carrinho.
 * Remove o item se a quantidade chegar a zero.
 * @param {number} id
 * @param {number} delta  (+1 ou -1)
 */
export function changeQty(id, delta) {
  const idx = _cart.findIndex(c => c.id === id);
  if (idx < 0) return;
  _cart[idx].qty += delta;
  if (_cart[idx].qty <= 0) _cart.splice(idx, 1);
  _update();
}

/** Total em reais do carrinho. */
export function cartTotal() {
  return _cart.reduce((sum, c) => sum + c.price * c.qty, 0);
}

/** Total de itens (somando quantidades). */
export function cartCount() {
  return _cart.reduce((sum, c) => sum + c.qty, 0);
}

/* ── Renderização ── */

function _update() {
  _renderBadge();
  _renderDrawer();
}

function _renderBadge() {
  const count = cartCount();
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  if (count > 0) {
    badge.style.display = 'flex';
    badge.textContent   = count;
  } else {
    badge.style.display = 'none';
  }
}

function _renderDrawer() {
  const list     = document.getElementById('cart-list');
  const totalEl  = document.getElementById('cart-total-val');
  if (!list || !totalEl) return;

  if (!_cart.length) {
    list.innerHTML = '<div class="cart-empty">Nada no carrinho ainda 🛒</div>';
    totalEl.textContent = 'R$ 0,00';
    return;
  }

  list.innerHTML = _cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${c.name}</div>
        <div class="cart-item-price">${formatBRL(c.price * c.qty)} (${c.qty}x)</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" data-id="${c.id}" data-delta="-1">−</button>
        <span class="qty-num">${c.qty}</span>
        <button class="qty-btn" data-id="${c.id}" data-delta="1">+</button>
      </div>
    </div>`).join('');

  totalEl.textContent = formatBRL(cartTotal());

  // Delegação de eventos nos botões +/-
  list.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      changeQty(Number(btn.dataset.id), Number(btn.dataset.delta));
    });
  });
}
