begin;

alter table public.app_settings
  add column if not exists extension_days integer not null default 30
  check (extension_days between 1 and 365);

commit;
