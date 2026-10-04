/**
 * orders.js — Gerenciamento de pedidos
 * Ki-Delícia Pastelaria
 */

import { STATUS_LABELS, STATUS_NEXT, STATUS_BADGE } from './data.js';
import { formatBRL, toast, openModal } from './ui.js';
import { saveOrders, saveNextId } from './storage.js';
import { isSupabaseConfigured, updateRemoteOrder, deleteRemoteOrder } from './supabase.js';

/** @type {any[]} */
let _orders  = [];
let _nextId  = 100;
let _filter  = 'all';

/* ── Inicialização ── */

export function initOrders(orders, nextId) {
  _orders = orders;
  _nextId = nextId;
}

export function getOrders()  { return _orders; }
export function getNextId()  { return _nextId; }

/* ── CRUD ── */

/**
 * Cria um novo pedido e o insere no topo da lista.
 * @param {{ customer: string, obs: string, items: any[], total: number }} data
 * @returns {object} O pedido criado
 */
export function createOrder({ customer, obs, items, total, type = 'mesa', table = '', address = '', id = '' }) {
  const order = {
    id:       id || '#' + _nextId++,
    customer: customer || 'Cliente',
    obs,
    type,
    table,
    address,
    items,
    total,
    status:   'pendente',
    time:     new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };
  _orders.unshift(order);
  _persist();
  return order;
}

/**
 * Avança o status de um pedido para o próximo estágio.
 * @param {string} id
 */
export function advanceOrder(id) {
  const order = _orders.find(o => o.id === id);
  if (!order) return;
  const next = STATUS_NEXT[order.status];
  if (!next) return;
  order.status = next;
  _persist();
  if (isSupabaseConfigured()) updateRemoteOrder(order).catch(error => toast(`Erro ao atualizar pedido: ${error.message}`, 5000));
  renderOrders();
  renderStats();
  toast(`Pedido ${id}: ${STATUS_LABELS[next]}`);
}

/**
 * Remove um pedido com confirmação.
 * @param {string} id
 */
export function deleteOrder(id) {
  openModal('Excluir pedido?', `Remover o pedido ${id}?`, () => {
    _orders = _orders.filter(o => o.id !== id);
    _persist();
    if (isSupabaseConfigured()) deleteRemoteOrder(id).catch(error => toast(`Erro ao excluir pedido: ${error.message}`, 5000));
    renderOrders();
    renderStats();
  });
}

/* ── Filtros ── */

export function setOrderFilter(filter) {
  _filter = filter;
  renderOrders();
}

/* ── Renderização ── */

export function renderOrders() {
  const listEl = document.getElementById('order-list');
  if (!listEl) return;

  const shown = _filter === 'all'
    ? _orders
    : _orders.filter(o => o.status === _filter);

  if (!shown.length) {
    listEl.innerHTML = '<div class="cart-empty">Nenhum pedido aqui.</div>';
    return;
  }

  listEl.innerHTML = shown.map(o => {
    const next = STATUS_NEXT[o.status];
    return `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">${o.id} — ${o.customer}</span>
        <span class="order-badge ${STATUS_BADGE[o.status]}">${STATUS_LABELS[o.status]}</span>
      </div>
      <div class="order-items">
        ${o.items.map(i => `${i.qty}x ${i.name}`).join(' · ')}
        <br><strong>${o.type === 'entrega' ? 'Entrega' : o.type === 'retirada' ? 'Retirada' : `Mesa ${o.table || ''}`}</strong>
        ${o.address ? `<br>Endereço: ${o.address}` : ''}
        ${o.obs ? `<br><em>Obs: ${o.obs}</em>` : ''}
      </div>
      <div class="order-footer">
        <div>
          <span class="order-total-lbl">${formatBRL(o.total)}</span>
          <span class="order-time"> · ${o.time}</span>
        </div>
        <div class="order-actions">
          ${next
            ? `<button class="btn-status btn-next" data-action="advance" data-id="${o.id}">▶ ${STATUS_LABELS[next]}</button>`
            : ''}
          <button class="btn-status btn-del" data-action="delete" data-id="${o.id}">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Delegação de eventos
  listEl.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'advance') advanceOrder(btn.dataset.id);
      if (btn.dataset.action === 'delete')  deleteOrder(btn.dataset.id);
    });
  });
}

export function renderStats() {
  const gridEl = document.getElementById('stats-grid');
  if (!gridEl) return;

  const total       = _orders.reduce((s, o) => s + o.total, 0);
  const pendentes   = _orders.filter(o => o.status === 'pendente').length;
  const preparando  = _orders.filter(o => o.status === 'preparando').length;
  const prontos     = _orders.filter(o => o.status === 'pronto').length;
  const entregues   = _orders.filter(o => o.status === 'entregue').length;
  const ticketMedio = _orders.length ? total / _orders.length : 0;

  gridEl.innerHTML = `
    <div class="stat-card"><div class="stat-val">${_orders.length}</div><div class="stat-lbl">Total Pedidos</div></div>
    <div class="stat-card"><div class="stat-val green">${formatBRL(total)}</div><div class="stat-lbl">Receita Total</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--gold)">${pendentes}</div><div class="stat-lbl">Pendentes</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#0d6efd">${preparando}</div><div class="stat-lbl">Preparando</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#0a3622">${prontos}</div><div class="stat-lbl">Prontos</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#666">${entregues}</div><div class="stat-lbl">Entregues</div></div>
    <div class="stat-card"><div class="stat-val green">${formatBRL(ticketMedio)}</div><div class="stat-lbl">Ticket Médio</div></div>
    <div class="stat-card"><div class="stat-val" id="stat-menu-count">–</div><div class="stat-lbl">Itens Cardápio</div></div>
  `;
}

/* ── Privado ── */

function _persist() {
  saveOrders(_orders);
  saveNextId(_nextId);
}
