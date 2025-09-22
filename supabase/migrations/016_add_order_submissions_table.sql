-- Create order_submissions table to track all submissions with ordinal numbers
create table if not exists public.order_submissions (
    id uuid default gen_random_uuid() primary key,
    order_id uuid not null references public.orders(id) on delete cascade,
    submission_number integer not null,
    message text not null,
    submitted_by uuid not null references auth.users(id),
    submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.order_submissions enable row level security;

-- Users can view submissions for orders they're involved in (as sponsor or KOL)
create policy "Users can view order submissions for their orders" on public.order_submissions
    for select using (
        order_id in (
            select id from public.orders
            where sponsor_id = auth.uid() or kol_id = auth.uid()
        )
    );

-- Users can insert submissions for orders where they are the KOL
create policy "KOLs can create submissions for their orders" on public.order_submissions
    for insert with check (
        order_id in (
            select id from public.orders
            where kol_id = auth.uid()
        )
    );

-- Create index for performance
create index if not exists idx_order_submissions_order_id on public.order_submissions(order_id);
create index if not exists idx_order_submissions_submission_number on public.order_submissions(order_id, submission_number);

-- Add trigger for updated_at
create or replace function public.handle_updated_at_order_submissions()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger on_order_submissions_updated
    before update on public.order_submissions
    for each row execute procedure public.handle_updated_at_order_submissions();