create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists chat_threads_unique
  on public.chat_threads (user_id, trainer_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

create policy if not exists "chat_threads_select"
  on public.chat_threads
  for select
  using (auth.uid() = user_id or auth.uid() = trainer_id);

create policy if not exists "chat_threads_insert"
  on public.chat_threads
  for insert
  with check (auth.uid() = user_id or auth.uid() = trainer_id);

create policy if not exists "chat_messages_select"
  on public.chat_messages
  for select
  using (
    exists (
      select 1
      from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (auth.uid() = t.user_id or auth.uid() = t.trainer_id)
    )
  );

create policy if not exists "chat_messages_insert"
  on public.chat_messages
  for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (auth.uid() = t.user_id or auth.uid() = t.trainer_id)
    )
  );
