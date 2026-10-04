/** Cardápio estático com painel local de produtos, mesas e configurações. */
import { DEFAULT_MENU } from './data.js';
import { setMenu, getMenu, renderMenu } from './menu.js';
import { getCart, clearCart, cartTotal } from './cart.js';
import { toggleCart, closeCart, toast, showTab } from './ui.js';
import { loadMenu, saveMenu, loadConfig, saveConfig, loadTables, saveTables } from './storage.js';

const ADMIN_USER = 'pasteladm';
const ADMIN_PASSWORD = 'vanessa@147';
const DEFAULT_CONFIG = {
  nome: 'Ki-Delícia Pastelaria',
  whatsapp: '5599984436545',
  endereco: 'https://maps.app.goo.gl/23deY4MwVhXyifYx7',
};
let _qrTable = '';
let _config = { ...DEFAULT_CONFIG };

function init() {
  setMenu(loadMenu(DEFAULT_MENU).map(item => ({ ...item })));
  const savedConfig = loadConfig();
  _config = { ...DEFAULT_CONFIG, ...savedConfig, whatsapp: savedConfig.whatsapp || savedConfig.wpp || DEFAULT_CONFIG.whatsapp };
  renderMenu();
  _initQrTable();
  _applyStoreInfo();
  _initNavigation();
  _initAdminLogin();
  _initProductEditor();
  _initTableManager();
  _initStoreConfig();
  document.getElementById('search-input')?.addEventListener('input', renderMenu);
  document.getElementById('cart-fab')?.addEventListener('click', toggleCart);
  document.getElementById('overlay')?.addEventListener('click', closeCart);
  document.querySelector('.drawer-handle')?.addEventListener('click', closeCart);
  document.querySelector('.btn-checkout')?.addEventListener('click', _finishOrder);
  document.getElementById('order-type')?.addEventListener('change', _syncOrderFields);
}

function _initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(button => button.addEventListener('click', () => {
    if (button.classList.contains('admin-nav') && sessionStorage.getItem('kd_admin') !== '1') return;
    showTab(button.dataset.tab);
    if (button.dataset.tab === 'produtos') _renderProducts();
    if (button.dataset.tab === 'mesas') _renderTables();
  }));
}

function _isAdmin() { return sessionStorage.getItem('kd_admin') === '1'; }
function _setAdminUi() {
  document.querySelectorAll('.admin-nav').forEach(button => { button.hidden = !_isAdmin(); });
  document.getElementById('admin-login-btn').setAttribute('aria-label', _isAdmin() ? 'Sair do painel administrativo' : 'Abrir login administrativo');
  if (!_isAdmin()) showTab('cardapio');
}

function _initAdminLogin() {
  const access = document.getElementById('admin-login-btn');
  const modal = document.getElementById('login-modal');
  const form = document.getElementById('admin-login-form');
  _setAdminUi();
  access.addEventListener('click', () => {
    if (_isAdmin()) {
      sessionStorage.removeItem('kd_admin');
      _setAdminUi();
      toast('Sessão administrativa encerrada.');
      return;
    }
    modal.classList.add('open');
    document.getElementById('admin-user').focus();
  });
  document.getElementById('login-cancel').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', event => { if (event.target === modal) modal.classList.remove('open'); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('admin-user').value.trim();
    const password = document.getElementById('admin-pass').value;
    const error = document.getElementById('login-error');
    if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
      error.textContent = 'Usuário ou senha incorretos.';
      return;
    }
    sessionStorage.setItem('kd_admin', '1');
    form.reset(); error.textContent = ''; modal.classList.remove('open');
    _setAdminUi();
    _renderProducts();
    showTab('produtos');
    toast('Painel administrativo liberado.');
  });
}

function _initQrTable() {
  _qrTable = new URLSearchParams(location.search).get('mesa') || '';
  if (_qrTable) {
    document.getElementById('table-context').textContent = `Cardápio da ${_qrTable}`;
    document.getElementById('table-context').hidden = false;
    document.getElementById('order-table-label').textContent = _qrTable;
    document.getElementById('order-type').value = 'mesa';
  } else document.getElementById('order-type').value = 'retirada';
  _syncOrderFields();
}

function _initProductEditor() {
  const form = document.getElementById('product-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const idValue = document.getElementById('product-id').value;
    const product = {
      name: document.getElementById('product-name').value.trim(),
      desc: document.getElementById('product-desc').value.trim(),
      cat: document.getElementById('product-category').value,
      price: Number(document.getElementById('product-price').value),
    };
    if (!product.name || !product.desc || !Number.isFinite(product.price) || product.price <= 0) return toast('Confira os dados do produto.');
    const menu = getMenu();
    if (idValue) {
      const current = menu.find(item => item.id === Number(idValue));
      if (current) Object.assign(current, product);
    } else {
      product.id = Math.max(0, ...menu.map(item => Number(item.id) || 0)) + 1;
      menu.push(product);
    }
    saveMenu(menu); renderMenu(); _renderProducts(); _resetProductForm();
    toast(idValue ? 'Produto atualizado.' : 'Produto cadastrado.');
  });
  document.getElementById('product-cancel').addEventListener('click', _resetProductForm);
  document.getElementById('admin-product-list').addEventListener('click', event => {
    const editId = event.target.dataset.editProduct;
    const deleteId = event.target.dataset.deleteProduct;
    if (editId) {
      const item = getMenu().find(product => product.id === Number(editId));
      if (!item) return;
      document.getElementById('product-id').value = item.id;
      document.getElementById('product-name').value = item.name;
      document.getElementById('product-desc').value = item.desc;
      document.getElementById('product-category').value = item.cat;
      document.getElementById('product-price').value = Number(item.price).toFixed(2);
      document.getElementById('product-form-title').textContent = 'Editar produto';
      document.getElementById('product-save').textContent = 'Salvar alterações';
      document.getElementById('product-cancel').hidden = false;
      document.getElementById('product-name').focus();
    }
    if (deleteId && window.confirm('Excluir este produto do cardápio neste navegador?')) {
      const menu = getMenu().filter(item => item.id !== Number(deleteId));
      setMenu(menu); saveMenu(menu); renderMenu(); _renderProducts();
      if (document.getElementById('product-id').value === deleteId) _resetProductForm();
      toast('Produto removido.');
    }
  });
  _renderProducts();
}

function _renderProducts() {
  const list = document.getElementById('admin-product-list');
  if (!list) return;
  list.innerHTML = getMenu().map(item => `
    <article class="admin-product-card">
      <div class="admin-product-info"><strong>${_escape(item.name)}</strong><span>${_escape(item.desc)}</span><small>${item.cat === 'especial' ? 'Especial' : 'Tradicional'} · R$ ${Number(item.price).toFixed(2).replace('.', ',')}</small></div>
      <div class="admin-product-actions"><button type="button" class="btn-save-price" data-edit-product="${item.id}">Editar</button><button type="button" class="btn-status btn-del" data-delete-product="${item.id}">Excluir</button></div>
    </article>`).join('') || '<p>Nenhum produto cadastrado.</p>';
}

function _resetProductForm() {
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('product-form-title').textContent = 'Cadastrar produto';
  document.getElementById('product-save').textContent = 'Salvar produto';
  document.getElementById('product-cancel').hidden = true;
}

function _initTableManager() {
  document.getElementById('table-add').addEventListener('click', () => {
    const input = document.getElementById('table-name');
    const name = input.value.trim();
    if (!name) return toast('Digite o nome ou número da mesa.');
    const tables = loadTables();
    if (tables.some(table => table.name.toLowerCase() === name.toLowerCase())) return toast('Essa mesa já está cadastrada.');
    tables.push({ id: String(Date.now()), name });
    saveTables(tables); input.value = ''; _renderTables(); toast('Mesa cadastrada e QR Code gerado.');
  });
  document.getElementById('table-list').addEventListener('click', event => {
    const id = event.target.dataset.deleteTable;
    if (!id || !window.confirm('Excluir esta mesa? O QR Code deixará de ser listado.')) return;
    saveTables(loadTables().filter(table => table.id !== id)); _renderTables();
  });
  _renderTables();
}

function _renderTables() {
  const list = document.getElementById('table-list');
  if (!list) return;
  const tables = loadTables();
  list.innerHTML = tables.map(table => {
    const target = new URL(location.href); target.search = ''; target.hash = '';
    target.searchParams.set('mesa', table.name);
    const menuUrl = target.href;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(menuUrl)}`;
    return `<article class="table-card"><strong>${_escape(table.name)}</strong><img src="${qrUrl}" alt="QR Code de ${_escape(table.name)}" loading="lazy"><a href="${_escape(menuUrl)}" target="_blank" rel="noopener">Abrir cardápio desta mesa</a><button class="btn-status btn-del" type="button" data-delete-table="${_escape(table.id)}">Excluir mesa</button></article>`;
  }).join('') || '<p>Nenhuma mesa cadastrada.</p>';
}

function _initStoreConfig() {
  document.getElementById('store-name').value = _config.nome;
  document.getElementById('store-whatsapp').value = _digits(_config.whatsapp);
  document.getElementById('store-maps').value = _config.endereco;
  document.getElementById('store-config-form').addEventListener('submit', event => {
    event.preventDefault();
    const config = {
      nome: document.getElementById('store-name').value.trim(),
      whatsapp: _digits(document.getElementById('store-whatsapp').value),
      endereco: document.getElementById('store-maps').value.trim(),
    };
    if (!config.nome || config.whatsapp.length < 10 || !config.endereco) return toast('Preencha nome, WhatsApp com DDD e link do Maps.');
    _config = config; saveConfig(config); _applyStoreInfo(); toast('Configurações salvas neste navegador.');
  });
}

function _applyStoreInfo() {
  const route = _mapsUrl(_config.endereco);
  const storeRoute = document.getElementById('store-route');
  storeRoute.href = route; storeRoute.hidden = false;
  document.getElementById('pickup-route').href = route;
  document.querySelector('.logo-title').textContent = _config.nome.replace(/\s+Pastelaria$/i, '');
  document.querySelector('.footer-brand strong').textContent = _config.nome;
  const displayPhone = _formatPhone(_config.whatsapp);
  document.querySelector('.whatsapp-banner span:last-child').textContent = `${displayPhone} — Peça também pelo WhatsApp!`;
  const wa = document.getElementById('footer-whatsapp');
  wa.href = `https://wa.me/${_digits(_config.whatsapp)}`; wa.textContent = `WhatsApp: ${displayPhone}`;
  document.getElementById('footer-maps').href = route;
  document.getElementById('share-menu-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(`Confira o cardápio da ${_config.nome}: ${location.href}`)}`;
}

function _mapsUrl(value) {
  return /^https:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps\/)/i.test(value)
    ? value
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value)}`;
}
function _digits(value) { return String(value || '').replace(/\D/g, ''); }
function _formatPhone(value) {
  let digits = _digits(value);
  if (digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}
function _escape(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

function _syncOrderFields() {
  const type = document.getElementById('order-type').value;
  document.getElementById('table-select-row').hidden = type !== 'mesa';
  document.getElementById('pickup-route-row').hidden = type !== 'retirada';
  document.getElementById('delivery-address-row').hidden = type !== 'entrega';
}

function _finishOrder() {
  const cart = getCart();
  if (!cart.length) return toast('Adicione itens ao pedido primeiro!');
  const customer = document.getElementById('cust-name').value.trim() || 'Cliente';
  const notes = document.getElementById('cust-obs').value.trim();
  const type = document.getElementById('order-type').value;
  const address = document.getElementById('cust-address').value.trim();
  if (type === 'mesa' && !_qrTable) return toast('Leia o QR Code da mesa para identificar onde está.');
  if (type === 'entrega' && !address) return toast('Informe o endereço de entrega.');
  const total = cartTotal();
  const kind = type === 'mesa' ? `Consumo na ${_qrTable}` : type === 'entrega' ? 'Entrega' : 'Retirada';
  const lines = [
    `Olá! Gostaria de fazer um pedido na ${_config.nome}:`, `Cliente: ${customer}`, `Tipo: ${kind}`,
    ...(address ? [`Endereço: ${address}`] : []), '',
    ...cart.map(item => `${item.qty}x ${item.name} — R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}`), '',
    `Total: R$ ${total.toFixed(2).replace('.', ',')}`, ...(notes ? [`Observação: ${notes}`] : []),
  ];
  const url = `https://wa.me/${_digits(_config.whatsapp)}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  clearCart(); document.getElementById('cust-name').value = '';
  document.getElementById('cust-obs').value = ''; document.getElementById('cust-address').value = '';
  closeCart(); toast('Resumo aberto no WhatsApp. Envie a mensagem para confirmar.');
}

document.addEventListener('DOMContentLoaded', init);
