-- Create order messages table for real-time chat
create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  message text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists idx_order_messages_order_id on public.order_messages(order_id);
create index if not exists idx_order_messages_sender_id on public.order_messages(sender_id);
create index if not exists idx_order_messages_created_at on public.order_messages(created_at);

-- Enable RLS
alter table public.order_messages enable row level security;

-- RLS policies - users can only see messages for orders they're involved in
create policy "Users can view messages for their orders" on public.order_messages
  for select using (
    exists (
      select 1 from public.orders 
      where orders.id = order_messages.order_id 
      and (orders.sponsor_id = auth.uid() or orders.kol_id = auth.uid())
    )
  );

create policy "Users can insert messages for their orders" on public.order_messages
  for insert with check (
    exists (
      select 1 from public.orders 
      where orders.id = order_messages.order_id 
      and (orders.sponsor_id = auth.uid() or orders.kol_id = auth.uid())
    )
    and sender_id = auth.uid()
  );

-- Add updated_at trigger
create trigger set_updated_at_order_messages
  before update on public.order_messages
  for each row execute function public.handle_updated_at();

-- Enable real-time subscriptions
alter publication supabase_realtime add table public.order_messages;