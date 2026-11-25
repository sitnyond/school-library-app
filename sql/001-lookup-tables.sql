-- Do not run this against a database that already has book_types / placements
-- or books.type_id / books.placement_id.

-- Lookup tables
create table public.book_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Stable ids so the books UPDATE below is deterministic
insert into public.book_types (id, name) values
  ('11111111-1111-4111-8111-111111111001', 'Beletrie 1. stupeň'),
  ('11111111-1111-4111-8111-111111111002', 'Beletrie 2. stupeň'),
  ('11111111-1111-4111-8111-111111111003', 'Odborná literatura'),
  ('11111111-1111-4111-8111-111111111004', 'Časopis'),
  ('11111111-1111-4111-8111-111111111005', 'Hry'),
  ('11111111-1111-4111-8111-111111111006', 'Ostatní');

insert into public.placements (id, name) values
  ('22222222-2222-4222-8222-222222222001', 'R1'),
  ('22222222-2222-4222-8222-222222222002', 'R2'),
  ('22222222-2222-4222-8222-222222222003', 'R3'),
  ('22222222-2222-4222-8222-222222222004', 'R4'),
  ('22222222-2222-4222-8222-222222222005', 'R5');

-- Point existing books at the seeded rows
alter table public.books
  add column type_id uuid,
  add column placement_id uuid;

update public.books set type_id = '11111111-1111-4111-8111-111111111001' where type = 'fiction_1';
update public.books set type_id = '11111111-1111-4111-8111-111111111002' where type = 'fiction_2';
update public.books set type_id = '11111111-1111-4111-8111-111111111003' where type = 'education';
update public.books set type_id = '11111111-1111-4111-8111-111111111004' where type = 'magazine';
update public.books set type_id = '11111111-1111-4111-8111-111111111005' where type = 'games';
update public.books set type_id = '11111111-1111-4111-8111-111111111006' where type = 'other';

update public.books set placement_id = '22222222-2222-4222-8222-222222222001' where placement = 'R1';
update public.books set placement_id = '22222222-2222-4222-8222-222222222002' where placement = 'R2';
update public.books set placement_id = '22222222-2222-4222-8222-222222222003' where placement = 'R3';
update public.books set placement_id = '22222222-2222-4222-8222-222222222004' where placement = 'R4';
update public.books set placement_id = '22222222-2222-4222-8222-222222222005' where placement = 'R5';

-- Stop if any book did not match a known type/placement
do $$
begin
  if exists (
    select 1 from public.books
    where type_id is null or placement_id is null
  ) then
    raise exception 'Some books have unknown type or placement values. Inspect books.type / books.placement, then re-run.';
  end if;
end $$;

alter table public.books
  alter column type_id set not null,
  alter column placement_id set not null;

alter table public.books
  add constraint books_type_id_fkey
    foreign key (type_id) references public.book_types (id) on delete restrict,
  add constraint books_placement_id_fkey
    foreign key (placement_id) references public.placements (id) on delete restrict;

alter table public.books
  drop column type,
  drop column placement;

-- RLS: any signed-in user can manage lookups
alter table public.book_types enable row level security;
alter table public.placements enable row level security;

create policy "authenticated_all_book_types"
  on public.book_types
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_placements"
  on public.placements
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.book_types to authenticated;
grant select, insert, update, delete on public.placements to authenticated;
