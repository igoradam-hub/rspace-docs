# 04. База данных

> **Аудитория:** backend-разработчики, DBA, DevOps.
> **СУБД:** PostgreSQL 17 + PostGIS (геолокация объектов).
> **Миграций в коде:** **156** (из `backend/database/migrations/`).
> **Последнее обновление:** 2026-04-23

Вся бизнес-логика RSpace живёт в реляционной БД. Миграции через Laravel. Схема — нормализованная, с доменной разбивкой на префиксы таблиц.

## Стек

- **PostgreSQL 17** — основная БД (подтверждено в `.env.example` backend'а: `DB_CONNECTION=pgsql`).
- **PostGIS** — расширение для геолокации (`Location` модель, координаты объектов).
- **Миграции** — Laravel стандартные, `database/migrations/*.php`.
- **Model-level** — Eloquent, с кастомными `QueryBuilder`'ами в `app/<Domain>/QueryBuilders/`.
- **Media storage** — **Spatie Media Library 11**: таблица `media` полиморфно привязана к большинству сущностей (User avatar, Realty photos, owner files, ScoringRequest PDF).
- **Queue & Cache** — тоже в БД (`QUEUE_CONNECTION=database`, `CACHE_STORE=database`):
  - `jobs` — очередь.
  - `failed_jobs` — упавшие job'ы.
  - `cache` + `cache_locks` — кеш.
  - `sessions` — пользовательские сессии (хотя API использует Sanctum-токены).

## Структура: кластеры таблиц

Всего в `database/migrations/` на 2026-04-29 — **~160 миграций** (на 2026-04-23 было 156; 159 на момент аудита 2026-04-29), создающих **~73 уникальные таблицы** (остальное — alter'ы). Точное число можно получить через `find database/migrations -name "*.php" | wc -l` на ветке `dev`. Ниже — разбивка по доменам с **точными именами таблиц из кода**.

| Домен | Ключевые таблицы | Комментарий |
|---|---|---|
| **Identity** | `users`, `verification_codes`, `personal_access_tokens` | Sanctum-токены стандартные. Поля для Telegram-привязки (`telegram_chat_id`, `telegram_username`) живут **колонками в `users`**, не в отдельной таблице |
| **Admin** | `admins`, `departments`, `user_admin_comments` | Отдельная auth. Таблиц `user_admin_files`/`admin_files` **нет** — файлы админов идут через полиморфную `media` (Spatie) |
| **Realty** | `realties`, `apartments`, `apartment_buildings`, `realty_houses`, `realty_land_plots`, `rooms`, `shares`, `locations`, `realty_deal_terms`, `realty_owner_info`, `realty_new_apartment_info` | Префикс `realty_` применяется неконсистентно — houses/land_plots/new_apartment_info его получили, apartments/apartment_buildings — нет |
| **Realty Prompts** | `realty_prompts` | Одна таблица. Settings хранятся в коде, не в отдельной таблице |
| **Realty Widget** | `realty_widget_items`, `realty_widget_orders`, `realty_widget_order_items` | 3 таблицы. Создана 2026-03-30/31 для реализации множественного заказа услуг через виджет |
| **Publishings** | `publishings`, `avito_publishings`, `cian_publishings`, `avito_publishing_statistics`, `avito_publishing_calls`, `cian_publishing_statistics`, `cian_publishing_calls`, `avito_promotions`, `avito_promotion_orders`, `avito_promotion_requests`, `cian_promotions`, `cian_promotion_requests` | Avito+CIAN — симметричная структура |
| **Leads** | `leads` | Одна модель |
| **Subscriptions** | `plans`, `plan_level_settings`, `plan_service`, `plan_service_trial`, `subscriptions`, `subscription_activations`, `subscription_renewals` | Pivot между Plan и Service называется **`plan_service`** (не `plan_service_pivot`). Отдельной таблицы `plan_levels` нет — уровни хранятся в `plans` + матрица скидок в `plan_level_settings` |
| **Billing** | `invoices`, `orders`, `order_items`, `cp_invoice_payments`, `balance_invoice_payments`, `balance_transactions`, `balance_deposits`, `compensation_balance_transactions`, `compensation_withdraws`, `payment_methods`, `payment_method_authorizations`, `promo_codes`, `promo_code_activations` | Таблица называется `compensation_withdraws` (не `withdrawals`). `promo_codes`+`promo_code_activations` созданы в одной объединённой миграции `2025_12_03_140750_create_promo_codes_and_promo_code_activations_tables.php`. Отдельной общей таблицы `payments` **нет** — платёж — это `cp_invoice_payments` или `balance_invoice_payments` |
| **Services** | `services`, `service_charges`, `service_charge_usages`, `service_requests`, `service_request_admin_comments` | Таблиц `service_categories`/`service_request_files` **нет** — категория, видимо, колонка; файлы — через `media` |
| **Scoring** | `scorings`, `scoring_requests` | State pattern реализован в коде (`app/Services/Services/Requests/States/`), не в схеме БД |
| **Onboarding** | `onboarding_progress` | Singular name. Отдельной таблицы `onboarding_steps` нет — ключи шагов в константах модели |
| **Telegram** | `telegram_chat_bindings` | Одноразовые токены для привязки. После привязки данные уходят в `users.telegram_*` |
| **AmoCrm** | `amo_crm_event_dispatches` | Лог событий и статусов отправки. В доке часто называется просто `event_dispatches` |
| **Dadata** | `dadata_cities` | Кеш справочника городов |
| **Feeds** | `feeds`, `feed_request_data` | XML-feed'ы для Avito/CIAN + лог запросов с площадок |
| **External balances** | `external_balances` | Снимки балансов партнёров (sms.ru, OpenAI, Avito и пр.) для мониторинга |
| **Settings** | `settings`, `offer_settings` | Общие настройки + брендинг public-offer |
| **System** | `media` (Spatie), `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `idempotency_events` | `sessions` **не создана** — API stateless через Sanctum. `cache`+`cache_locks` в одной миграции, `jobs`+`job_batches`+`failed_jobs` — в одной |
| **Cian catalog** | `cian_new_object_houses`, `cian_new_objects`, `avito_new_developments` | Каталоги новостроек для подсказок и поиска |

## Ключевые таблицы — детальная схема

### `users`
Главная сущность агента.

```
Columns:
  id              bigint      PK
  external_key    varchar     UUID для интеграций
  active          boolean     soft-deactivation
  phone           varchar     unique, E.164 format
  phone_verified_at   ts?
  password        varchar     bcrypt
  curator_id      bigint?     → admins.id (закреплённый менеджер)
  referred_by_id  bigint?     → users.id (реферал)
  email           varchar?
  country, city   varchar?
  fake_phone      varchar?    публичный номер для объявлений
  first_name, last_name, patronymic  varchar?
  gender          enum Gender
  balance         bigint      в копейках (внутренний баланс)
  compensation_balance  bigint  комиссионный баланс
  last_active_at  ts?
  utm_source, utm_medium, utm_campaign, utm_term, utm_content  varchar?
  created_at, updated_at  ts

Indexes:
  uniq(phone), uniq(external_key), idx(curator_id), idx(referred_by_id)
```

### `subscriptions`
Подписки пользователей.

```
Columns:
  id              bigint   PK
  user_id         FK users
  plan_id         FK plans
  new_plan_id     FK plans  (downgrade со следующего периода)
  status          enum SubscriptionStatus (trial, active, pending_cancel, expired, cancelled)
  started_at      ts
  ends_at         ts
  cancelled_at    ts?
  first_paid_at   ts?       (не null = прошёл платёж, триал завершён)
  payment_method_id  FK?
  created_at, updated_at  ts

Indexes:
  idx(user_id, status), idx(ends_at)  [для cron renewal-команды]
```

### `realties`
Корневая сущность объекта.

```
Columns:
  id              bigint   PK
  user_id         FK users (владелец)
  type            enum RealtyType (apartment, house, land_plot)
  status          enum RealtyStatus (draft, active, archived, ...)
  aggregated_status  enum RealtyAggregatedStatus (draft, in_moderation, published, rejected, archived)
  external_key    varchar
  price           bigint   в копейках (базовая цена)
  created_at, updated_at

  [связь с подтипом через id → apartments/houses/land_plots]
  [связь с локацией, deal_terms, owner_info, media через полиморфные / FK]

Indexes:
  idx(user_id, status), idx(aggregated_status)
```

### `publishings`
Каждое размещение объекта на одной из площадок.

```
Columns:
  id              bigint   PK
  realty_id       FK realties
  user_id         FK users  (денормализовано для фильтров)
  status          enum PublishingStatus (active, archived, expired)
  archived_at     ts?
  expires_at      ts?
  created_at, updated_at

  [дочерние записи: avito_publishings, cian_publishings с publishing_id]
```

### `avito_publishings`
Детали Avito-размещения.

```
Columns:
  id              bigint   PK
  publishing_id   FK publishings
  external_id     varchar  (item_id в Avito)
  status          enum AvitoPublishingStatus
  published_at    ts?
  url             varchar
  messages        jsonb    (AvitoMessagesCast — чат с клиентами)
  ...
```

### `cp_invoice_payments`
Попытки оплаты через CloudPayments.

```
Columns:
  id              bigint   PK (используется как InvoiceId в запросах CP!)
  invoice_id      FK invoices
  transaction_id  varchar  (ID транзакции в CP)
  type            enum CPInvoicePaymentType (Charge, Auth)
  status          enum CPInvoicePaymentStatus (pending, paid, failed, cancelled)
  amount          bigint   копейки
  currency        enum Currency (RUB)
  fail_code       enum CPInvoicePaymentFailCode? (do_not_honor, insufficient_funds, ...)
  card_last4      varchar?
  card_brand      varchar?
  created_at, updated_at
```

**Важная особенность:** `CPInvoicePayment.id` передаётся CloudPayments как `InvoiceId`. Контроллер webhook'а находит payment по этому ID.

### `leads`
Минималистичная модель.

```
Columns:
  id                bigint
  phone             varchar   (единственное обязательное поле)
  full_name         varchar?
  residental_complex  varchar?   (устаревшее поле)
  source            varchar?  (avito, cian, jivo, direct, referral)
  status            enum LeadStatus (available, applied)
  assigned_to_id    FK users?
  assigned_at       ts?
  created_at, updated_at
```

### `event_dispatches` (AmoCRM)
Лог событий, отправленных в AmoCRM.

```
Columns:
  id              varchar (uuid)  PK
  event_type      enum EventType (user.registered, card.authorized, payment.success, object.published)
  user_id         FK users
  payload         jsonb
  status          enum (pending, sending, sent, failed)
  attempts        integer
  sent_at         ts?
  last_error      text?
  created_at, updated_at
```

### `media` (Spatie)
Полиморфная таблица для файлов/фото/документов.

```
Columns:
  id                bigint
  model_type        varchar  (e.g., "App\Models\Realty\Realty")
  model_id          bigint
  uuid              varchar  (публичный идентификатор)
  collection_name   varchar  (photos, owner_documents, ddu_files, avatar, ...)
  name, file_name   varchar
  mime_type         varchar
  disk              varchar  (s3 / local)
  size              bigint
  custom_properties jsonb    (position, category, description)
  ...
```

## Тренды развития схемы (по миграциям)

Из ~160 миграций видно **эволюцию**:

### Самые «живые» таблицы (create + alter)

Подсчитано механически по именам миграций (create + add/update/remove/rename):

| # | Таблица | Миграций |
|---|---|---:|
| 1 | `users` | 10 |
| 2 | `locations` | 8 |
| 3 | `services` | 8 |
| 4 | `invoices` | 7 |
| 5 | `realties` | 5 |
| 6 | `realty_deal_terms` | 4 |
| 7 | `realty_owner_info` | 4 |
| 8 | `avito_publishings` | 4 |
| 9 | `plans` | 4 |
| 10 | `payment_methods` | 4 |

Биллинг остаётся самым часто обновляемым кластером (invoices, cp_invoice_payments, payment_methods, payment_method_authorizations — каждая по 3-7 миграций), но по числу изменений лидирует `users` (UTM-колонки, telegram-колонки, last_active_at, key, curator и т.д.).

### Фазы развития схемы (по датам миграций)

- **Июль-август 2025** — **глубокий рефакторинг биллинга**: create subscriptions, payment_methods, invoices, payment_method_authorizations, balance_transactions, balance_deposits, orders, order_items, offer_settings, cp_invoice_payments. Коррелирует с `ТЗ_Пересборка_подписок.md` (релиз 24.03).
- **Декабрь 2025 - февраль 2026** — **эволюция тарифов и маркетинга**: promo_codes+promo_code_activations (03.12), discount-колонки в invoices, markup_percent в plans, UTM-колонки и telegram-колонки в users, update на amo_crm_events и idempotency_events.
- **Март 2026** — **новые модули**: plan_level_settings (25.03), onboarding_progress (26.03), realty_widget_items (30.03), realty_widget_orders+order_items (31.03), final_amount в invoices.
- **Апрель 2026** — **мониторинг и ключи**: add_key_column_to_users (02.04), external_balances (13.04) — таблица для снимков балансов у партнёров (sms.ru, OpenAI, Avito, CIAN).

**Последняя миграция на момент верификации (2026-04-23):** `2026_04_13_000000_create_external_balances_table.php`.


## Полиморфные связи

### `Invoice.invoiceable`
Invoice может быть привязан к:
- `Subscription` (подписка)
- `BalanceDeposit` (пополнение внутреннего баланса)
- `ServiceRequest` (заявка на услугу)
- `ScoringRequest` (заявка на проверку)
- `WidgetOrder` (корзина услуг из виджета)
- `AvitoPromotionOrder` (промо на Avito)

Поля: `invoiceable_type`, `invoiceable_id`. Это даёт гибкость — любая оплачиваемая сущность может привязать Invoice.

### `Media` (Spatie) — см. выше
Привязывается к User, Realty, ServiceRequest, ScoringRequest, и любой другой `HasMedia` модели.

## Индексы и производительность

**По коду миграций** (типичные):
- `users.phone` — unique (идентификатор).
- `subscriptions.ends_at` — для ProcessSubscriptionRenewalsCommand.
- `publishings.realty_id` + `publishings.user_id` — фильтры.
- `leads.assigned_to_id` + `leads.status` — очередь лидов.
- `event_dispatches.status` — для queue-обработки.

**TBD:** глубокий аудит индексов на prod — через `EXPLAIN ANALYZE` топ-запросов.

## Соглашения именования

- **Таблицы** — множественное число snake_case (`users`, `realties`, `cp_invoice_payments`).
- **FK** — `{singular}_id` (`user_id`, `realty_id`, `plan_id`).
- **Временные поля** — `created_at`, `updated_at`, `deleted_at` (если soft delete), кастомные — `ends_at`, `paid_at`, `finished_at`.
- **Boolean** — прилагательное без `is_`: `active`, `archived`, `published`, но есть и исключения.
- **Enum-колонки** — хранятся как varchar, значения определены в enum-классах Laravel (PHP 8.1+).
- **Money** — всегда в **копейках** (bigint), никогда не float. На фронт приходит как bigint — фронт делит на 100 для отображения.

## Бэкапы

**TBD от DevOps**:
- Частота бэкапов (ежедневные? почасовые?).
- Retention (30 дней? 90?).
- Point-in-time recovery включён?
- Хранение (WAL-G? pg_basebackup? managed PostgreSQL?).
- Disaster recovery — RTO/RPO.
- Регулярное тестирование восстановления.

## Как добавить новую миграцию

```bash
cd backend
php artisan make:migration create_xxx_table   # новая
php artisan make:migration add_yyy_to_xxx     # добавить столбцы

# В dev окружении
php artisan migrate
# Rollback последней
php artisan migrate:rollback
```

**Правило:** все изменения схемы — через миграции, никаких ручных ALTER на проде.

## Seeders и фабрики

- `database/seeders/` — заполнение справочников (ServiceCategory, ScoringType, PlanLevel).
- `database/factories/` — для тестов (`UserFactory`, `LeadFactory`, и т.д.).

## Доступ к prod БД

**TBD DevOps:**
- Где хостится (managed PG у облачного провайдера? self-hosted?)
- Как читать production реплику (для аналитики без нагрузки на primary).
- Процедура доступа — для разработки обычно закрыт.

## Known issues

- **Bus factor на схему**: точное состояние prod vs migrations нужно периодически сверять.
- **Индексы на прод** — не было full-scan аудита. TBD.
- **Storage для media** — S3 (Flysystem), но alternative local — если используется, диск может забиваться.
- **Таблица `sessions` отсутствует** — подтверждено: её миграции нет в `database/migrations/`. API stateless через Sanctum. ✓
- **`idempotency_events`** — таблица существует (миграции `2026_02_13_152747_create_idempotency_events_table.php` + `2026_02_26_160527_update_idempotency_events_table.php`). Используется как паттерн защиты от дубликатов webhook'ов: CloudPayments и Telegram могут слать `pay`/`message_received` повторно при сетевых сбоях; UNIQUE-ключ в этой таблице фиксирует уже обработанные events и не даёт двойной обработки.

## Связанные разделы

- [02-modules/](./02-modules/) — каждый домен описан со своими моделями.
- [03-api-reference/](./03-api-reference/) — endpoint'ы → таблицы.
- [05-integrations/](./05-integrations/) — где внешние данные хранятся.
- [13. Процессы разработки](./13-dev-process.md) (Волна 9) — как деплоить миграции.
- [14. Tech Debt](./14-tech-debt.md) (Волна 9).

## Ссылки GitLab

- [database/migrations/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/database/migrations) — ~160 миграций.
- [app/Models/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Models) — Eloquent-модели.
