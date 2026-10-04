/** Supabase REST/Auth client for the static Vercel app. */
export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
export const SUPABASE_ANON_KEY = 'COLE_SUA_CHAVE_PUBLISHABLE_OU_ANON_AQUI';
export const SUPABASE_ADMIN_EMAIL = 'COLE_O_EMAIL_CRIADO_NO_SUPABASE_AQUI';

const SESSION_KEY = 'kd_supabase_session';
const configured = () => !SUPABASE_URL.includes('SEU-PROJETO') && !SUPABASE_ANON_KEY.includes('COLE_SUA');
const session = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const headers = (extra = {}, auth = true) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${(auth && session()?.access_token) || SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  ...extra,
});

async function request(path, options = {}, auth = true) {
  if (!configured()) throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY em assets/js/supabase.js.');
  let response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: headers(options.headers, auth) });
  if (response.status === 401 && auth && session()?.refresh_token) {
    const old = session();
    const refreshed = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: headers({}, false), body: JSON.stringify({ refresh_token: old.refresh_token }),
    });
    if (refreshed.ok) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(await refreshed.json()));
      response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: headers(options.headers, auth) });
    }
  }
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;
  if (!response.ok) throw new Error(data?.message || data?.msg || `Supabase respondeu ${response.status}.`);
  return data;
}

export function isSupabaseConfigured() { return configured(); }
export async function verifyAdminSession() {
  if (!session()?.access_token || !configured()) return false;
  try { return (await request('admin_users?select=user_id&limit=1')).some(row => row.user_id === session().user?.id); }
  catch { return false; }
}

export async function signInAdmin(email, password) {
  if (!configured()) throw new Error('Configure o Supabase antes de entrar na gestão.');
  if (!email || email.includes('COLE_O_EMAIL')) throw new Error('Informe em supabase.js o e-mail do usuário administrador do Supabase.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: headers({}, false), body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Usuário ou senha inválidos.');
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  const admins = await request('admin_users?select=user_id&limit=1');
  if (!admins.some(row => row.user_id === data.user.id)) {
    await signOutAdmin();
    throw new Error('Este usuário não tem permissão de administrador.');
  }
  return data;
}

export async function signOutAdmin() {
  const current = session();
  if (current?.access_token && configured()) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers() }).catch(() => {});
  }
  localStorage.removeItem(SESSION_KEY);
}

export async function loadRemoteData() {
  const [menu, config] = await Promise.all([
    request('menu_items?select=id,name,description,category,price,active&active=eq.true&order=id.asc', {}, false),
    request('store_config?select=key,value', {}, false),
  ]);
  let tables = [], orders = [];
  if (await verifyAdminSession()) {
    [tables, orders] = await Promise.all([
      request('dining_tables?select=id,name&order=created_at.asc'),
      request('orders?select=*&order=created_at.desc'),
    ]);
  }
  return {
    menu: menu.map(row => ({ id: Number(row.id), name: row.name, desc: row.description, cat: row.category, price: Number(row.price) })),
    config: Object.fromEntries(config.map(row => [row.key, row.value])), tables,
    orders: orders.map(row => ({ id: row.order_code, customer: row.customer, obs: row.notes || '', type: row.order_type, table: row.table_name || '', address: row.delivery_address || '', items: row.items || [], total: Number(row.total), status: row.status, time: new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), createdAt: row.created_at })),
  };
}

export async function createRemoteOrder(order) {
  const [result] = await request('rpc/create_public_order', {
    method: 'POST', body: JSON.stringify({
      p_customer: order.customer, p_notes: order.obs || '', p_type: order.type,
      p_table: order.table || '', p_address: order.address || '',
      p_items: order.items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.qty })),
      p_total: order.total,
    }),
  }, false);
  return result.order_code;
}

export const writeMenu = menu => request('menu_items?on_conflict=id', {
  method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify(menu.map(i => ({ id: i.id, name: i.name, description: i.desc, category: i.cat, price: i.price, active: true }))),
});
export const writeConfig = config => request('store_config?on_conflict=key', {
  method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify(Object.entries(config).map(([key, value]) => ({ key, value: String(value) }))),
});
export const writeTables = tables => request('dining_tables?on_conflict=id', {
  method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify(tables.map(t => ({ id: t.id, name: t.name }))),
});
export const removeRemoteTable = id => request(`dining_tables?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
export const updateRemoteOrder = order => request(`orders?order_code=eq.${encodeURIComponent(order.id)}`, {
  method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: order.status }),
});
export const deleteRemoteOrder = id => request(`orders?order_code=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
