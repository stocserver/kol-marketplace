-- Enable the storage extension
insert into storage.buckets (id, name, public)
values ('gig-images', 'gig-images', true);

-- Create RLS policies for the gig-images bucket
create policy "Allow authenticated users to upload gig images" on storage.objects
  for insert with check (
    bucket_id = 'gig-images' 
    and auth.role() = 'authenticated'
  );

create policy "Allow public read access to gig images" on storage.objects
  for select using (bucket_id = 'gig-images');

create policy "Allow users to update their own gig images" on storage.objects
  for update using (
    bucket_id = 'gig-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Allow users to delete their own gig images" on storage.objects
  for delete using (
    bucket_id = 'gig-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );