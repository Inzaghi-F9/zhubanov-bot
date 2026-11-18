-- ============================================================
-- ARSU Academic Mobility — миграция БД (часть 1: таблицы и RLS)
-- Запустить ЦЕЛИКОМ в Supabase Dashboard → SQL Editor → Run
-- Безопасно запускать повторно (идемпотентна)
-- ============================================================

-- 1. Старую таблицу applications (с student_login и паролями) переименовываем
--    в legacy, чтобы не конфликтовать с новой схемой
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'student_login'
  ) then
    alter table public.applications rename to applications_legacy;
  end if;
end $$;

-- 2. Старую таблицу users с открытыми паролями тоже убираем из пути
do $$ begin
  if to_regclass('public.users') is not null then
    alter table public.users rename to users_legacy;
  end if;
end $$;

-- 3. ПРОФИЛИ — роли вместо паролей
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  role        text not null default 'student' check (role in ('student', 'faculty', 'admin')),
  name        text not null default '',
  group_name  text,
  faculty     text,
  phone       text,
  gpa         numeric(3,2),
  course      int2,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Дограция колонок profiles (если таблица уже была создана ранее)
alter table public.profiles add column if not exists faculty text;
alter table public.profiles add column if not exists phone   text;
alter table public.profiles add column if not exists gpa     numeric(3,2);
alter table public.profiles add column if not exists course  int2;

-- 4. ЗАЯВКИ (файлы — пути в Storage, а не base64 в колонках)
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.profiles(id) on delete cascade,
  student_name    text not null,
  student_email   text not null,
  student_group   text,
  student_faculty text,
  student_phone   text,
  student_gpa     numeric(3,2),
  semester        text not null default 'Осень 2026 (1 семестр)',
  university_name text not null,
  purpose         text not null,
  date_from       date not null,
  date_to         date not null,
  status          text not null default 'На проверке (факультет)',
  faculty_comment text not null default '',
  dept_comment    text not null default '',
  file_names      text[] not null default '{}',
  file_paths      text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Дограция колонок applications (если таблица уже была создана ранее)
alter table public.applications add column if not exists student_group   text;
alter table public.applications add column if not exists student_faculty text;
alter table public.applications add column if not exists student_phone   text;
alter table public.applications add column if not exists student_gpa     numeric(3,2);
alter table public.applications add column if not exists semester        text not null default 'Осень 2026 (1 семестр)';

create index if not exists applications_student_idx  on public.applications (student_id);
create index if not exists applications_status_idx   on public.applications (status);
create index if not exists applications_semester_idx on public.applications (semester);
create index if not exists applications_faculty_idx  on public.applications (student_faculty);
create index if not exists applications_created_idx  on public.applications (created_at desc);

-- 5. ХЕЛПЕРЫ РОЛЕЙ (security definer — обходят RLS для чтения своей роли)
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('faculty', 'admin'), false);
$$;

-- 6. RLS
alter table public.profiles     enable row level security;
alter table public.applications enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select using (public.is_staff());

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select using (student_id = auth.uid());

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert with check (student_id = auth.uid());

drop policy if exists "applications_update_own_rejected" on public.applications;
create policy "applications_update_own_rejected" on public.applications
  for update using (
    student_id = auth.uid() and status in ('Отклонён факультетом', 'Ошибка')
  )
  with check (
    student_id = auth.uid() and status = 'На проверке (факультет)'
  );

drop policy if exists "applications_select_staff" on public.applications;
create policy "applications_select_staff" on public.applications
  for select using (public.is_staff());

drop policy if exists "applications_update_staff" on public.applications;
create policy "applications_update_staff" on public.applications
  for update using (public.is_staff());

-- ============================================================
-- ЧАСТЬ 2: триггеры и Storage
-- ============================================================

-- 7. Роль меняет только admin (защита от самоповышения)
create or replace function public.prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and public.my_role() <> 'admin' then
    raise exception 'Только администратор может изменять роли';
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- 8. updated_at поддерживается автоматически
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- 9. Автосоздание профиля при регистрации (name берём из метаданных signup)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, group_name, faculty, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'group_name', ''),
    nullif(new.raw_user_meta_data ->> 'faculty', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 10. STORAGE: документы (приватные) и аватарки (публичные)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false), ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- документы: студент кладёт и читает только свою папку documents/<uid>/...
drop policy if exists "documents_insert_own" on storage.objects;
create policy "documents_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_read_own" on storage.objects;
create policy "documents_read_own" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- документы: staff читает все (для проверки заявок)
drop policy if exists "documents_read_staff" on storage.objects;
create policy "documents_read_staff" on storage.objects
  for select using (bucket_id = 'documents' and public.is_staff());

-- аватарки: читать может кто угодно, писать — только владелец своей папки
drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_write_own" on storage.objects;
create policy "avatars_write_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 11. НАЗНАЧЕНИЕ РОЛЕЙ
-- Зарегистрируй нужные аккаунты через страницу /auth, затем выполни:
--   update public.profiles set role = 'admin'   where email = 'admin@arsu.kz';
--   update public.profiles set role = 'faculty' where email = 'faculty@arsu.kz';
-- ============================================================