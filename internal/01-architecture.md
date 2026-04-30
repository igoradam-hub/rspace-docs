# 01. Архитектура системы

> **Аудитория:** вся команда разработки. Первая страница, которую должен прочитать новый сотрудник.
> **Последнее обновление:** 2026-04-23 (сверено с `dev`/`develop` ветками GitLab)

## High-level карта

```
                          ┌─────────────────────┐
                          │   rspace.pro        │
                          │   Next.js 15.4.8    │
                          │   (Landing)         │
                          └──────────┬──────────┘
                                     │  клик «Попробовать»
                                     ▼
       ┌─────────────────────────────────────────────────────┐
       │       lk.rspace.pro     (Кабинет агента)            │
       │       React Router 7.11 + Chakra UI v3 SSR          │
       └──────────┬──────────────────────────────────────────┘
                  │    Bearer токен (Sanctum)
                  │    REST: application/json
                  ▼
       ┌─────────────────────────────────────────────────────┐
       │       api.rspace.pro  (Backend)                     │
       │       Laravel 13 + PHP 8.4                          │
       │       PostgreSQL 17 + Spatie Media Library (S3)     │
       │       Queue: database driver                        │
       │       Sanctum + auth:admin middleware               │
       └──────┬──────────────────────────────────────┬───────┘
              │                                      │
              │  outbound:                          │  inbound webhooks:
              ▼                                      ▼
┌────────────────────────────┐    ┌──────────────────────────────────┐
│ CloudPayments  (платежи)   │    │ POST /webhook/cloud-payments/*   │
│ AmoCRM (sync лидов)        │    │ POST /webhook/jivo/:token        │
│ Avito API (публикации)     │    │ POST /webhook/telegram/:token    │
│ CIAN API  (публикации)     │    └──────────────────────────────────┘
│ ДомКлик (outbound feed)    │
│ OpenAI (AI-описания,       │
│   AI-юрист)                │
│ Telegram Bot (исходящие)   │
│ Dadata (suggestions)       │
│ PostHog (analytics)        │
└────────────────────────────┘
              ▲
              │
       ┌──────┴────────────────────────────────────────────┐
       │  admin.rspace.pro  (UI — репозиторий вне GitLab)  │
       │  тот же backend, эндпоинты под auth:admin         │
       └───────────────────────────────────────────────────┘
```

## Три рабочих репозитория

Все три — в GitLab группе `rspase`. Доступ через `git.rs-app.ru`.

| Репо | Слаг | Default branch | Prod-ветка | Стек |
|---|---|---|---|---|
| Лендинг | `rspase/landing/next` | `dev` | `dev` → `premaster` (manual) | Next.js 15 |
| Кабинет | `rspase/project/frontend` | `main` (заморожен!) | `develop` | React Router 7 |
| API | `rspase/project/backend` | `master` (заморожен!) | `dev` | Laravel 13 |

**Важное предупреждение**: у frontend и backend **`main`/`master` — template-ветки**, заморожены на апрель 2025. Реальная разработка — в `develop` и `dev` соответственно. Не путать при клонировании.

## Lаndинг — `rspase/landing/next`

**Домен:** [rspace.pro](https://rspace.pro)
**Назначение:** маркетинговый сайт, точка входа для регистрации.

**Стек** (из `package.json` ветки `dev`):

| Компонент | Версия |
|---|---|
| Next.js | **15.4.8** |
| React | 19.1.0 |
| TypeScript | 5.x |
| Tailwind CSS | **v4** (с `@tailwindcss/postcss`) |
| Radix UI | checkbox, dialog, label, select, slot (primitives) |
| React Hook Form | 7.62 |
| Zod | 4.1 |
| Maskito | 3.10 (input-маски: телефон и т.д.) |
| Swiper | 11.2 (слайдеры в hero и тарифах) |
| lucide-react | 0.539 (иконки) |
| SVGR | 8.1 (dev — SVG → React-компоненты) |

**A/B-эксперименты:** варианты `a/b/c/d` живут в отдельных branches/worktrees и деплоятся на поддомены `a.rspace.pro` / `b.rspace.pro` / и т.д. Разделение — через env-переменную `NEXT_PUBLIC_VARIANT=a|b|c|d`, читается через helper `getVariant()`.

**Аналитика:** Yandex Metrika (id `104015550` prod / `104317883` test — **в коде ссылается на test, это расхождение**, см. [Internal 05: Yandex](./05-integrations/yandex-metrika.md)). PostHog — reverse proxy через `/api/ingest`, активен.

**Сборка:** Docker-образ, push в GitLab Container Registry, деплой через `docker compose pull && up -d`.

## Кабинет — `rspase/project/frontend`

**Домен:** [lk.rspace.pro](https://lk.rspace.pro)
**Назначение:** основной рабочий интерфейс риелтора.

**Стек** (из `package.json` ветки `develop`):

| Компонент | Версия |
|---|---|
| React Router | **7.11** (SSR-режим) |
| React | 19.2.3 |
| Chakra UI | 3.27 |
| Emotion | 11.14 |
| TanStack Query | 5.74 |
| Jotai (стейт) | 2.12 |
| Axios | 1.8 |
| Formik + Yup | 2.4 / 1.6 (формы) |
| date-fns + moment | 4.1 / 2.30 (дат-утилиты, в процессе унификации) |
| Yandex Maps | `@iminside/react-yandex-maps` (карты в объектах) |
| DnD Kit | 6.3 + 10.0 (сортировка фото и объектов) |
| use-mask-input | 3.4 (маски ввода) |
| react-easy-crop | 5.4 (обрезка аватара) |
| next-themes | 0.4 (dark/light — пока декорация) |
| use-debounce | 10.0 |

**SSR:** React Router 7 с `@react-router/node` и `@react-router/serve`. Сервер отдаёт HTML с pre-fetched данными, затем гидрируется на клиенте.

**API-клиент:** axios-инстанс с interceptor'ом, который добавляет Bearer-токен из localStorage и refresh'ит при 401. Запросы кешируются через TanStack Query.

**Типы:** OpenAPI-схема тянется скриптом `fetch-swagger` из backend'а, генерируется TS-типы (см. `package.json → scripts.fetch-swagger`).

**Аналитика:** PostHog-провайдер импортирован в `root.tsx`, но **не обёрнут в Layout** — т.е. не активен на проде. Серверная часть (`posthog-php`) зависимость имеется, но в `app/` ни одного файла с явным использованием PostHog-клиента на 2026-04-23 не найдено — трекинг фактически только фронтовый и только на лендинге.

## Backend API — `rspase/project/backend`

**Домен:** [api.rspace.pro](https://api.rspace.pro) (подтверждено в `.env.example` через `APP_URL` и референсах в клиентских скриптах)
**Назначение:** ядро системы, 100% бизнес-логика, интеграции, админка.

**Стек** (из `composer.json` ветки `dev`):

| Компонент | Версия | Назначение |
|---|---|---|
| **PHP** | **^8.4** | Runtime |
| **Laravel** | **^13.0** | Framework |
| Laravel Sanctum | 4.0 | Token-based API auth |
| Laravel Tinker | 2.9 | REPL |
| **Spatie Media Library** | 11.12 | Фото объектов, аватары, документы, S3 |
| **League Flysystem AWS S3** | 3.29 | Адаптер хранения |
| **OpenAI PHP Client** | 0.19 | AI-описания, AI-юрист (Грут) |
| **Telegram Bot SDK** (irazasyed) | 3.15 | Исходящие уведомления и приём webhook |
| **hflabs/dadata** | 24.4 | Подсказки адресов, валидация |
| **PostHog PHP** | 4.0 | Серверные события аналитики |
| **phpspreadsheet** | 5.3 | Экспорт admin-отчётов в xlsx |
| **propaganistas/laravel-phone** | 5.3 | Парсинг и валидация номеров |
| **zircote/swagger-php** | 5.0 | OpenAPI-аннотации → `swagger.json` |

### БД и очередь

- **PostgreSQL 17** (с PostGIS — геолокация объектов).
- **Queue:** database driver (`QUEUE_CONNECTION=database`, таблицы `jobs`, `job_batches`, `failed_jobs`). В `.env.example` именно database — если на проде переключено на Redis, это требует отдельного подтверждения у DevOps.
- **Cache:** database driver (`CACHE_STORE=database`, таблицы `cache` + `cache_locks`). Аналогично.
- **Session:** `SESSION_DRIVER=database` в `.env.example`, но **миграция `sessions` отсутствует** — API stateless через Sanctum, сессия реально не используется. Драйвер в конфиге остался из шаблона Laravel.

### Auth

- **Sanctum-токены** для пользовательских API-запросов: `Authorization: Bearer <token>`.
- **`auth:admin` middleware** для админских эндпоинтов (~100+ в `routes/api.php`).
- Регистрация — через SMS (см. [Internal 02: Identity](./02-modules/identity.md)).

### Доменная структура

Бэкенд структурирован по доменам (модулям). Каждый домен — отдельная папка в `app/`:

```
backend/app/
├── Identity/       ← регистрация, SMS, токены
├── Realty/         ← квартиры, дома, участки, медиа
├── Publishings/    ← Avito/CIAN/DomClick публикации
├── Leads/          ← входящие лиды
├── Subscriptions/  ← тарифы, активации
├── Billing/        ← баланс, CloudPayments, промокоды
├── Services/       ← AI-юрист, заявки на услуги
├── Scoring/        ← проверки собственника/объекта
├── Widget/         ← встраиваемый блок услуг
├── Onboarding/     ← прогресс пользователя
├── Telegram/       ← бот-интеграция
├── AmoCrm/         ← синхронизация лидов в CRM
├── Dadata/         ← прокси подсказок
├── OpenAi/         ← клиент генерации
└── Admin/          ← админ-контроллеры
```

Подробный разбор каждого модуля — [02. Домены и модули](./02-modules/).

### API Reference

Все публичные эндпоинты кабинета, admin-эндпоинты и webhook'и — [03. API Reference](./03-api-reference/).

Генератор OpenAPI-документации — Scribe (через `zircote/swagger-php`). Swagger JSON тянется фронтендом скриптом `fetch-swagger`.

## Админка

**Домен:** [admin.rspace.pro](https://admin.rspace.pro)
**Frontend-код:** **отдельный репозиторий вне группы `rspase`** в GitLab (подтверждено через `GET /api/v4/projects?membership=true`: в `rspase/*` только `project/backend`, `project/frontend` и `landing/next`). Репо admin-фронта требует уточнения у команды.
**Backend:** тот же `project/backend`, эндпоинты в `routes/api.php` под `auth:admin` middleware, префикс `/admin/*` или `/api/admin/*`.

Подробно — [06. Админка](./06-admin.md).

## Схема потоков данных

### 1. Регистрация пользователя

```
User → landing (rspace.pro) → форма регистрации
     → POST api/auth/register/send-code (phone)
     → SMS provider (**sms.ru** через `SmsRuDriver` — в dev по умолчанию `logs`) → SMS с кодом
User → POST api/auth/register (phone, code, password)
     → Sanctum-токен в ответе
     → redirect на lk.rspace.pro + токен в cookie/localStorage
     → frontend получает токен, все последующие запросы с Bearer
```

### 2. Публикация объекта

```
User (ЛК) → POST api/realties (draft)
         → PUT api/realties/:id/apartment (детали)
         → POST api/realties/:id/photos (загрузка в S3 через Spatie Media)
         → PUT api/realties/:id/location, deal-terms, description
         → POST api/realties/:id/publish (targets: avito/cian/domclick)
Backend  → Publishings::service → AvitoPublishingService / CianPublishingService
         → внешний API Avito/CIAN → external_id сохраняется
         → для ДомКлик — obj записывается в feed XML/JSON на S3
         → стата pulls'ится периодически (scheduled command)
```

### 3. Платёж по подписке

```
User → POST api/subscription/subscribe (plan_id)
     → Backend создаёт CPInvoicePayment → CloudPayments → payment_url
User → CloudPayments 3-D Secure → успех
CloudPayments → POST /webhook/cloud-payments/pay
     → Backend: проверка HMAC, обновление subscription.status=active
     → event: SubscriptionActivated → AmoCRM event dispatch
```

### 4. Входящий лид

```
Avito/CIAN scheduled sync → new lead in DB
     → event: LeadReceived
     → Telegram push (агенту, если привязан бот)
     → AmoCRM sync (в retry-очередь: 60s, 60s, 300s, 3600s, 43200s)
```

## Production vs local (осторожно!)

| Репо | Local default | Prod (GitLab) |
|---|---|---|
| landing | зависит от checkout | `dev` (активная) |
| frontend | `main` (заморожен apr 2025) | **`develop`** (активная) |
| backend | `master` (заморожен apr 2025) | **`dev`** (активная) |

При работе с локальными копиями **обязательно переключиться на активные ветки**. Либо читать файлы через GitLab API: `GET /projects/:id/repository/files/:path/raw?ref=develop`.

## CI/CD (summary)

- **Landing:** 2 стадии (`deploy_dev` на `dev` → `deploy_prod` на `premaster`, manual trigger). Docker build + push в registry + `docker compose pull`.
- **Frontend:** стадия `deploy_dev` на `develop`. Секреты из отдельного репо `rspase/secrets/dev/.env.front` тянутся в CI-job. Prod-стадия не настроена — TBD.
- **Backend:** `.gitlab-ci.yml` в `master` отсутствует. Актуальный CI — в `dev`-ветке, нужно свериться отдельно.

Подробнее — [13. Процессы разработки](./13-dev-process.md).

## Активные интеграции (краткий список)

| Сервис | Тип | Статус |
|---|---|---|
| CloudPayments | платежи (out + webhook in) | ✅ prod |
| AmoCRM | CRM (out + retry) | ✅ prod |
| Avito API | публикации, статы (bi) | ✅ prod |
| CIAN API | публикации, статы (bi) | ✅ prod |
| ДомКлик | — | ❌ интеграции в коде **нет** (ни endpoint'а feed, ни env-переменных) |
| OpenAI | AI-описания, AI-юрист | ✅ prod (но `OPEN_AI_FAKE_MODE=true` в dev → заглушка без вызовов API) |
| Telegram Bot | уведомления + привязка (bi) | ✅ prod — **2 бота** (`public` + `errors`) + 4 report-канала |
| JivoSite | чаты поддержки (webhook in) | ✅ prod (webhook-токен захардкожен в `routes/api.php` — tech-debt) |
| Dadata | suggestions (out) | ✅ prod |
| Yandex Metrika | аналитика (pixel) | ✅ prod (counter мisconfig — см. known-issues). Не путать с Яндекс.Диском, используемым для leads sync |
| Яндекс.Диск | источник лидов | ✅ prod через `app/Api/Yandex/YandexDiskApiClient.php` (`LEADS_YANDEX_DISK_URL`) |
| Google Spreadsheets | источник лидов | ✅ prod (`LEADS_GOOGLE_SPREADSHEETS_ID`) |
| PostHog | аналитика (JS) | ⚠️ настроен, lk-frontend не обёрнут, **backend-трекинга нет** (зависимость установлена, кода нет) |
| SMS-провайдер | регистрация, восстановление | ✅ prod — **sms.ru** через `SmsRuDriver`; по умолчанию `SMS_PROVIDER=logs` в dev |

Подробнее — [05. Интеграции](./05-integrations/).

## Что дальше

- [02. Домены и модули](./02-modules/) — backend-доменный срез.
- [03. API Reference](./03-api-reference/) — эндпоинты с примерами.
- [04. База данных](./04-database.md) — PostgreSQL-схема.
- [05. Интеграции](./05-integrations/) — CloudPayments, AmoCRM, Avito, CIAN, OpenAI и другие.
- [06. Админка](./06-admin.md) — админ-пulpит.
- [12. Инфраструктура](./12-infrastructure.md) — Docker, CI, окружения.

## Known architectural issues

- **Default-ветки в `main`/`master`** для frontend/backend заморожены с апреля 2025 — путает новых разработчиков.
- **Локальный checkout landing/frontend** может быть на feature-ветке, не на `dev`/`develop`.
- **`config/app.php` и `config/services.php`** — все actively используемые ключи описаны. На 2026-04-23 инвентаризация выполнена (см. волну 3 CHANGELOG).
- **Yandex Metrika ID** в landing `.env.example` — тестовый. Prod-counter (104015550) подтягивается через env, но по факту в `.env.example` видно только test. Нужна проверка.
- **PostHog backend-события** — зависимость установлена в composer.json, но серверных вызовов в коде нет (на 2026-04-23). Трекинг только клиентский.
- **Admin UI** — отдельный репозиторий вне GitLab-группы `rspase`, источник правды кода неизвестен. Надо зафиксировать.
- **Сессии** — `SESSION_DRIVER=database` в конфиге, но миграция `sessions` отсутствует. Остаток от шаблона Laravel; API stateless через Sanctum.
- **Queue в proде** — `QUEUE_CONNECTION=database` в `.env.example`. Если переключено на Redis/SQS на проде — требует подтверждения у DevOps.
