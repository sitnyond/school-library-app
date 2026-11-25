begin;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  loan_days integer not null default 30 check (loan_days between 1 and 365)
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  book_id bigint not null references public.books (id) on delete restrict,
  class_id uuid not null references public.classes (id) on delete restrict,
  borrower_name text, 
  loaned_at date not null default current_date,
  due_date date not null,
  returned_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_by_email text default (auth.jwt() ->> 'email'),

  constraint loans_due_after_loan
    check (due_date >= loaned_at),
  constraint loans_anonymized_when_returned
    check (returned_at is null or borrower_name is null),
  constraint loans_name_when_active
    check (returned_at is not null or (borrower_name is not null and length(trim(borrower_name)) > 0))
);

create index if not exists loans_active_book_idx on public.loans (book_id) where returned_at is null;
create index if not exists loans_class_idx on public.loans (class_id);
create index if not exists loans_returned_at_idx on public.loans (returned_at);

alter table public.classes enable row level security;
alter table public.loans enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "authenticated_all_classes" on public.classes;
create policy "authenticated_all_classes"
  on public.classes for all to authenticated
  using (true) with check (true);

drop policy if exists "authenticated_all_loans" on public.loans;
create policy "authenticated_all_loans"
  on public.loans for all to authenticated
  using (true) with check (true);

drop policy if exists "authenticated_read_app_settings" on public.app_settings;
create policy "authenticated_read_app_settings"
  on public.app_settings for select to authenticated
  using (true);

drop policy if exists "authenticated_update_app_settings" on public.app_settings;
create policy "authenticated_update_app_settings"
  on public.app_settings for update to authenticated
  using (true) with check (true);

grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.loans to authenticated;
grant select, update on public.app_settings to authenticated;

insert into public.classes (name) values
  ('6.A'), ('6.B'), ('7.A'), ('7.B'), ('8.A'), ('8.B'), ('9.A'), ('9.B')
on conflict (name) do nothing;
-- ---------------------------------------------------------------------
commit;