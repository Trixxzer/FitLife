-- Enable pgcrypto (required by auth trigger for password hashing)
create extension if not exists pgcrypto;

-- RPC: check if an email exists in auth.users
create or replace function check_email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = pg_catalog, public
as $$
  select exists (select 1 from auth.users where email = p_email);
$$;

-- RPC: reset a user's password (auth.users trigger handles hashing)
create or replace function admin_reset_password(p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  user_id uuid;
begin
  select id into user_id from auth.users where email = p_email;

  if user_id is null then
    return false;
  end if;

  -- The auth.users trigger will auto-hash p_password via crypt()
  update auth.users
  set encrypted_password = p_password,
      updated_at = now(),
      email_confirmed_at = coalesce(email_confirmed_at, now())
  where id = user_id;

  return found;
end;
$$;
