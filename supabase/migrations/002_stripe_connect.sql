-- Add Stripe Connect fields to profiles table
alter table public.profiles 
add column if not exists stripe_account_id text,
add column if not exists stripe_onboarding_complete boolean default false,
add column if not exists stripe_charges_enabled boolean default false,
add column if not exists stripe_payouts_enabled boolean default false;

-- Update orders table for Stripe payments
alter table public.orders 
drop column if exists ecpay_trade_no,
add column if not exists stripe_payment_intent_id text unique,
add column if not exists stripe_application_fee integer;

-- Create payment_attempts table for tracking payment flow
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stripe_payment_intent_id text not null,
  status text not null default 'created' check (status in ('created', 'processing', 'succeeded', 'failed', 'canceled')),
  amount integer not null,
  application_fee_amount integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for new fields
create index if not exists idx_profiles_stripe_account_id on public.profiles(stripe_account_id);
create index if not exists idx_orders_stripe_payment_intent_id on public.orders(stripe_payment_intent_id);
create index if not exists idx_payment_attempts_order_id on public.payment_attempts(order_id);
create index if not exists idx_payment_attempts_status on public.payment_attempts(status);

-- RLS Policies for payment_attempts
alter table public.payment_attempts enable row level security;

create policy "Users can view their own payment attempts" on public.payment_attempts
  for select using (
    exists (
      select 1 from public.orders 
      where orders.id = payment_attempts.order_id 
      and (orders.sponsor_id = auth.uid() or orders.kol_id = auth.uid())
    )
  );

create policy "System can insert payment attempts" on public.payment_attempts
  for insert with check (true);

create policy "System can update payment attempts" on public.payment_attempts
  for update using (true);

-- Add trigger for payment_attempts updated_at
create trigger set_updated_at_payment_attempts
  before update on public.payment_attempts
  for each row execute function public.handle_updated_at();