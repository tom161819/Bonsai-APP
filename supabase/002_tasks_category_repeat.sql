-- Bonsai deník: kategorie a opakování úkolů. Spusťte jednou v Supabase (SQL Editor).
alter table public.tasks
  add column if not exists category text not null default '',
  add column if not exists repeat text not null default '',
  add column if not exists next_id text;

notify pgrst, 'reload schema';
