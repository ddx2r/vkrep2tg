# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Этот файл содержит указания для Claude Code (claude.ai/code) при работе с кодом этого репозитория.

**Language / Язык:** [English](#english) · [Русский](#русский)

---

## English

### What this is

A Node.js bot that receives VK (VKontakte) Callback API webhook events and forwards them as
formatted notifications to Telegram via long-polling (`node-telegram-bot-api`). Entry point is
`server.js`, an Express app. Most code comments and user-facing bot strings are in Russian.

### Commands

- `npm start` — run the bot (`node server.js`)
- `npm test` — run the test suite (`node --test`, Node's built-in test runner)
- `node --test test/vk/dedup.test.js` — run a single test file
- No lint/build step is configured.

#### Required environment variables

`server.js` boots through `src/config.js`, which calls `process.exit(1)` if any of these are
missing: `VK_GROUP_ID`, `VK_SECRET_KEY`, `VK_SERVICE_KEY`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`. Optional: `LEAD_CHAT_ID`, `DEBUG_CHAT_ID`, `ADMIN_USER_IDS` (comma-separated
Telegram user IDs), `BOT_VERSION` (falls back to `package.json` version), `PORT` (default 3000).

### Request flow (the live code path)

```
VK Callback API → POST /webhook (server.js) → secret check (VK_SECRET_KEY) → respond "ok" immediately (VK requires a fast ack or it retries) → src/vk/dedup.js: shouldProcessEvent / rememberEvent (in-memory NodeCache, 10 min TTL, md5 hash of {type, objectId, groupId, date}) → src/vk/events.js: handleVkEvent({ type, object }) → checks src/state.js eventToggleState (per-type on/off, runtime-mutable via Telegram commands, not persisted) → builds a short HTML message (emoji + VK deep link + optional live like counter fetched from VK API) per event type via a big switch statement → src/telegram.js: sendTelegramMessageWithRetry → state.CURRENT_MAIN_CHAT_ID (3 retries, 1s/2s/3s backoff, failures echoed to DEBUG_CHAT_ID)
```

Telegram → bot commands are registered in `src/commands.js` via `bot.onText`, using the same
long-polling `bot` instance from `src/telegram.js`. Admin-only commands check
`isAdmin()` (`src/state.js`) against `ADMIN_USER_IDS`.

All of this — dedup cache, event toggles, and `CURRENT_MAIN_CHAT_ID` — is in-process memory only
and resets on restart.

### Important: two dead/unwired code paths

Several files exist in the repo but are **not imported by `server.js`** and are not part of the
running bot. Don't assume changes to them affect behavior, and don't extend them without wiring
them in (or ask before doing so):

- **`handlers/` and `utils/index.js`** — an older, differently-structured implementation of the
  same event handling (dependency-injection style: each handler receives a context object of
  helper functions). Superseded by the consolidated switch statement in `src/vk/events.js`, which
  has diverged since (different message formats, more event types).
- **`src/lib/events.js` and `src/storage/{firebase,redis,supabase}.js`** — written as ES modules
  (`import`/`export`) in a project that is otherwise CommonJS (`require`/`module.exports`, no
  `"type": "module"` in `package.json`). They also depend on `pino` and `@upstash/redis`, neither
  of which is in `package.json`'s dependencies. Loading these via `require()` will throw. Only
  `src/lib/db.js` and `src/lib/logger.js` (both CommonJS, Supabase-backed) are actually wired into
  `server.js`, for structured request/response logging to a `bot_logs` Supabase table.

If asked to work on logging, dedup, or event-forwarding logic, the source of truth is
`src/vk/events.js`, `src/vk/dedup.js`, `src/lib/logger.js`, and `src/lib/db.js` — not the files
above.

### Cloudflare Worker target

`wrangler.jsonc` points to `src/worker.js`, which is currently just a placeholder `fetch` handler
returning static text — it does not run the actual bot logic (long-polling isn't viable in a
Workers environment). Treat this as a stub/unfinished migration target, not a working deployment.

### Adding a new VK event type

1. Add the event type key to `state.eventToggleState` in `src/state.js` (defaults it to
   delivered/suppressed).
2. Add a `case` in the switch in `src/vk/events.js` `handleVkEvent()`, following the existing
   style: short emoji-prefixed HTML message, `userLink()` for VK profile links,
   `buildObjectLink()`/`absOwner()` for VK deep links where applicable.
3. If the message needs a declined noun (Russian grammatical case), extend
   `objNounDative`/`objNounAblative` rather than hardcoding text inline.

### Testing conventions

Tests use Node's built-in `node:test` + `node:assert/strict` (see `test/vk/dedup.test.js`), not
Jest/Mocha. Place new tests under `test/`, mirroring the `src/` path being tested.

---

## Русский

### Что это такое

Node.js-бот, который принимает события VK Callback API (вебхуки) и пересылает их в виде
форматированных уведомлений в Telegram через long-polling (`node-telegram-bot-api`). Точка входа —
`server.js`, приложение на Express. Большинство комментариев в коде и текстов, видимых
пользователю, написаны на русском языке.

### Команды

- `npm start` — запуск бота (`node server.js`)
- `npm test` — запуск тестов (`node --test`, встроенный тест-раннер Node.js)
- `node --test test/vk/dedup.test.js` — запуск одного тестового файла
- Шаг линтинга/сборки не настроен.

#### Обязательные переменные окружения

`server.js` запускается через `src/config.js`, который вызывает `process.exit(1)`, если
отсутствует хотя бы одна из переменных: `VK_GROUP_ID`, `VK_SECRET_KEY`, `VK_SERVICE_KEY`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Необязательные: `LEAD_CHAT_ID`, `DEBUG_CHAT_ID`,
`ADMIN_USER_IDS` (ID пользователей Telegram через запятую), `BOT_VERSION` (по умолчанию берётся
версия из `package.json`), `PORT` (по умолчанию 3000).

### Поток обработки запроса (реальный рабочий путь кода)

```
VK Callback API → POST /webhook (server.js) → проверка секрета (VK_SECRET_KEY) → немедленный ответ "ok" (VK требует быстрого подтверждения, иначе повторяет запрос) → src/vk/dedup.js: shouldProcessEvent / rememberEvent (кэш NodeCache в памяти процесса, TTL 10 минут, md5-хэш от {type, objectId, groupId, date}) → src/vk/events.js: handleVkEvent({ type, object }) → проверка src/state.js eventToggleState (вкл/выкл по типу события, изменяется в рантайме через команды Telegram, не сохраняется между перезапусками) → формирование короткого HTML-сообщения (эмодзи + прямая ссылка VK + опциональный актуальный счётчик лайков из VK API) для каждого типа события через большой switch → src/telegram.js: sendTelegramMessageWithRetry → state.CURRENT_MAIN_CHAT_ID (3 попытки, задержки 1с/2с/3с, ошибки дублируются в DEBUG_CHAT_ID)
```

Команды Telegram → бот регистрируются в `src/commands.js` через `bot.onText`, используя тот же
экземпляр `bot` (long-polling) из `src/telegram.js`. Команды только для администратора проверяют
`isAdmin()` (`src/state.js`) по списку `ADMIN_USER_IDS`.

Всё это — кэш дедупликации, тумблеры событий и `CURRENT_MAIN_CHAT_ID` — хранится только в памяти
процесса и сбрасывается при перезапуске.

### Важно: два «мёртвых»/неподключённых участка кода

В репозитории есть файлы, которые **не импортируются в `server.js`** и не участвуют в работе
бота. Не считайте, что изменения в них влияют на поведение бота, и не расширяйте их без явного
подключения (либо сначала уточните это):

- **`handlers/` и `utils/index.js`** — более старая реализация той же обработки событий в другом
  стиле (dependency injection: каждый обработчик получает объект-контекст со вспомогательными
  функциями). Заменена консолидированным switch-оператором в `src/vk/events.js`, который с тех
  пор разошёлся с этой версией (другие форматы сообщений, больше типов событий).
- **`src/lib/events.js` и `src/storage/{firebase,redis,supabase}.js`** — написаны как ES-модули
  (`import`/`export`) в проекте, который в остальном использует CommonJS (`require`/
  `module.exports`, в `package.json` нет `"type": "module"`). Они также зависят от `pino` и
  `@upstash/redis`, которых нет среди зависимостей в `package.json`. Загрузка этих файлов через
  `require()` приведёт к ошибке. В `server.js` реально подключены только `src/lib/db.js` и
  `src/lib/logger.js` (оба на CommonJS, работают через Supabase) — для структурированного
  логирования запросов/ответов в таблицу `bot_logs` в Supabase.

Если стоит задача по логированию, дедупликации или пересылке событий — источником истины являются
`src/vk/events.js`, `src/vk/dedup.js`, `src/lib/logger.js` и `src/lib/db.js`, а не файлы, указанные
выше.

### Cloudflare Worker

`wrangler.jsonc` указывает на `src/worker.js`, который сейчас является лишь заглушкой-обработчиком
`fetch`, возвращающей статичный текст — реальная логика бота там не выполняется (long-polling
невозможна в среде Workers). Считайте это незавершённой целью миграции, а не рабочим
развёртыванием.

### Добавление нового типа события VK

1. Добавьте ключ типа события в `state.eventToggleState` в `src/state.js` (задав значение по
   умолчанию — доставлять/подавлять).
2. Добавьте `case` в switch внутри `handleVkEvent()` в `src/vk/events.js`, следуя существующему
   стилю: короткое HTML-сообщение с эмодзи, `userLink()` для ссылок на профиль VK,
   `buildObjectLink()`/`absOwner()` для прямых ссылок VK, где это применимо.
3. Если в сообщении нужно склонение существительного (падежи русского языка), расширяйте
   `objNounDative`/`objNounAblative`, а не вставляйте текст напрямую.

### Соглашения по тестированию

Тесты используют встроенные `node:test` + `node:assert/strict` (см. `test/vk/dedup.test.js`), а не
Jest/Mocha. Новые тесты размещайте в `test/`, повторяя структуру пути в `src/`, который
тестируется.
