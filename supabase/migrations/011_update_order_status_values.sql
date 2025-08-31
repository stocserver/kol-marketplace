-- Update order status constraint to include all needed statuses
alter table public.orders drop constraint if exists orders_status_check;

-- Add updated constraint with all status values
alter table public.orders 
add constraint orders_status_check 
check (status in (
  'pending', 
  'paid', 
  'in_progress', 
  'submitted', 
  'revision', 
  'delivered', 
  'completed', 
  'cancelled',
  'disputed'
));