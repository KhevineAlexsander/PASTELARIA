/**
 * storage.js — Persistência de dados via localStorage
 * Ki-Delícia Pastelaria
 */

const KEYS = {
  MENU:    'kd_menu',
  ORDERS:  'kd_orders',
  NEXT_ID: 'kd_nextid',
  CONFIG:  'kd_config',
};

/**
 * Lê um valor do localStorage e faz parse JSON.
 * Retorna null se não existir ou falhar.
 * @param {string} key
 * @returns {any}
 */
function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Salva um valor no localStorage como JSON.
 * @param {string} key
 * @param {any} value
 */
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] Falha ao salvar:', key, e);
  }
}

/* ── API pública ── */

export function loadMenu(defaultMenu) {
  return read(KEYS.MENU) || defaultMenu;
}

export function saveMenu(menu) {
  write(KEYS.MENU, menu);
}

export function loadOrders() {
  return read(KEYS.ORDERS) || [];
}

export function saveOrders(orders) {
  write(KEYS.ORDERS, orders);
}

export function loadNextId() {
  return read(KEYS.NEXT_ID) || 100;
}

export function saveNextId(id) {
  write(KEYS.NEXT_ID, id);
}

export function loadConfig() {
  return read(KEYS.CONFIG) || {};
}

export function saveConfig(config) {
  write(KEYS.CONFIG, config);
}

/** Salva tudo de uma vez (menu, pedidos e nextId). */
export function saveAll({ menu, orders, nextId }) {
  saveMenu(menu);
  saveOrders(orders);
  saveNextId(nextId);
}
