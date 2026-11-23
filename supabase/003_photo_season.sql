-- Bonsai deník: období u fotografií. Spusťte jednou v Supabase (SQL Editor), samostatně v prázdném okně.
alter table public.photos
  add column if not exists season text not null default '';

notify pgrst, 'reload schema';
