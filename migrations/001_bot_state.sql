-- migrations/001_bot_state.sql
-- Персистентность рантайм-настроек бота (тумблеры событий, ID основного чата).
-- Без этой таблицы src/lib/stateStore.js работает в режиме "молча пропустить" —
-- бот продолжит работать, но настройки будут сбрасываться к дефолтам при каждом рестарте.
--
-- Применить: Supabase SQL Editor -> вставить и выполнить (один раз).

create table if not exists bot_state (
  id smallint primary key default 1,
  main_chat_id text,
  event_toggle_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint bot_state_singleton check (id = 1)
);

-- То же самое для bot_logs, если ещё не создана (см. src/lib/logger.js).
create table if not exists bot_logs (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  level text not null,
  source text,
  event text,
  request_id uuid,
  chat_id text,
  user_id text,
  direction text,
  summary text,
  payload jsonb,
  error text
);

create index if not exists bot_logs_ts_idx on bot_logs (ts desc);
