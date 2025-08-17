-- Enable RLS
alter table if exists public.profiles enable row level security;

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null check (user_type in ('kol', 'sponsor')),
  username text unique not null,
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create gigs table
create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  kol_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price integer not null check (price >= 300 and price <= 50000),
  delivery_days integer not null check (delivery_days >= 1 and delivery_days <= 30),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  sponsor_id uuid not null references public.profiles(id) on delete cascade,
  kol_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'in_progress', 'delivered', 'completed', 'cancelled')),
  amount integer not null,
  platform_fee integer not null,
  kol_earnings integer not null,
  requirements text,
  delivery_url text,
  ecpay_trade_no text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_gigs_kol_id on public.gigs(kol_id);
create index if not exists idx_gigs_is_active on public.gigs(is_active);
create index if not exists idx_orders_sponsor_id on public.orders(sponsor_id);
create index if not exists idx_orders_kol_id on public.orders(kol_id);
create index if not exists idx_orders_status on public.orders(status);

-- RLS Policies

-- Profiles policies
create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Gigs policies
create policy "Anyone can view active gigs" on public.gigs
  for select using (is_active = true or kol_id = auth.uid());

create policy "KOLs can create their own gigs" on public.gigs
  for insert with check (kol_id = auth.uid());

create policy "KOLs can update their own gigs" on public.gigs
  for update using (kol_id = auth.uid());

create policy "KOLs can delete their own gigs" on public.gigs
  for delete using (kol_id = auth.uid());

-- Orders policies
create policy "Users can view their own orders" on public.orders
  for select using (sponsor_id = auth.uid() or kol_id = auth.uid());

create policy "Sponsors can create orders" on public.orders
  for insert with check (sponsor_id = auth.uid());

create policy "Order participants can update orders" on public.orders
  for update using (sponsor_id = auth.uid() or kol_id = auth.uid());

-- Functions for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_gigs
  before update on public.gigs
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_orders
  before update on public.orders
  for each row execute function public.handle_updated_at();