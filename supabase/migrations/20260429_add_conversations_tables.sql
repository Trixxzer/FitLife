create extension if not exists "pgcrypto";

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trainer_id uuid not null references auth.users (id) on delete cascade,
  phase text not null check (phase in ('pre', 'post')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create unique index if not exists conversations_unique_pair
  on public.conversations (user_id, trainer_id, phase);

create index if not exists conversations_user_id_idx
  on public.conversations (user_id);

create index if not exists conversations_trainer_id_idx
  on public.conversations (trainer_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select_participants"
  on public.conversations for select
  using (auth.uid() = user_id or auth.uid() = trainer_id);

create policy "conversations_insert_participants"
  on public.conversations for insert
  with check (auth.uid() = user_id or auth.uid() = trainer_id);

create policy "conversations_update_participants"
  on public.conversations for update
  using (auth.uid() = user_id or auth.uid() = trainer_id);

create policy "messages_select_participants"
  on public.messages for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_id = auth.uid() or c.trainer_id = auth.uid())
    )
  );

create policy "messages_insert_sender"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_id = auth.uid() or c.trainer_id = auth.uid())
    )
  );

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
