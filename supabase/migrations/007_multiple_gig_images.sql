-- Add image_urls array field to store up to 3 images per gig
alter table public.gigs 
add column if not exists image_urls text[] default '{}';

-- Add index for image_urls queries
create index if not exists idx_gigs_image_urls on public.gigs using gin(image_urls);

-- Update existing gigs to move preview_image_url to image_urls array
update public.gigs 
set image_urls = case 
  when preview_image_url is not null and preview_image_url != '' 
  then array[preview_image_url]
  else '{}'
end
where image_urls = '{}';