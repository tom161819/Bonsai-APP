-- Bonsai deník: schéma databáze. Spusťte jednou v Supabase (SQL Editor).
-- Každý pěstitel vidí a mění jen své řádky (Row Level Security).

create table public.trees (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  species text not null default '',
  style text not null default '',
  acquired text not null default '',
  origin text not null default '',
  pot text not null default '',
  notes text not null default '',
  cover_id text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.photos (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tree_id text not null references public.trees (id) on delete cascade,
  path text not null,
  taken_on date not null,
  caption text not null default '',
  focus text not null default 'center',
  season text not null default '',
  created_at timestamptz not null default now()
);

create table public.care_log (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tree_id text not null references public.trees (id) on delete cascade,
  type text not null,
  done_on date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  due text not null default '',
  scope_type text not null default 'general' check (scope_type in ('general', 'tree', 'species')),
  scope_value text not null default '',
  note text not null default '',
  done boolean not null default false,
  done_at date,
  log_id text,
  category text not null default '',
  repeat text not null default '',
  next_id text,
  created_at timestamptz not null default now()
);

create index trees_user on public.trees (user_id);
create index photos_user on public.photos (user_id);
create index care_log_user on public.care_log (user_id);
create index tasks_user on public.tasks (user_id);

alter table public.trees enable row level security;
alter table public.photos enable row level security;
alter table public.care_log enable row level security;
alter table public.tasks enable row level security;

create policy "own trees" on public.trees for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own photos" on public.photos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own care log" on public.care_log for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own tasks" on public.tasks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.trees, public.photos, public.care_log, public.tasks to authenticated;

-- Soukromé úložiště fotografií: soubory leží ve složce pojmenované podle id uživatele.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy "own photo files read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "own photo files add" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "own photo files change" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "own photo files remove" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
