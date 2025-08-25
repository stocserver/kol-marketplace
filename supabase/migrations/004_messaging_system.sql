-- Create messaging system tables

-- Messages table for storing individual messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  read_at timestamp with time zone null,
  updated_at timestamp with time zone default now()
);

-- Conversations table for grouping messages between two users
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid not null references public.profiles(id) on delete cascade,
  participant_2 uuid not null references public.profiles(id) on delete cascade,
  last_message_id uuid references public.messages(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Ensure unique conversation between two users (regardless of order)
  constraint unique_conversation unique (least(participant_1, participant_2), greatest(participant_1, participant_2))
);

-- Add foreign key constraint for last_message_id after messages table is created
alter table public.conversations 
add constraint conversations_last_message_fkey 
foreign key (last_message_id) references public.messages(id) on delete set null;

-- Add conversation_id to messages table to link messages to conversations
alter table public.messages 
add column conversation_id uuid references public.conversations(id) on delete cascade;

-- Create indexes for performance
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_messages_sender_id on public.messages(sender_id);
create index idx_messages_recipient_id on public.messages(recipient_id);
create index idx_conversations_participants on public.conversations(participant_1, participant_2);
create index idx_conversations_updated_at on public.conversations(updated_at desc);

-- Create function to update conversation's updated_at timestamp when a message is added
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations 
  set updated_at = now(), last_message_id = new.id
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update conversation timestamp
create trigger trigger_update_conversation_timestamp
  after insert on public.messages
  for each row
  execute function update_conversation_timestamp();

-- RLS (Row Level Security) policies
alter table public.messages enable row level security;
alter table public.conversations enable row level security;

-- Messages policies: users can only see messages they sent or received
create policy "Users can view their own messages" on public.messages
  for select using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );

create policy "Users can insert messages they send" on public.messages
  for insert with check (
    auth.uid() = sender_id
  );

create policy "Users can update messages they sent" on public.messages
  for update using (
    auth.uid() = sender_id
  );

-- Conversations policies: users can only see conversations they participate in
create policy "Users can view their conversations" on public.conversations
  for select using (
    auth.uid() = participant_1 or auth.uid() = participant_2
  );

create policy "Users can create conversations they participate in" on public.conversations
  for insert with check (
    auth.uid() = participant_1 or auth.uid() = participant_2
  );

create policy "Users can update their conversations" on public.conversations
  for update using (
    auth.uid() = participant_1 or auth.uid() = participant_2
  );