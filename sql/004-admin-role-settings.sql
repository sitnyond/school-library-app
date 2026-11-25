-- Role-based access control for Settings (app_metadata.role = 'admin').
-- Regular signed-in users default to 'teacher': they can read lookups and
-- app_settings, but only 'admin' can modify them.

begin;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'teacher');
$$;

-- book_types: authenticated can read, only admin can write
drop policy if exists "authenticated_all_book_types" on public.book_types;
drop policy if exists "authenticated_read_book_types" on public.book_types;
drop policy if exists "admin_write_book_types" on public.book_types;

create policy "authenticated_read_book_types"
  on public.book_types for select to authenticated
  using (true);

create policy "admin_write_book_types"
  on public.book_types for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- placements: authenticated can read, only admin can write
drop policy if exists "authenticated_all_placements" on public.placements;
drop policy if exists "authenticated_read_placements" on public.placements;
drop policy if exists "admin_write_placements" on public.placements;

create policy "authenticated_read_placements"
  on public.placements for select to authenticated
  using (true);

create policy "admin_write_placements"
  on public.placements for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- classes: authenticated can read, only admin can write
drop policy if exists "authenticated_all_classes" on public.classes;
drop policy if exists "authenticated_read_classes" on public.classes;
drop policy if exists "admin_write_classes" on public.classes;

create policy "authenticated_read_classes"
  on public.classes for select to authenticated
  using (true);

create policy "admin_write_classes"
  on public.classes for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- app_settings: authenticated can read, only admin can update
drop policy if exists "authenticated_update_app_settings" on public.app_settings;
drop policy if exists "admin_update_app_settings" on public.app_settings;

create policy "admin_update_app_settings"
  on public.app_settings for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

commit;

-- ---------------------------------------------------------------------
-- Příklad přidělení role admin konkrétnímu uživateli (spustit zvlášť):
--
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- where email = 'admin@skola.cz';
--
-- Odebrání role admin (návrat na výchozí 'teacher'):
--
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data - 'role'
-- where email = 'admin@skola.cz';
--
-- Pozn.: po změně role se uživatel musí jednou odhlásit a znovu přihlásit.
-- ---------------------------------------------------------------------
