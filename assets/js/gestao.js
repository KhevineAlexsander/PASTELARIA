/**
 * gestao.js — Painel de gestão: edição de preços e configurações
 * Ki-Delícia Pastelaria
 */

import { getMenu, updateMenuItemPrice } from './menu.js';
import { saveMenu, saveConfig as persistConfig, loadConfig } from './storage.js';
import { renderMenu } from './menu.js';
import { renderStats } from './orders.js';
import { toast } from './ui.js';

/**
 * Renderiza a lista de edição de preços do cardápio.
 */
export function renderEditList() {
  const listEl = document.getElementById('edit-list');
  if (!listEl) return;

  const menu = getMenu();
  listEl.innerHTML = menu.map(i => `
    <div class="edit-card">
      <div class="edit-card-info">
        <div class="edit-card-name">${i.name}</div>
        <div class="edit-card-desc">${i.cat === 'especial' ? '⭐ Especial' : 'Tradicional'}</div>
      </div>
      <input
        class="edit-price-field"
        type="number"
        id="ep-${i.id}"
        value="${i.price.toFixed(2)}"
        step="0.01"
        min="0"
        aria-label="Preço de ${i.name}"
      />
      <button class="btn-save-price" data-id="${i.id}">✔</button>
    </div>`).join('');

  listEl.querySelectorAll('.btn-save-price').forEach(btn => {
    btn.addEventListener('click', () => _savePrice(Number(btn.dataset.id)));
  });
}

function _savePrice(id) {
  const input = document.getElementById('ep-' + id);
  const val   = parseFloat(input?.value);
  if (isNaN(val) || val < 0) {
    toast('Preço inválido! ❌');
    return;
  }
  const ok = updateMenuItemPrice(id, val);
  if (ok) {
    saveMenu(getMenu());
    renderMenu();
    toast(`Preço atualizado com sucesso! 💰`);
  }
}

/* ── Configurações da loja ── */

/**
 * Carrega as configurações salvas nos campos do formulário.
 */
export function loadConfigForm() {
  const cfg = loadConfig();
  _setVal('cfg-nome', cfg.nome || 'Ki-Delícia Pastelaria');
  _setVal('cfg-wpp',  cfg.wpp  || '(99) 98443-6545');
  _setVal('cfg-end',  cfg.endereco || '');
}

/**
 * Salva as configurações da loja.
 */
export function saveConfigForm() {
  const cfg = {
    nome:     _getVal('cfg-nome'),
    wpp:      _getVal('cfg-wpp'),
    endereco: _getVal('cfg-end'),
  };
  persistConfig(cfg);
  _applyConfig(cfg);
  toast('Configurações salvas! ✅');
}

function _applyConfig(cfg) {
  // Atualiza o banner do WhatsApp dinamicamente
  const banner = document.querySelector('.whatsapp-banner span:last-child');
  if (banner && cfg.wpp) {
    banner.textContent = `${cfg.wpp} — Peça também pelo WhatsApp!`;
  }
}

function _getVal(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function _setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/**
 * Renderiza o painel de gestão completo.
 */
export function renderGestao() {
  renderStats();
  renderEditList();

  // Atualiza a contagem de itens do cardápio no painel
  const statEl = document.getElementById('stat-menu-count');
  if (statEl) statEl.textContent = getMenu().length;
}
