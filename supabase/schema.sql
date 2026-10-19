-- Run this in your Supabase SQL editor

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Events (personal calendar)
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean default false,
  color text default '#8b5cf6',
  is_busy boolean default true,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Users can manage own events" on public.events
  for all using (auth.uid() = user_id);

-- Allow friends to read each other's busy slots
create policy "Friends can view busy events" on public.events
  for select using (
    is_busy = true and (
      auth.uid() = user_id or
      exists (
        select 1 from public.friendships
        where status = 'accepted'
          and (
            (requester_id = auth.uid() and addressee_id = user_id) or
            (addressee_id = auth.uid() and requester_id = user_id)
          )
      )
    )
  );

-- Friendships
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "Users can see their own friendships" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send friend requests" on public.friendships
  for insert with check (auth.uid() = requester_id);

create policy "Addressee can update request status" on public.friendships
  for update using (auth.uid() = addressee_id or auth.uid() = requester_id);

create policy "Users can delete their friendships" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Groups
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.groups enable row level security;

create policy "Group members can view groups" on public.groups
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = id and user_id = auth.uid()
    )
  );

create policy "Anyone can create groups" on public.groups
  for insert with check (auth.uid() = created_by);

-- Group members
create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Members can view group membership" on public.group_members
  for select using (
    exists (
      select 1 from public.group_members gm2
      where gm2.group_id = group_id and gm2.user_id = auth.uid()
    )
  );

create policy "Group creator can add members" on public.group_members
  for insert with check (
    exists (
      select 1 from public.groups
      where id = group_id and created_by = auth.uid()
    ) or user_id = auth.uid()
  );
