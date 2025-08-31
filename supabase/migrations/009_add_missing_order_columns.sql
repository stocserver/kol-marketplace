-- Add missing Stripe-related columns to orders table
alter table public.orders 
add column if not exists stripe_payment_intent_id text,
add column if not exists stripe_application_fee integer;

-- Add indexes for the new columns
create index if not exists idx_orders_stripe_payment_intent_id on public.orders(stripe_payment_intent_id);

-- Also check if payment_attempts table exists (referenced in the API)
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stripe_payment_intent_id text,
  status text not null default 'created',
  amount integer not null,
  application_fee_amount integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for payment_attempts
create index if not exists idx_payment_attempts_order_id on public.payment_attempts(order_id);
create index if not exists idx_payment_attempts_stripe_payment_intent_id on public.payment_attempts(stripe_payment_intent_id);
create index if not exists idx_payment_attempts_status on public.payment_attempts(status);

-- Add RLS policies for payment_attempts
create policy "Users can view their payment attempts" on public.payment_attempts
  for select using (
    exists (
      select 1 from public.orders 
      where orders.id = payment_attempts.order_id 
      and (orders.sponsor_id = auth.uid() or orders.kol_id = auth.uid())
    )
  );

create policy "System can insert payment attempts" on public.payment_attempts
  for insert with check (true); -- This would be restricted in production

-- Add updated_at trigger for payment_attempts
create trigger set_updated_at_payment_attempts
  before update on public.payment_attempts
  for each row execute function public.handle_updated_at();