-- Create notifications table for in-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  target_path text,
  meta jsonb,
  seen_at timestamptz,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for query performance
create index if not exists idx_notifications_user_created_at
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_unseen
  on public.notifications (user_id)
  where seen_at is null and deleted_at is null;

-- Enable row level security
alter table public.notifications enable row level security;

-- RLS: users can read their own notifications
create policy "Users can view their notifications"
  on public.notifications for select
  using (user_id = auth.uid());

-- RLS: users can update their own notifications (mark seen/read/soft-delete)
create policy "Users can update their notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Optional: Disallow deletes by default; use soft-delete via update (deleted_at)

-- Updated_at trigger
create trigger set_updated_at_notifications
  before update on public.notifications
  for each row execute function public.handle_updated_at();

-- Enable realtime
alter publication supabase_realtime add table public.notifications;

