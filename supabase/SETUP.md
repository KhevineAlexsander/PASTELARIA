# Configuração do Supabase

## 1. Criar o banco

No painel do Supabase, abra **SQL Editor → New query** e execute nesta ordem:

1. `migrations/001_initial_schema.sql` (somente se ainda não executou a migração inicial).
2. `migrations/002_app_integration.sql`.

A segunda migração adapta pedidos e mesas ao app, configura leitura pública do cardápio e restringe a gestão a usuários cadastrados em `admin_users`.

## 2. Criar a conta administrativa

Em **Authentication → Users**, crie o usuário administrativo com e-mail e senha. Depois, no SQL Editor, associe esse usuário ao papel de administrador. Substitua o e-mail pelo mesmo usado ao criar a conta:

```sql
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'SEU-EMAIL-ADMIN'
ON CONFLICT (user_id) DO NOTHING;
```

O nome de usuário mostrado no site continua sendo `pasteladm`. A autenticação do Supabase usa o e-mail configurado abaixo e a senha definida na conta do Supabase.

## 3. Conectar o site

Em **Project Settings → API**, copie a Project URL e a chave pública `anon`/publishable. Preencha as três constantes no início de `assets/js/supabase.js`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_ADMIN_EMAIL` (e-mail da conta administrativa)

A chave `anon`/publishable é destinada ao navegador e pode estar no site; nunca coloque uma chave `service_role`/secret nesse arquivo.

Depois publique o site novamente. O cardápio e as configurações passam a vir do Supabase, os pedidos são gravados no banco e aparecem no painel administrativo em outros dispositivos. Mesas e configurações só podem ser alteradas por uma conta associada a `admin_users`.
