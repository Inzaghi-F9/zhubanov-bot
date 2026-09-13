# ARSU Мобильность (zhubanov-bot)

Платформа академической мобильности Актюбинского регионального университета
им. К. Жубанова (АРСУ): подача заявок студентами, проверка факультетом и
департаментом, ИИ-ассистент на базе Groq (Llama 3.3 70B), email-уведомления Resend.

## Стек

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Supabase (Auth + PostgreSQL RLS + Storage) · Groq · Resend · Recharts

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # заполни ключи
npm run dev                  # http://localhost:3000
```

## Настройка Supabase (обязательно)

1. Supabase Dashboard → **SQL Editor** → вставь и выполни `supabase/migration.sql`
   целиком (идемпотентна, старые таблицы переименует в `*_legacy`).
2. Регистрируй нужные аккаунты через страницу `/auth`, затем назначь роли:
   ```sql
   update public.profiles set role = 'admin'   where email = 'admin@arsu.kz';
   update public.profiles set role = 'faculty' where email = 'faculty@arsu.kz';
   ```
3. В Settings → Auth → URL Configuration укажи адрес сайта (для писем сброса пароля).

## Безопасность

- Единая авторизация Supabase Auth — пароли хранятся только зашифрованными,
  plaintext-дублей нет.
- Сессия в httpOnly-cookie (`@supabase/ssr`), проверка роли в `middleware.ts`
  на сервере и **RLS-политиками в PostgreSQL** — клиент физически не может
  читать чужие заявки или менять статусы.
- Документы и аватары — в Supabase Storage (приватный bucket `documents`
  с подписанными ссылками), а не base64 в таблице.
- `/api/notify` доступен только faculty/admin (проверка сессии на сервере).
- `/api/chat` защищён rate-limit по IP.

## Деплой

Оптимально — **Vercel** (API-роуты работают как serverless-функции, ключи
остаются секретными; GitHub Pages не подходит — там нет серверного рантайма).

1. Импортируй репозиторий в Vercel.
2. Environment Variables: все переменные из `.env.example`.
3. Deploy.

## Структура

```
app/                    страницы (лендинг с чатом, auth, кабинет студента,
                        кабинет факультета, админка)
app/api/chat            стриминговый ИИ-ассистент (SSE, база знаний, rate-limit)
app/api/notify          email-уведомления (только для staff)
components/             StatusBadge, StatusTimeline, ChatBox, FileUpload
lib/                    клиенты Supabase, типы, статусы, база знаний, Storage
supabase/migration.sql  схема БД + RLS + Storage + триггеры
middleware.ts           серверная защита маршрутов по ролям
```