/**
 * ui.js — Funções utilitárias de interface
 * Ki-Delícia Pastelaria
 */

/* ── Toast ── */
let _toastTimer = null;

/**
 * Exibe uma notificação temporária na tela.
 * @param {string} msg
 * @param {number} [duration=2800]
 */
export function toast(msg, duration = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/* ── Modal de confirmação ── */
let _modalCallback = null;

/**
 * Abre o modal de confirmação.
 * @param {string} title
 * @param {string} msg
 * @param {() => void} onConfirm
 */
export function openModal(title, msg, onConfirm) {
  const backdrop = document.getElementById('modal');
  const titleEl  = document.getElementById('modal-title');
  const msgEl    = document.getElementById('modal-msg');
  const confirmBtn = document.getElementById('modal-confirm');

  if (!backdrop || !titleEl || !msgEl || !confirmBtn) return;

  titleEl.textContent = title;
  msgEl.textContent   = msg;
  _modalCallback = onConfirm;

  confirmBtn.onclick = () => {
    closeModal();
    if (_modalCallback) _modalCallback();
  };

  backdrop.classList.add('open');
}

export function closeModal() {
  document.getElementById('modal')?.classList.remove('open');
}

/* ── Carrinho Drawer ── */
export function openCart() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('open');
}

export function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('open');
}

export function toggleCart() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  if (drawer.classList.contains('open')) closeCart();
  else openCart();
}

/* ── Formatação ── */
/**
 * Formata um número como moeda brasileira.
 * @param {number} value
 * @returns {string} Ex: "R$ 12,50"
 */
export function formatBRL(value) {
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

/* ── Tabs ── */
/**
 * Exibe a aba correspondente ao nome dado.
 * @param {string} name
 * @param {Function} [onSwitch] callback opcional com o nome da aba
 */
export function showTab(name, onSwitch) {
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('tab-' + name)?.classList.add('active');

  // Ativa o botão correto pelo data-tab
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.dataset.tab === name) b.classList.add('active');
  });

  if (onSwitch) onSwitch(name);
}
