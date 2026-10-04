/**
 * main.js — Ponto de entrada da aplicação Ki-Delícia Pastelaria
 *
 * Responsável por:
 * - Inicializar os módulos
 * - Registrar todos os event listeners
 * - Orquestrar as interações entre módulos
 */

import { DEFAULT_MENU } from './data.js';
import { loadMenu, loadOrders, loadNextId, saveMenu } from './storage.js';
import { setMenu, getMenu, renderMenu, addMenuItem } from './menu.js';
import { initOrders, createOrder, renderOrders, setOrderFilter } from './orders.js';
import { getCart, clearCart, cartTotal } from './cart.js';
import { renderGestao, saveConfigForm, loadConfigForm } from './gestao.js';
import { showTab, toggleCart, closeCart, closeModal, toast } from './ui.js';

/* ── Inicialização ── */

function init() {
  // Carrega dados do localStorage (ou usa os padrões)
  const menu   = loadMenu(DEFAULT_MENU);
  const orders = loadOrders();
  const nextId = loadNextId();

  setMenu(menu);
  initOrders(orders, nextId);

  // Renderiza a tela inicial
  renderMenu();
  renderOrders();
  loadConfigForm();

  // Registra todos os listeners
  _bindNavigation();
  _bindSearch();
  _bindCart();
  _bindOrders();
  _bindConfig();
  _bindModalClose();
}

/* ── Navegação ── */

function _bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const tabName = btn.dataset.tab;
      showTab(tabName, name => {
        if (name === 'gestao')  renderGestao();
        if (name === 'pedidos') renderOrders();
      });
    });
  });
}

/* ── Busca no cardápio ── */

function _bindSearch() {
  document.getElementById('search-input')?.addEventListener('input', renderMenu);
}

/* ── Carrinho ── */

function _bindCart() {
  // Botão flutuante do carrinho
  document.getElementById('cart-fab')?.addEventListener('click', toggleCart);

  // Overlay fecha o carrinho
  document.getElementById('overlay')?.addEventListener('click', closeCart);

  // Handle de arrastar (toque no topo do drawer)
  document.querySelector('.drawer-handle')?.addEventListener('click', closeCart);

  // Finalizar pedido
  document.querySelector('.btn-checkout')?.addEventListener('click', _finalizarPedido);
}

function _finalizarPedido() {
  const cart = getCart();
  if (!cart.length) {
    toast('Adicione itens ao pedido primeiro! 🛒');
    return;
  }

  const customer = (document.getElementById('cust-name')?.value || '').trim() || 'Cliente';
  const obs      = (document.getElementById('cust-obs')?.value  || '').trim();
  const total    = cartTotal();

  const order = createOrder({ customer, obs, items: cart, total });

  clearCart();

  // Limpa os campos do formulário
  const nameInput = document.getElementById('cust-name');
  const obsInput  = document.getElementById('cust-obs');
  if (nameInput) nameInput.value = '';
  if (obsInput)  obsInput.value  = '';

  closeCart();
  toast(`Pedido ${order.id} registrado! ✅`);
  renderOrders();
}

/* ── Filtros de pedidos ── */

function _bindOrders() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setOrderFilter(btn.dataset.filter);
    });
  });
}

/* ── Configurações ── */

function _bindConfig() {
  // Adicionar item ao cardápio
  document.getElementById('btn-add-item')?.addEventListener('click', _addMenuItem);

  // Salvar configurações da loja
  document.getElementById('btn-save-config')?.addEventListener('click', saveConfigForm);
}

function _addMenuItem() {
  const name  = (document.getElementById('new-name')?.value  || '').trim();
  const desc  = (document.getElementById('new-desc')?.value  || '').trim();
  const cat   =  document.getElementById('new-cat')?.value   || 'tradicional';
  const price = parseFloat(document.getElementById('new-price')?.value);

  if (!name || !desc || isNaN(price) || price <= 0) {
    toast('Preencha todos os campos corretamente. ❌');
    return;
  }

  addMenuItem({ name, desc, cat, price });

  // Persiste e re-renderiza
  saveMenu(getMenu());
  renderMenu();

  // Limpa formulário
  ['new-name', 'new-desc', 'new-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  toast(`"${name}" adicionado ao cardápio! 🥟`);
}

/* ── Modal fechar ── */

function _bindModalClose() {
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
}

/* ── Start ── */

document.addEventListener('DOMContentLoaded', init);
