-- Create reviews/ratings table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewed_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for reviews
create index if not exists idx_reviews_order_id on public.reviews(order_id);
create index if not exists idx_reviews_reviewer_id on public.reviews(reviewer_id);
create index if not exists idx_reviews_reviewed_id on public.reviews(reviewed_id);
create index if not exists idx_reviews_rating on public.reviews(rating);

-- Add RLS policies for reviews
create policy "Users can view reviews for their orders" on public.reviews
  for select using (
    reviewer_id = auth.uid() or 
    reviewed_id = auth.uid() or 
    exists (
      select 1 from public.orders 
      where orders.id = reviews.order_id 
      and (orders.sponsor_id = auth.uid() or orders.kol_id = auth.uid())
    )
  );

create policy "Users can create reviews for completed orders" on public.reviews
  for insert with check (
    reviewer_id = auth.uid() and
    exists (
      select 1 from public.orders 
      where orders.id = order_id 
      and orders.status = 'completed'
      and (orders.sponsor_id = auth.uid() or orders.kol_id = auth.uid())
    )
  );

create policy "Users can update their own reviews" on public.reviews
  for update using (reviewer_id = auth.uid());

-- Add updated_at trigger for reviews
create trigger set_updated_at_reviews
  before update on public.reviews
  for each row execute function public.handle_updated_at();

-- Add average rating calculation function
create or replace function get_user_average_rating(user_id uuid)
returns numeric as $$
declare
  avg_rating numeric;
begin
  select avg(rating)::numeric(3,2) into avg_rating
  from public.reviews 
  where reviewed_id = user_id;
  
  return coalesce(avg_rating, 0);
end;
$$ language plpgsql;

-- Add total earnings calculation function for KOLs
create or replace function get_kol_total_earnings(kol_user_id uuid)
returns integer as $$
declare
  total_earnings integer;
begin
  select coalesce(sum(kol_earnings), 0) into total_earnings
  from public.orders 
  where kol_id = kol_user_id 
  and status in ('delivered', 'completed');
  
  return total_earnings;
end;
$$ language plpgsql;

-- Add pending earnings calculation function for KOLs
create or replace function get_kol_pending_earnings(kol_user_id uuid)
returns integer as $$
declare
  pending_earnings integer;
begin
  select coalesce(sum(kol_earnings), 0) into pending_earnings
  from public.orders 
  where kol_id = kol_user_id 
  and status = 'delivered';
  
  return pending_earnings;
end;
$$ language plpgsql;

-- Add monthly earnings calculation function for KOLs
create or replace function get_kol_monthly_earnings(kol_user_id uuid)
returns integer as $$
declare
  monthly_earnings integer;
begin
  select coalesce(sum(kol_earnings), 0) into monthly_earnings
  from public.orders 
  where kol_id = kol_user_id 
  and status in ('delivered', 'completed')
  and created_at >= date_trunc('month', current_date);
  
  return monthly_earnings;
end;
$$ language plpgsql;