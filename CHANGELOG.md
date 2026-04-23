# CHANGELOG — верификация документации против GitLab

Цель: сверить каждый факт в `rspace-docs/` с реальным кодом `rspase/project/{backend,frontend}` + `rspase/landing/next` и зафиксировать все правки.

**Правило:** любая правка, меняющая факты (цифры, пути, URL, endpoint-ы, имена файлов, версии), идёт в этот лог с указанием источника правды (строка в коде GitLab).

---

## 2026-04-23 — Sanity-аудит (Опус)

### Что проверено

1. **GitLab-токен и доступы:**
   - `glpat-Py_3cxiFxgL8bmas3ZGBDG86MQp1OjJjeAk.01.0z0y12mq3` — валиден, user `igor.adam` (external).
   - Видны 3 проекта: `rspase/project/backend` (id=682, default=master, активная ветка — `dev`), `rspase/project/frontend` (id=683, default=main), `rspase/landing/next` (id=724, default=dev).

2. **Backend: master vs dev:**
   - **master** — пустой скелет `laravel11-docker-template` (единственный коммит 2025-04-02, 4 папки в `app/Extensions/`: Authentication / Authorization / Logging / Settings).
   - **dev** — реальный production-код (последний коммит 2026-04-22). Все факты и ссылки в документации должны указывать именно на `dev`.
   - Документ `README.md` уже корректно указывает `ref=<dev/develop>` в разделе Source-of-Truth.

3. **Структура backend на `dev`:**
   - Laravel 11.31 + PHP 8.2 + Sanctum 4. `composer.json` подтверждено.
   - Контроллеры в `app/Http/Controllers/...` (НЕ в `app/Extensions/*` — это был master).
   - 11 admin-контроллеров (`App\Http\Controllers\Admin\*`).
   - Домены с отдельными подпапками: Admin, Auth, Billing (Balance, CompensationBalance, Invoices, PaymentMethod, Payments\CloudPayments, PromoCodes), Dadata, Feeds, Profile, Proxy, Publishings, Realty (Abstract, Admin, Public, Test), Services.

4. **routes/api.php (dev):**
   - 672 строки, 304 распарсенных Route::verb(...) вызова.
   - Admin-группа: строки **90-439** (совпадает с тем, что было в документации).
   - Middleware-распределение: 177 `auth:admin` + 89 `auth:user` + 32 без guard (+ 6 специальных/throttle).
   - Структурированный дамп сохранён в `_verification/routes-dev-2026-04-23.json`.

5. **Модуль Realty:**
   - Все 43 модели из `app/Models/Realty/` соответствуют списку в `internal/02-modules/realty.md`.
   - Папки `app/Realty/{Prompts,Realty,Widget}` — существуют.
   - Структура контроллеров `Realty/{Abstract,Admin,Public,Test}` — совпадает.

6. **Админка:**
   - Все 12 функциональных групп из таблицы `internal/06-admin.md` имеют реальные роуты.
   - Конкретные эндпоинты `supervisors`, `reassign-to/{new_admin_id}`, `logout/all`, `check` — все существуют в коде.
   - Login и change-password защищены `throttle:5,1` — как в доке.
   - Frontend-код админки — **отсутствует в rspase-группе GitLab** (подтверждено через `GET /api/v4/projects?membership=true`).

### Вердикт по сессии 1

Документация в `rspace-docs/` — **не выдумана**. Основные факты (структура, домены, guard-система, префиксы) на своих местах. Расхождения — в частностях:
- устаревшие / округлённые числа;
- упрощённые формулировки про контроллеры (реальность богаче);
- отсутствие счётчиков и конкретных ссылок на строки кода.

Стратегия дальнейшей верификации: **точечные правки в файлах на месте**, без полной переписки.

### Правки

| Файл | Что изменено | Источник правды |
|---|---|---|
| `internal/06-admin.md` | `~130 эндпоинтов` → `177 admin + 89 user + 32 без guard = 304 total`. Уточнил диапазон строк (90-439). | `routes/api.php@dev` |
| `internal/06-admin.md` | В таблицу групп добавлена колонка `n` с точным количеством эндпоинтов в каждой группе. Добавлена строка «Итого: 177». Realty(27) + Realty Prompts(10) разведены. | парсер `_verification/routes-dev-2026-04-23.json` |
| `internal/06-admin.md` | Раздел «Frontend-код админки»: гипотезы про Nova/Filament заменены на факт — в `composer.json` их нет, значит SPA вне репо. | `composer.json@dev` |
| `_verification/routes-dev-2026-04-23.json` | **Новый файл** — структурированный дамп всех 304 роутов (verb, path, controller, method, middleware, line). Основа для верификации API-reference файлов в следующих сессиях. | `routes/api.php@dev` |
| `CHANGELOG.md` | **Новый файл** — этот. | — |

### Открытые вопросы (не блокеры, для следующих сессий)

- [ ] Найти репозиторий admin frontend (вне `rspase/*`).
- [ ] Проверить, что модель `App\Models\Admin\Admin` существует (и какие у неё поля для определения super vs regular — в доке сказано TBD).
- [ ] Сверить каждый из 14 API-reference файлов (`internal/03-api-reference/*`) с распарсенными роутами.
- [ ] Сверить каждый из 6 admin-API-reference файлов.
- [ ] Прогнать 12 модулей (`internal/02-modules/*`) на соответствие реальной структуре контроллеров.
- [ ] Сверить `internal/04-database.md` со списком миграций в `database/migrations/`.
- [ ] Сверить `internal/05-integrations/*` с `config/services.php` и реальными клиентами.
- [ ] Внешнюю доку (`external/*`) проверить через UI `lk.rspace.pro` и ТЗ в `_sources/`.

---

## 2026-04-23 (сессия 2) — Верификация API-reference (14 user + 5 admin)

### Что проверено

- 14 файлов `internal/03-api-reference/*.md` (user API)
- 5 файлов `internal/03-api-reference/admin/*.md` (admin API)
- Метод сверки: `_verification/verify_api_ref.py` — парсит `VERB /path` вхождения в markdown и сверяет с `routes-dev-2026-04-23.json`.

### Ключевое: парсер роутов v2

Первоначальный парсер (`parse_routes.py`) пропускал мульти-строчные `Route::post(\n '/{path}',\n [Controller::class, 'method']\n)` — нашёл 304 роута вместо 306. Переписан в `parse_routes_v2.py`, корректно балансирует скобки. Обновлённый `_verification/routes-dev-2026-04-23.json` содержит **306 эндпоинтов**:

- 179 admin (`auth:admin`)
- 93 user (`auth:user`)
- 34 без guard / throttle / special

### Правки параметров пути

Документация использовала обобщённое `{id}`, код — конкретные имена (`{realty_id}`, `{publishing_id}`, ...). Приведены в соответствие:

| Файл | Замена | Кол-во вхождений |
|---|---|---|
| `internal/03-api-reference/realties.md` | `{id}` → `{realty_id}` | 31 |
| `internal/03-api-reference/publishings.md` | `/publishings/{id}` → `/publishings/{publishing_id}`, `/realties/{id}` → `/realties/{realty_id}` | 17 |
| `internal/03-api-reference/services.md` | `/services/{id}` → `/services/{service_id}`, `/realties/{id}` → `/realties/{realty_id}` | 5 |
| `internal/03-api-reference/scorings.md` | `/scorings/requests/{id}` → `/scorings/requests/{request_id}`, `/scorings/{id}` → `/scorings/{scoring_id}` (включая admin-упоминания) | 7 |
| `internal/03-api-reference/billing.md` | `DELETE /billing/payment_methods/{id}` → `{payment_method_id}` | 1 |
| `internal/03-api-reference/admin/users.md` | `/admin/users/{id}` → `/admin/users/{user_id}` | 18 |
| `internal/03-api-reference/admin/plans-and-billing.md` | `/admin/billing/compensation-withdrawals/{id}` → `{withdrawal_id}` | 5 |

### Правки цифр в 06-admin.md

- «177 admin + 89 user + 32 без guard = 304» → «179 admin + 93 user + 34 без guard = 306» (парсер v2 нашёл ещё 2 мульти-строчных роута).
- Publishings group: 21 → 23 (добавлены `POST .../requests/avito/{request_id}/complete` и `cian` аналог — оба существуют в коде, но пропустились парсером v1).
- Итого: 177 → 179.

### Итоговая сверка

После правок — `verify_api_ref.py` даёт `matched=claimed, missing=0` для всех 19 файлов:

```
auth.md                    8/8   ✓
billing.md                13/13  ✓
feeds.md                   2/2   ✓
leads.md                   1/1   ✓
onboarding.md              1/1   ✓
profile.md                 7/7   ✓
publishings.md            20/20  ✓
realties.md               34/34  ✓
scorings.md                7/7   ✓
services.md                4/4   ✓
settings.md                4/4   ✓
subscription.md            8/8   ✓
suggestions.md             3/3   ✓
webhooks.md                5/5   ✓
admin/auth-and-admins     18/18  ✓
admin/users               21/21  ✓
admin/plans-and-billing   28/28  ✓
admin/realties-publishings 9/9   ✓
admin/services-scorings    9/9   ✓
```

### Что НЕ проверено в этой сессии (остаётся на следующие)

- **Детали контрактов эндпоинтов** — request body fields, response shapes, HTTP-коды ошибок. Проверялась только пара (verb, path).
- **Middleware и throttle** на уровне каждого эндпоинта (только spot-check).
- **Controller::method attribution** в доках (упоминание какого контроллера / метода). Имеется в routes.json — можно автоматически сверить в следующей сессии.
- Остальные разделы документации (02-modules, 04-database, 05-integrations, 07-frontend, ..., external/*).

### Новые открытые вопросы

- [ ] Сверить `Controller::method` атрибуции в каждом файле API-reference с routes.json.
- [ ] Проверить request/response схемы через OpenAPI-аннотации в контроллерах (`OA\*` из `#[OA\Post(...)]` и `.scribe/` артефакты — тем более Scribe подключён в composer).

---

## 2026-04-23 (сессия 3) — Верификация 12 модулей internal/02-modules/*

### Что проверено

- Все 12 файлов `internal/02-modules/*.md` (identity, realty, publishings, leads, subscriptions, billing, services, scoring, widget, realty-prompts, onboarding, telegram) + README.
- Метод: собрал полный дамп `app/` из backend@dev (1933 файла, сохранён в `_verification/tree-app-dev-2026-04-23.json`), парсил path-упоминания из markdown, сверял наличие файлов.
- Скрипт `_verification/verify_module.py`.

### Ключевые находки

1. **Tree v1 был неполным** — моя первая пагинация остановилась на странице 15 (1500 файлов). Фактический `app/` содержит 1933 файла. Переписал пагинацию без ограничения страниц.
2. **Фактическая структура app/** сильно богаче, чем описано в доке:
   - DDD-папки верхнего уровня: `Realty/`, `Publishings/`, `Leads/`, `Identity/`, `Subscriptions/`, `Scoring/`, `AmoCrm/`, `OpenAi/`, `Sms/`, `Jivo/`, `Onboarding/`, `Telegram/`, `Monitoring/`, `Reporting/`.
   - Традиционные Laravel: `Http/` (606 файлов), `Models/` (164), `Services/` (258), `Contracts/` (78), `Exceptions/` (68), `Policies/` (42).
3. **Только 1 расхождение «путь в доке не существует в коде»** из 111 проверенных path-упоминаний: `app/Subscriptions/Services/TierService.php` — реально `app/Services/Billing/Tier/TierService.php`.

### TBD, которые закрыты фактами из кода

| Файл | TBD был | Факт |
|---|---|---|
| `identity.md` | SMS-провайдер неизвестен | **sms.ru** (`app/Sms/Clients/SmsRuClient.php`, `app/Sms/Drivers/SmsRuDriver.php`). Параллельно `LogsSmsDriver` для локалки |
| `identity.md` | `UserRegistered` event — TBD | `app/Events/Users/UserRegistered.php` + listener `app/AmoCrm/Listeners/DispatchUserRegistered.php` |
| `identity.md` | PostHog для identity событий | Зависимость `posthog/posthog-php: ^4.0` есть, серверных вызовов для identity **не найдено** — трекинг только фронтовый |
| `billing.md` | 7 service TBDs | Все найдены в `app/Services/Billing/*` (BalanceService, PaymentService, Compensation*, Invoice, Order, PaymentMethod, PromoCode, Tier). Интерфейсы — в `app/Contracts/Services/Billing/*`. Паттерн: `FooService` + `DefaultFooService` |
| `billing.md` | события InvoicePaid/Compensation* | Перечень из `app/Events/Billing/*` задокументирован точно. `CompensationWithdrawalCompleted` — **не существует**, статус меняется из Strategy напрямую |
| `billing.md` | `RecipientDetails` шифрование в БД | **Не зашифровано** — чистый JSON-cast (`app/Models/Billing/Balance/RecipientDetails.php`). Зафиксировано как security-audit TBD |
| `subscriptions.md` | `TierService` путь | Исправлен на `app/Services/Billing/Tier/TierService.php` |
| `realty.md` | `RealtyService`, `RealtyPublicationService` | `RealtyService` есть (`app/Services/Realties/`) вместе с `RealtyUpdateService` + `RealtyStateService`. Отдельного `RealtyPublicationService` **нет** — публикация идёт через `PublishingService` |
| `realty.md` | Поведение archive/restore | soft-archive через `POST /archive` + `POST /restore`. Подтверждено routes.json |
| `realty.md` | Widget items admin-UI | Admin API есть (`/admin/services/{service_id}/widget/*`). UI — проверять визуально в Волне 7 |
| `publishings.md` | `PublishingService` путь | `app/Services/Publishings/PublishingService.php` + `DefaultPublishingChargeService`, `PromotionService`, `ExpirationService` (в `app/Publishings/Services/`) |
| `publishings.md` | `CianPublishingService` | **Нет отдельного файла** — логика в `CianPublishingController`. Tech-debt: выровнять с Avito |
| `publishings.md` | Event-name для Avito/CIAN publish | Actual events: `AvitoPublishingActivated`, `AvitoPublishingStatusChanged`, `CianPublishingPublished`, `CianPublishingStatusChanged` и др. Перечень полный |
| `publishings.md` | Scheduler интервал | `ProcessPublishingExpirationCommand` — **каждые 30 минут** (`app/Publishings/Console/Scheduler.php`) |
| `publishings.md` | DomClick feed | `/feed/domclick` в routes/api.php **отсутствует**. Подтверждено routes.json |
| `leads.md` | `LeadCreated`/`LeadAssigned` events | **Не существуют** в коде — уведомления идут напрямую из сервиса. Помечено как tech-debt |
| `leads.md` | `SyncLeadsCommand` интервал | **Каждые 15 минут** (`app/Leads/Console/Scheduler.php`) |
| `leads.md` | source `direct`/`referral` | `direct`-submit endpoint в routes нет, `referral`-код тоже нет. Оба значения в enum — зарезервированы, но не реализованы |
| `services.md` | `ServiceRequestStatus` enum значения | `created`, `in_progress`, `completed`, `canceled` (через один L). **Нет** `paid`/`finished`/`cancelled` — доку правил |
| `services.md` | service-сервисы | Перечень заполнен: ServiceRequestService, ServicePriceService, ServicePriceCalculator, ServiceChargeService + 5 State-классов в `app/Services/Services/Requests/States/` |
| `services.md` | events | Actual: `ServiceRequested` в `app/Events/Service/Request/`. Других (Paid/Finished) **нет** |
| `widget.md` | WidgetItemData FK | Поле `public Service $service` — однозначно ссылается на `Service` (подтверждено кодом) |
| `widget.md` | Клиентский self-service | Заблокирован `auth:user` middleware на `/realties/{realty_id}/widget/order` |
| `onboarding.md` | `OnboardingProgress` путь | `app/Onboarding/Models/OnboardingProgress.php`. Listener-ы все перечислены: InitializeOnboardingProgress, ProcessPublishingCreated, ProcessRealtyPublished, ProcessUserProfileUpdate, ProcessUserSubscribed |

### TBD, которые оставлены как «open question» (не баги доки, а неопределённость продукта)

- **realty-prompts.md**: rate-limit, A/B-тесты, перенос в Job, null-defaults в переменных — все 4 открытые вопросы.
- **publishings.md**: Яндекс.Недвижимость не интегрирована, Avito Messages UI, частота batch'ей — отмечено как известные расхождения паспорт ↔ код.
- **subscriptions.md**: 3 UX/бизнес-вопроса (напоминания за 3 дня, Enterprise-тариф, downgrade UX).
- **services.md**: Комбо-скидки не определены в ТЗ; endpoint «Мои заявки» UI-уровня пока нет.
- **scoring.md**: Интеграции с Росреестром/ФНС не сделаны — юрист работает вручную.
- **billing.md**: нотификация юзеру при failed CP transaction работает не всегда.

### Новые находки — добавить в tech-debt

1. **`RecipientDetails` хранятся без шифрования** — security-аудит нужен.
2. **`CianPublishingService` отсутствует** — структура выровнена с Avito только наполовину.
3. **`LeadCreated`/`LeadAssigned` events отсутствуют** — трекинг делается императивно в сервисе, не через events.
4. **`ServiceRequestCompleted`/`ServiceRequestCanceled` events отсутствуют** — State-классы диспатчат уведомления сами.
5. **`CompensationWithdrawalCompleted` event отсутствует** — Strategy-классы диспатчат уведомления сами.

Эти 5 пунктов пополняют список tech-debt для `internal/14-tech-debt.md`.

---

## 2026-04-23 (сессия 4) — Волна 3: БД (04-database.md) + 12 интеграций (05-integrations/*)

### Дамп миграций

- Забрал все 156 миграций из `database/migrations/@dev` в `_verification/migrations-dev-2026-04-23.json`.
- Забрал полный `config/services.php`, `.env.example`, и 8 вспомогательных конфигов (`amo_crm`, `integration`, `leads`, `open_ai`, `sms`, `telegram`, `verification-codes`, `reporting`) в `_verification/`.

### 04-database.md — правки имён таблиц

Переписал блок «Структура: кластеры таблиц» и «Самые живые таблицы» с фактическими именами из миграций. 14 ошибок в именах таблиц:

| Было в доке | По миграциям |
|---|---|
| `user_telegram_info` | **Нет такой таблицы** — telegram-поля в колонках `users.telegram_chat_id/telegram_username`. Отдельная `telegram_chat_bindings` — для одноразовых токенов привязки |
| `user_admin_files`, `admin_files` | Нет таких таблиц — файлы админов через полиморфную `media` |
| `houses`, `land_plots`, `new_apartment_info` | `realty_houses`, `realty_land_plots`, `realty_new_apartment_info` |
| `realty_prompt_settings` | Нет — settings хранятся в коде |
| `widget_items`, `widget_orders`, `widget_order_items` | `realty_widget_items`, `realty_widget_orders`, `realty_widget_order_items` (создано 30-31.03.2026) |
| `plan_levels` | Нет — уровни хранятся в `plans` + матрица скидок в `plan_level_settings` |
| `plan_service_pivot` | `plan_service` |
| `compensation_withdrawals` | `compensation_withdraws` |
| `service_categories`, `service_request_files` | Нет таких таблиц — категория колонкой, файлы через `media` |
| `onboarding_progresses` | `onboarding_progress` (singular) |
| `onboarding_steps` | Нет — ключи шагов в константах модели |
| `event_dispatches` | `amo_crm_event_dispatches` |
| `payments` | Нет общей таблицы — `cp_invoice_payments` + `balance_invoice_payments` отдельно |
| `sessions` | Нет миграции — API stateless через Sanctum |

Добавлены в документ таблицы, о которых молчала дока: `avito_new_developments`, `departments`, `dadata_cities`, `external_balances`, `feeds`, `feed_request_data`, `subscription_renewals`, `job_batches`, `settings`.

«Самые живые таблицы» переписаны по фактическому подсчёту миграций — `users` (10), `locations` (8), `services` (8), `invoices` (7), `realties` (5). Было: `services` (7), `locations` (5), `invoices` (4) — все три числа устаревшие.

Блок «Недавние миграции» переписан — был «июль-август 2025», стал «фазы развития схемы» с 4 волнами до 13.04.2026 (последняя — `create_external_balances_table`).

### 05-integrations — правки конфигов и кода

Каждый файл интеграции привёл в соответствие с фактическими `config/*.php` и `.env.example`.

**amocrm.md:** Конфиг в `config/amo_crm.php`, **три webhook-URL'а захардкожены** в коде (`hooks.tglk.ru/in/...`) — не в env. Env-переменная только `AMO_CRM_HOOKS_ENABLED`. Listener-файлы перечислены полностью (5 штук в `app/AmoCrm/Listeners/`). Event `card.authorized` имеет listener, но **отдельного URL в конфиге нет** (tech-debt).

**cloudpayments.md:** Конфиг в `config/services.php`: `cloud_payments.public_id` + `cloud_payments.secret`. **Всего 2 env-переменные**, не 5 как было задокументировано. Receipt email / tax system — на стороне CP-ЛК.

**avito.md, cian.md:** Конфиг не в `config/services.php`, а в **`config/integration.php`**. Avito: `client_id/client_secret/user_id` + enable-флаг. CIAN: `access_token` + enable-флаг. `AVITO_API_URL` **не в env** (хардкод в клиенте). CIAN_PARTNER_ID в коде не существует.

**openai.md:** Конфиг `config/open_ai.php` — всего 2 переменные: `OPEN_AI_FAKE_MODE` (default true!) и `OPEN_AI_API_KEY`. Модели под задачи и ORG_ID в конфиге **не разделены**. `PROXY_URL` используется для обхода блокировок.

**sms.md:** Конфиг `config/sms.php`. **По умолчанию provider=logs**, не sms.ru. Переменные `SMS_PROVIDER`, `SMS_RU_API_ID`, `SMS_RU_TEST`. Альфа-имя отправителя — на стороне sms.ru-ЛК.

**telegram.md:** **Два бота** — `public` (с командой `/start`) и `errors` (для dev-алертов). **4 report-канала** в `config/reporting.php` (expiring_publishings, publishing_errors, new_users, requests). Proxy-клиент для обхода блокировок. Добавил точные имена всех env-переменных.

**dadata.md:** Env — `DADATA_API_KEY` и `DADATA_SECRET` (не `DADATA_SECRET_KEY`).

**posthog.md:** ⚠️ **В backend-коде на 2026-04-23 нет ни одного файла с PostHog-клиентом.** Только composer-зависимость и запись в `config/services.php`. Серверных событий не отправляется — трекинг только фронтовый.

**yandex-metrika.md:** Добавил дисамбигуацию: `app/Api/Yandex/YandexDiskApiClient.php` — это **Я.Диск для импорта лидов** (`LEADS_YANDEX_DISK_URL`), не Я.Метрика. Метрика — только клиентский JS.

**jivosite.md:** Проверено — вся интеграция это 2 файла в `app/Jivo/` (controller + provider). Webhook-токен захардкожен в `routes/api.php` — tech debt зафиксирован.

**domclick.md:** Подтвердил `_verification`'ом: никаких `DOMCLICK_*` env-переменных, никакого `/feed/domclick` endpoint'а. Интеграции через код **нет**.

### Бонус: leads sync

Документация leads.md упускала, что `SyncLeadsCommand` читает лиды не только из Avito/CIAN API, но и из **Яндекс.Диска** (`LEADS_YANDEX_DISK_URL`) и **Google Spreadsheets** (`LEADS_GOOGLE_SPREADSHEETS_ID`). Эти два источника добавлены в таблицу в `02-modules/leads.md`.

### Новые находки для tech-debt

1. **3 AmoCRM webhook-URL захардкожены** в коде — не в env / vault.
2. **JivoSite webhook-токен в `routes/api.php`** — не в env.
3. **PostHog backend-интеграция — только на бумаге**: зависимость установлена, но серверный трекинг отсутствует.
4. **CIAN без выделенного service-класса** (асимметрия с Avito).
5. **DomClick-интеграция не реализована** вовсе — только упомянута в паспорте как «партнёр».

---

## 2026-04-23 (сессия 5) — Волна 4: internal 00, 01, 07-15

### Точное расписание Scheduler'ов

Прочитал все 4 `Scheduler.php` файла, зафиксировал частоты:

| Команда | Частота |
|---|---|
| `ProcessExpiringSubscriptionsCommand` | каждую минуту |
| `ProcessSubscriptionRenewalsCommand` | каждую минуту |
| `SyncLeadsCommand` | каждые 15 минут |
| `ProcessPublishingExpirationCommand` | каждые 30 минут |
| `ReportExpiringPublishingsCommand` | ежечасно в :40 |
| `ReportPublishingPlatformErrorsCommand` | ежечасно в :05 |

Остальные `Load*Command` в `app/Console/Commands/Avito|Cian|Dadata|Feeds|Monitoring/` в Scheduler.php **не зарегистрированы** — запускаются вручную или через внешний cron. Доку в 10-jobs-queues.md привёл к реальности.

### CI/CD (12-infrastructure + 07-frontend + 13-dev-process)

Прочитал актуальные `.gitlab-ci.yml` backend и frontend на `dev`/`develop`:

- **Prod-триггер — `premaster`-ветка**, не `main`/`master`. Срабатывает автоматически, без manual-шага.
- **Runners**: `gitlab-docker` (build), `rspace_dev` (deploy dev), `rs_prod` (deploy prod).
- **Secrets**: `rspase/secrets/dev.git` (deploy-token `rspace+deploy-token`) и `rspase/secrets/prod.git` (deploy-token 62).
- **Миграции на prod** запускаются **автоматически** в `app_install_prod` → `php artisan migrate --force`.
- `Dockerfile-backend`: `php:8.4-fpm` (Debian-based, **не Alpine**), nginx **внутри** backend-контейнера (`apt-get install nginx`). Отдельного nginx-контейнера нет.
- Frontend: `deploy_prod` стадия **настроена и работает** — устаревший пункт в 14-tech-debt.md закрыт.

### Интеграции и ENV (01-architecture + 12-infrastructure)

- Привёл таблицу «Активные интеграции» в 01-architecture.md к фактическому состоянию (ДомКлик без интеграции, Яндекс.Диск / Google Spreadsheets как источники лидов, PostHog без backend-трекинга и т.д.).
- Заменил неверные имена env-переменных в 12-infrastructure.md на фактические (в т.ч. `CLOUD_PAYMENTS_PUBLIC_ID/SECRET` вместо `CP_*`, `SMS_RU_API_ID`, два Telegram-бота + 4 report-канала, `LEADS_SYNC_ENABLED` etc.).
- Закрыл TBD про mail-провайдер: в `config/services.php` есть три транспорта (`postmark`, `ses`, `resend`) на выбор. В backend-коде email-notification классов не найдено — email, возможно, не используется на проде.

### 14-tech-debt: 9 новых пунктов от верификации

Добавил раздел «Добавлено при верификации документации (2026-04-23)» с 9 пунктами:

1. **TD-V1:** AmoCRM webhook-URL'ы захардкожены в коде.
2. **TD-V2:** JivoSite webhook-токен в `routes/api.php`.
3. **TD-V3:** PostHog backend-трекинг не реализован.
4. **TD-V4:** CIAN publishing без выделенного сервиса.
5. **TD-V5:** `RecipientDetails` хранятся в БД без шифрования (P0 — security).
6. **TD-V6:** События для ключевых state-изменений отсутствуют (Compensation/ServiceRequest/Lead).
7. **TD-V7:** `sessions` таблицы нет, но `SESSION_DRIVER=database` в конфиге.
8. **TD-V8:** Jobs для публикации на Avito/CIAN отсутствуют (публикация синхронная).
9. **TD-V9:** `PROXY_URL` для OpenAI/Telegram без мониторинга доступности.

Также закрыл устаревший пункт «Frontend prod-deploy в CI не настроен» — prod-стадия работает.

### События (11-events.md)

- `UserRegistered`: единственный listener — `DispatchUserRegistered` (AmoCRM). PostHog/Telegram welcome в коде не настроены.
- `UserProfileUpdated`: listener'ов **вовсе нет** — событие диспатчится в пустоту.
- `RealtyPublished`: listener — `ProcessRealtyPublished` из Onboarding.

### Landing (08-landing)

- Sitemap **статический** (`public/sitemap.xml`, сгенерирован внешним генератором, lastmod 2025-10-31). `src/app/sitemap.ts` нет.

### Frontend (07-frontend)

- Версии dependency-таблицы подтверждены сверкой `develop/package.json` — доку уже правильна.
- PostHog-провайдер вопрос: импортирован в `root.tsx`, **не обёрнут в Layout** — не активен. Серверного трекинга тоже нет.

---

## 2026-04-23 (сессия 6) — Волна 5: 18 файлов external/*

### Что проверено

- Все 18 файлов `external/*.md` + README.
- Цены тарифов, уровни, скидки — сверены с `_sources/01a-tariffs-quickref.md` (выжимка из ТЗ «Пересборка подписочной модели»). **Сходятся 1:1**:
  - Профи 5000/4000, −20%; Премиум 9000/7000, −25%; Ультима 17000/13000, −30%.
  - Лимиты объектов (3/3/5/10), ипотечных брокеров (1/1/2/3), проверок объекта (—/1/2/3).
  - Цены услуг в рублях (Столица и Регионы) — точное совпадение с ТЗ.
- Known Issues (`external/15-known-issues.md`) — все 12 BUG'ов из `_sources/03-qa-report.md` отражены.
- Активные сессии (`external/12-settings.md`): подтверждено, что endpoint'ов `/profile/sessions` или `/profile/devices` в `routes/api.php` **нет**. Единственная операция — `POST /auth/logout/all`.
- City/Region классификация в коде — через поле `capital_marker` модели `App\Models\Dadata\Cities\DadataCity` (стандартное поле Dadata).

### Правки

- **`external/12-settings.md`**: два TBD про «Активные сессии» заменены на фактическое состояние из кода — отдельного списка устройств нет.

### TBD, которые **не закрываются** из кода (требуют business/legal input)

Это интенциональные open-items, помеченные TBD с контекстом. Источник закрытия — **не код**, а команда RSpace:

- **`external/16-legal.md`** (13 TBD): URL'ы PDF-документов (оферта, privacy, cookies, terms), юр.адрес, ИНН/КПП/ОГРН, телефон оператора, статус в реестре операторов ПД. Нужно уточнять у юр.отдела.
- **`external/17-contacts.md`** (10 TBD): номер телефона поддержки, адреса офисов, email'ы для PR / invest / partners / club, статус соцсетей, Telegram-канала. Нужно у PR/SMM.
- **`external/00-about.md`** (1 TBD): партнёры-страховщики. Нужно у отдела страхования.

Эти TBD остаются как есть. При переносе в Notion — отобразить как заметные заметки, чтобы куратор раздела мог их быстро дозаполнить. Код не даёт им ответов.

### Вердикт по external-документации

Контент **сверен**. Цены, тарифы, лимиты, баги — точно на своих местах. Открытые вопросы сводятся к данным, которые живут не в коде (юридические, контактные, страховые партнёры). Блокеров для переноса в Notion нет.

---

## 2026-04-23 (сессия 7) — Переименование AI-юриста: «Грутто» → «Грут»

По указанию Игоря. Затронуто 7 файлов (все актуальные места упоминания AI-юриста):

| Файл | Изменения |
|---|---|
| `external/00-about.md` | 3 вхождения |
| `external/01-tariffs.md` | 1 вхождение (в таблице лимитов) — попутно выровнена колонка |
| `external/02-start.md` | 1 |
| `external/07-legal.md` | 2 (заголовок секции + bullet) |
| `external/13-faq.md` | 1 (заголовок FAQ-вопроса) |
| `external/README.md` | 1 (TOC) |
| `internal/01-architecture.md` | 1 (таблица зависимостей) |
| `internal/05-integrations/openai.md` | 1 (назначение модуля) |

**Не трогал:** `_sources/01-tariffs-tz.md`, `_sources/01a-tariffs-quickref.md`, `_sources/06-retention-tz.md` — это архивные исходные ТЗ, они остаются с «Грутто» (как в оригинале). Фактический брендинг теперь определяется актуальной докой.

Возможно старые варианты «Грутто/Grutto» остались в коде — код я в эту сессию не менял. Если в реальных user-facing строках кабинета (`frontend`, `landing`) тоже встречается — потребуется отдельный PR в frontend/landing-репо.

---

## 2026-04-23 (сессия 8) — Волна 6a: Обход лендинга rspace.pro через Chrome

### Что сделал

- Написал `_verification/landing-verification-plan.md` — чеклист на 13 блоков, прежде чем лезть в браузер.
- Подключился через Claude-in-Chrome, прошёл всю главную лендинга сверху вниз.
- Подтащил тексты 3 legal-документов через curl (`/docs/privacy/`, `/docs/oferta/`, `/docs/oferta-vivod/`), вытащил реквизиты ЮЛ.
- Записал всё в `_verification/landing-walkthrough-2026-04-23.md` — 13 блоков, все find, все ссылки, все расхождения.

### Закрыто в документации

**`external/17-contacts.md`:**
- Добавлен телефон `+7 (930) 666-25-95` (виден в хедере и футере лендинга).
- Добавлен WhatsApp (тот же номер).
- Telegram поддержки уточнён: не `@rspace_support`, а **`@Maria_RSpace`** (личный чат с Марией).
- Удалены нереально существующие email'ы (`press@`, `invest@`, `partners@`, `club@`) — заменено на единый `support@rspace.pro` с темой.
- Убрано упоминание несуществующих соцсетей и `@rspace_news` канала.
- Исправлен юридический адрес: ООО «**ЭРСПЕЙС**» (не «РСпейс»), Нижний Новгород (не Москва).

**`external/16-legal.md`:**
- Имя ЮЛ: **ООО «ЭРСПЕЙС»**.
- ИНН `5260499800`, КПП `526001001`.
- Адрес: `603001, г. Нижний Новгород, ул. Рождественская, д. 26, пом. П3`.
- Телефон: `+7 (930) 666-25-95`.
- Email: `support@rspace.pro` (подтверждено в тексте privacy).
- URL'ы legal-документов — не PDF, а HTML: `/docs/privacy/`, `/docs/oferta/`, `/docs/oferta-vivod/`.
- Cookie Policy и Terms as отдельных файлов **нет** — зашиты в Политику / Оферту.
- ОГРН — в публичных документах не указан, требует выписки из ЕГРЮЛ.

### Найденные критичные продуктовые расхождения (требуют решения)

1. **AI-юрист Грут на лендинге на всех 3 тарифах** (включая Профи). В `_sources/01a-tariffs-quickref.md` и `external/01-tariffs.md` — только Премиум+. Один из источников врёт.
2. **Лимиты в тарифах:** на лендинге `1/2/3 подготовки ДКП с юристом`. В наших источниках — `1/2/3 проверки объекта`. Видимо, перепроектировали, но доку никто не обновил.
3. **Региональная вкладка тарифов:** абонплата меняется (4000/7000/13000), но цены клубных услуг остаются **московскими**. Баг лендинга.
4. **Service Fee прогрессивная скидка** (−2% от 3 сделок, −5% от 7) упомянута в подстрочнике блока тарифов, но в доке этого нет и в `_sources` нет.
5. **«Бесплатный тариф»** обещан в лендинг-FAQ (draft объектов + КП без публикации), но в доке он не описан. Либо есть и не задокументирован, либо обещание без реализации.
6. **RSpace PRO Community** — новый продукт на лендинге (коммьюнити для проф.риелторов), не упомянутый в доке. CTA «ПОЛУЧИТЬ ДОСТУП» ведёт на обычную регистрацию.
7. **Пассивный доход 10 000 ₽/год с пролонгации** и **15 000 ₽ за страховку** — конкретные числа на лендинге, не зафиксированы в доке.
8. **«Проверка собственника и объекта»** — в тексте описания блока вместо проверки стоит описание «лид на 30% дешевле». Копирайт-баг лендинга.
9. **Typo:** «со каждой» → «с каждой» в FAQ про комиссии.
10. **Copyright 2025** на лендинге — устарел.

### Новые фактические данные (закрывают TBD)

- H1 лендинга: «Зарабатывайте больше с каждой сделки».
- Meta-описание: «Упростите работу с RSpace: мгновенное размещение на ведущих площадках, AI-юрист для сложных кейсов и рост дохода в 2 раза. Создано риелторами для риелторов.»
- URL регистрации: `https://lk.rspace.pro/registration` (не `/auth/register`).
- URL логина: `https://lk.rspace.pro/` (корневой).
- Публичные тарифные карточки на лендинге имеют CTA «НАЧАТЬ БЕСПЛАТНО», а hero — «ПОПРОБОВАТЬ БЕСПЛАТНО 30 ДНЕЙ». Копия разъехалась.

### Что дальше

- **Следующий шаг:** обход `lk.rspace.pro` (ЛК). План составлю отдельно. В первую очередь — регистрация, чтобы увидеть экран привязки карты при триале, и реальные экраны/URL'ы ЛК.
- Затем — обход `admin.rspace.pro/console/users` в режиме read-only.

---

## 2026-04-23 (сессия 9) — Волна 6b: ЛК lk.rspace.pro — публичная часть

### План
`_verification/lk-verification-plan.md` с 9 блоками, начиная с публичных страниц (без логина).

### Публичные URL'ы: полная проверка

| URL | Статус | Комментарий |
|---|---|---|
| `/` | 200, title «RSpace» | Страница логина |
| `/login` | 200, title «Авторизация» | Тот же логин (редирект с защищённых `/my/*` сюда) |
| `/registration` | 200 | Одноэкранная форма регистрации (4 поля) |
| `/reset` | 200 | Восстановление пароля (телефон + новый пароль + подтверждение) |
| `/my` | 200 → редирект на `/login` анонимному | Root ЛК |
| `/my/services` | 200 | |
| `/my/subscription` | 200 | |
| `/my/profile` | 200 | |
| `/offer/1` | 200 | Публичная карточка объекта, работает без логина |
| `/auth/login` | **404** | Документация ссылалась на этот URL — **нет** |
| `/my/realties` | **404** | |
| `/my/balance` | **404** | |
| `/my/leads` | **404** | |
| `/my/notifications` | **404** | |

### Правки в документации

**`external/02-start.md`:**
- Шаг 1 «Регистрация» **полностью переписан** по факту UI:
  - Форма одноэкранная (4 поля + чекбокс + submit), не 4-шаговый wizard.
  - Требования к паролю: **6 символов** (не 8), + upper/lower/digit/special.
  - Правильный URL регистрации: `lk.rspace.pro/registration`.
  - Чекбокс согласия с **офертой** и **согласием на обработку ПД** — оба обязательные.

**`external/16-legal.md`:**
- Добавлен **четвёртый** юридический документ: `https://rspace.pro/docs/consent` — «Согласие на обработку персональных данных», подаётся на экране регистрации отдельной ссылкой. В футере лендинга её нет, нашёл только в форме регистрации.

### Находки, которые требуют решения команды

1. **«Запомнить меня»** на логине — **по умолчанию checked**. Security-консервативно лучше снимать по умолчанию (токены месячной длительности).
2. **Поле на логине называется «ТЕЛЕФОН»**, но subtitle говорит «Введите ваш **логин и пароль**». Непоследовательность — пользователь может подумать, что можно ввести email.
3. **Два URL-экрана логина** (`/` и `/login`) рендерят одну страницу с разными `<title>` («RSpace» vs «Авторизация»). SEO + история браузера путаются.
4. **URL оферты** на форме регистрации — `/docs/oferta` без trailing slash, в футере — с ним. Работает и так и так, но URL не нормализован.

### Не проверено (требуется залогиниться)

- Экран ввода SMS-кода после «ЗАРЕГИСТРИРОВАТЬСЯ».
- **Экран привязки карты при триале** (критичный продуктовый факт, который сейчас стоит у нас в доке).
- Экран выбора тарифа.
- Вся защищённая часть ЛК: список объектов, услуги, подписка, баланс, профиль.

Для этого нужен тестовый аккаунт или реальные реквизиты. Без них этот блок не закроется. Также для самой **регистрации на триал-с-картой** можно взять реальную карту (но это живой платёж CP + холд 1 ₽) — делать только по твоему явному согласию.

---

## 2026-04-23 (сессия 10) — Волна 6c: ЛК после логина (с аккаунтом)

### Что сделал

- Прошёл с реальным логином (Профи, Краснодар, 25 услуг) по 5 из 8 плановых блоков:
  - 1.1 Dashboard `/my`
  - 1.2 Объекты `/my/listing` + 1.2a Редактирование `/my/listing/{id}/edit`
  - 1.5 Услуги `/my/services`
  - 1.6 Подписка `/my/subscription`
  - 1.7 Вывод средств `/my/withdrawal` (+ весь FAQ)
  - 1.8 Профиль `/my/profile`
- Полный отчёт — в `_verification/lk-walkthrough-2026-04-23.md`.

### Главное разрушительное открытие: «баллы» vs «рубли»

Платформа использует **две валюты**:

- **Баллы** (`users.balance`) — внутренняя валюта для оплаты подписки и услуг. **Не выводятся.** Пополняются через CloudPayments.
- **Рубли** (`users.compensation_balance`) — «рублёвый счёт», реальные деньги от комиссий банка/страховок/аккредитивов. **Выводятся заявкой за 3-5 рабочих дней.**

Это в FAQ на `/my/withdrawal` написано дословно. Наша документация в `external/09-balance.md` и `internal/02-modules/billing.md` эту модель не отражает корректно — там два «баланса» описаны как технические артефакты, не как понятные пользователю сущности.

### Главное расхождение: способ оплаты подписки

**Подписка оплачивается с Внутреннего баланса (баллов), а не с карты.**

Я это видел прямо в `/my/subscription`: «СПОСОБ ОПЛАТЫ: **Внутренний баланс**». Значит:
- Триал НЕ обязательно требует карту (как я правил ранее).
- Карта привязывается **только когда юзеру нужно пополнить баллы**, чтобы хватило на подписку.
- Моя правка «external/01-tariffs.md» и «external/02-start.md» о «привязке карты при триале» **может быть некорректна**, или корректна только в подмножестве флоу.

**Нужно откатить или уточнить мою правку про карту** после того, как выяснится реальный флоу.

### Новые URL'ы ЛК (правильные, закрывают документацию)

| В доке было | Реально |
|---|---|
| `/my/realties` | **`/my/listing`** |
| `/my/balance` | **`/my/withdrawal`** (ruble account) + счётчики на `/my` |
| `/my/leads` | Пока не нашёл — в dashboard «Лидов пока нет», ссылка не даёт URL |
| `/my/notifications` | Не существует |
| — | `/my/reports` (новый) |
| — | `/my/profile/offer` (настройка коммерческого предложения для public-offer) |
| — | `/my/profile/change-password` |
| — | `/logout` |
| — | `/my/listing/{id}/edit` (редактирование объекта, accordion из 6 секций) |
| — | `/my/services/{id}` (детали услуги) |

### Цены в ЛК ≠ цены на лендинге ≠ цены в `_sources`

Конкретные расхождения для тарифа Профи (Столица):

| Услуга | `_sources/01a-tariffs-quickref.md` | Лендинг | Живой ЛК |
|---|---:|---:|---:|
| Юрист на сделку | 21 000 | 21 000 | **12 000** |
| Проверка объекта | 7 000 | 7 000 | **5 500** |
| Подготовка ДКП | 2 000 | — | **1 600** |
| Проверка собственника | 3 000 | — | **2 400** |
| 2D/3D планировка | 500 | — | **400** |
| Онлайн ипотечный брокер | — (в доке бесплатно в лимите) | — | **12 000 ₽ + 1 бесплатный в лимите** |

Разница для юриста — **43%**. Три источника правды полностью разошлись.

### Набор услуг в БД ЛК (25 штук)

Полный список с id в `_verification/lk-walkthrough-2026-04-23.md`. Главное:

- **В ЛК ЕСТЬ услуги, которых нет ни в доке, ни в `_sources`**: Купить новостройку, Межрегиональные сделки, Сертификат безопасной сделки, Электронная регистрация сделки, SMS подписание договоров, Комьюнити для профи, AI-юрист, Полная проверка (комбо), Продвижение на классифайдах, отдельная Отрисовка 3D планировки.
- **В доке и `_sources` ЕСТЬ услуги, которых нет в ЛК**: Сопровождение покупателя, Сопровождение продавца, Проверка задатка, Проверка аванса, срочные версии всех услуг.

### Лимиты тарифов по данным ЛК (`/my/subscription` → карточка Профи для Столицы)

- 3 публикация объекта (столицы)
- 1 онлайн ипотечный брокер
- **1 подготовим ДКП (столицы)** (а не «1 проверка объекта» как в доке!)
- ∞ заявка на ипотеку
- ∞ страховой брокер
- ∞ шаблоны договоров
- ∞ купить новостройку
- ❌ AI-юрист **НЕ в списке Профи**
- ✅ AI-юрист **в списке Премиум**

Но на services-shelf у того же юзера AI-юрист (id=27) помечен «Доступно: ∞». Значит services-shelf и subscription-card противоречат друг другу внутри одного UI.

### Подтверждено в UI

1. **Реферальная программа в UI работает** (поле «Ваша реферальная ссылка» в профиле). Это частично закрывает P0 tech-debt про рефералов.
2. **Виджет «Ускорьте продажу»** на `/my/listing/{id}/edit` — реальный `WidgetItem`-блок с полями «+22% просмотров», «−7 дней» (это поля `WidgetItemData.viewsPercent` + `daysCount` из кода).
3. **BUG-001 «undefined»** воспроизведён живьём на странице `/my/services`.
4. **Промокод SUPERSTAR** даёт 30% скидку на подписку (5 000 → 3 500).
5. **Автосписание подписки с внутреннего баланса**, а не с карты.
6. **Реальная выплата партнёра** («Выплата вознаграждения ООО Домклик +144 767 ₽») — ДомКлик реально платит комиссии, даже без API-интеграции.

### Что вынести на обсуждение с продуктом (блокер для переноса в Notion)

До ответа команды менять `external/01-tariffs.md`, `external/07-legal.md`, `external/09-balance.md` нельзя:

1. **Какой тарифный каталог — правда?** ЛК (25 услуг, цены ×0.6 от источника), лендинг (как источник), `_sources` (плотно 10 услуг)?
2. **AI-юрист на Профи — включён или нет?** Subscription-card показывает что нет, services-shelf — что есть. Лендинг говорит — есть.
3. **Лимиты в тарифе: «проверки объекта» (`_sources`) или «подготовки ДКП с юристом» (ЛК)?**
4. **Подписка с карты или с баллов?** (UI показывает «с баллов»). Если всегда с баллов — нужно полностью переписать раздел оплаты.
5. **Сколько у Профи публикаций — 3 (тариф) или 4 (счётчик на dashboard)?**
6. **Комиссионная модель Service Fee** (−2% от 3 сделок, −5% от 7) упомянута только на лендинге. В коде не искал, в UI ЛК не увидел — может быть не реализована.
7. **RSpace PRO как отдельный продукт** или просто услуга «Комьюнити для профи» (id=26)?
8. **Тестовая ли эта среда?** Цены в ЛК настолько низкие, что кажется dev/stage. Нужно подтверждение.

---

## 2026-04-23 (сессия 11) — Волна 6d: Админка admin.rspace.pro

### Что сделал

- Зашёл в админку как супер-админ Орлова И. М. (сессия уже авторизована).
- Прошёл **3 ключевых раздела**: `/console/users` (список), `/console/plans` (тарифы + Настройки уровней), `/console/services` (каталог).
- Записал в `_verification/admin-walkthrough-2026-04-23.md`.

### 🔴 ГЛАВНАЯ РАЗГАДКА: формула цен услуг

В админке в **«Тарифы → Настройки уровней»** увидел два параметра на каждый уровень:
- **Наценка (%)** — маржа RSpace.
- **Скидка на услуги (%)** — то, что применяется к base_price.

Значения:

| Уровень | Наценка | Скидка |
|---|---:|---:|
| Профи | 20 | **20** |
| Премиум | 19 | **25** |
| Ультима | 18 | **30** |
| Демо | 20 | **0** |

**Формула:** `price_for_user = base_price × (1 − plan_discount / 100)`. Подтверждено на «Юристе на сделку»: base=15 000 ₽ → Профи 12 000, Премиум 11 250-11 500, Ультима 10 500 — совпадает с ЛК.

### 🔴 Вывод: `_sources/01a-tariffs-quickref.md` УСТАРЕЛ, лендинг ВРЁТ

В БД на 2026-04-23 цены услуг **ниже**, чем в ТЗ и на лендинге:

| Услуга | `_sources` (без подп., Столицы) | Лендинг | БД `services` |
|---|---:|---:|---:|
| Юрист на сделку | 26 250 | 26 250 | **15 000** |
| Подготовка ДКП | 2 500 | — | **2 000** |
| Проверка объекта | 8 750 | — | **7 000** |
| Проверка собственника | 3 750 | — | **3 000** |

Разница Юриста: **−43%**. Два варианта: либо продукт снизил цены и забыл обновить лендинг/ТЗ, либо лендинг/ТЗ — старая версия, которую нельзя использовать как источник для доки.

**Решение:** `external/01-tariffs.md` строится **только по `services.base_price` + Настройки уровней**. ТЗ и лендинг не использовать как источник цен.

### 🔴 13 тарифов в БД (плюс сломанная терминология)

Таблица `plans` содержит **13 записей**:
- id=1, 2 «Демо» — 0 ₽ (настоящий триал, Столицы/Регионы)
- id=3, 4 «Профи (Демо)» / «Демо (Профи)» — 5000/4000 ₽ (**устаревшие записи**)
- id=5, 6 Премиум — 9000 (Столицы) / 7000 (Регионы)
- id=7, 8 Ультима — 17000 / 13000
- id=9, 10, 11 Early birds для Столиц — **−30%** скидка (Профи 3500, Премиум 6300, Ультима 11900)
- id=12, 13 «Профи» — 4000 (Регионы) / 5000 (Столицы)

**Enterprise-тарифа в БД нет** — подтверждено.

**Конвенция «Уровень/Тип»:** колонка `«Тип»` содержит значения «Базовый» и «Премиум», но это НЕ уровень, а **региональная принадлежность**:
- «Базовый» = **Регионы**
- «Премиум» = **Столицы**

Это реальный UX-баг, описанный в QA-report как BUG-012: «Уровень Профи, Тип Премиум — перегруженная терминология».

### 🔴 Early Birds — отдельные тарифы, не промокод

Тарифы `id=9, 10, 11` — отдельные записи в `plans` с −30% ценой. **Не** скидка по промо-коду.

Пользователь «Фамилия Никита» (Краснодар, Профи 4000) подписан на **id=12** (Регионы, не Early birds). Я ошибся ранее — Early birds только для Столиц.

### 🔴 В БД 29 услуг

Полный каталог записан в `admin-walkthrough-2026-04-23.md`. Из 29:
- **Опубликовано:** около 25
- **Архивировано:** 4 (Фотограф, Размещение Москва, Размещение объекта, старая Проверка собственника-Столицы id=13)
- **С ценой «1 ₽»** (placeholder): 12 услуг (AI-юрист, шаблоны, заявка на ипотеку, страховой брокер и т.д.) — эти услуги показываются как «безлимитные в подписке».

### Услуги, которые раньше были «в ЛК, но не в доке»

Теперь подтверждены и в БД:
- id=21 Купить новостройку
- id=22 Межрегиональные сделки
- id=23 Сертификат безопасной сделки
- id=24 Электронная регистрация сделки
- id=25 SMS подписание договоров
- id=26 Комьюнити для профи (= маркетинговое «RSpace PRO»)
- id=27 AI-юрист
- id=28 Полная проверка (комбо)
- id=29 Продвижение на классифайдах

Услуги из `_sources`, которых **НЕТ** в БД (вычеркнуть из доки):
- Сопровождение покупателя (23 750 ₽ в ТЗ) — нет
- Сопровождение продавца (20 000 ₽) — нет
- Проверка задатка (2 000 ₽) — нет
- Проверка аванса (2 000 ₽) — нет
- Все срочные (×2 цена) версии — нет

### Ответы на 8 критичных вопросов из ЛК-обхода

1. **Какой тарифный каталог правда?** → БД. Формула: `base × (1 − discount)`. ЛК показывает правильно, лендинг и `_sources` устарели.
2. **AI-юрист на Профи?** → Услуга `id=27` published в БД. Юзер Профи видит «Доступно: ∞». Significa что он **доступен на Профи**.
3. **Лимиты:** для точного ответа нужна таблица `plan_service` — пока не открывал.
4. **Подписка с баллов** — подтверждено.
5. **3 vs 4 размещения** — TBD через `plan_service`.
6. **Service Fee** — в админке UI **нет такой настройки**. Вероятно не реализовано, только маркетинговое обещание на лендинге.
7. **RSpace PRO** = `services.id=26 "Комьюнити для профи"`, не отдельный тариф.
8. **Тестовая ли среда?** → Нет. Это prod. ДомКлик реально платит комиссии (в withdrawal-истории есть +144 767 ₽ от ДомКлик).

### Что ещё не проверил в админке

- Заявки на услуги, Скоринги, Заявки на скоринг, Звонки.
- Промокоды (нужно увидеть SUPERSTAR — механику скидки 30%).
- Объекты и Публикации.
- История платежей — внутренний формат транзакций.
- Администраторы — CRUD, роли, reassign.
- AI-генерация — настройки промптов.
- Карточка конкретного юзера («Фамилия Никита») — поля, подписка, файлы.
- Таблица `plan_service` — лимиты и привязка услуг к тарифам.

---

## 2026-04-23 (сессия 12) — Волна 6e: Админка — карточка юзера, промокоды, уточнение по карте

### Уточнение по «карта и триал» (важное!)

Пользователь поправил: **при триале карта всё-таки ПРИВЯЗЫВАЕТСЯ** (моя правка в `external/02-start.md` была верной). После триала её **можно отвязать** — подписка продолжает работать с внутреннего баланса (баллы), пока они не кончатся. Тогда админка и показывает «Методы оплаты: Нет» — не потому что карта не привязывалась, а потому что юзер её отвязал.

Формулировка в `external/02-start.md` и `external/01-tariffs.md` дополнена. Логика подписки теперь описана корректно.

### Промокоды (`/console/promo-codes`)

Таблица — 5 промокодов:
- RSPACE2026 (7%, истёк 01.01.2026)
- M4V7UV59 (1%, 30 дней, активен)
- ZH3M7P1V (7%, 1 год, активен)
- **SUPERSTAR (30% на подписки, 23/50 активаций, до 31.01.2045 — по сути вечный)**
- CUSDEVXNO8588I (30%, одноразовый, исчерпан)

Ключевой факт: **«Скидка на подписки» — только на подписки**, НЕ на услуги. Цены услуг считаются отдельно через plan_level.services_discount.

### Карточка пользователя «Фамилия Никита» (`/console/users/1`)

**Структура вкладок:** Пользователь | Объекты | Комментарии | История баланса | Использования услуг.

**Данные юзера:** подтвердили все поля из модели `User` (Фамилия, Имя, Отчество, Пол, Телефон, Верификация телефона, Подменный телефон, Email, Страна, Город, Дата регистрации).

**Платежные данные:**
- Баланс (баллы): 99 516 ₽ + кнопка «Изменить»
- Баланс вывода (рубли): 89 000,00 ₽ + кнопка «Пополнить»
- Методы оплаты: Нет (карта была отвязана)

**Подписка:**
- Статус: Активна
- План: Профи (Базовый) — `plans.name + plans.type` комбинация
- Уровень: Профи
- Цена плана: 4 000 ₽
- Период (дней): 30 — это период биллинга, не общий срок
- Дата начала: 06.02.2026 15:50
- Дата окончания: 07.05.2026 15:50 — 90 дней вперёд (3 списания)
- Новый план (запланирован): Ультима (Регионы) (Базовый), 13 000 ₽
- **Способ оплаты: Внутренний баланс** (баллы)

**Куратор:** не назначен. Предупреждение админу с кнопкой «Выбрать».

**Файлы:** можно прикреплять к юзеру.

### 🎯 Итоги всей Волны 6 (UI-верификация)

Пройдено:
- Лендинг rspace.pro (13 блоков).
- ЛК lk.rspace.pro (7 блоков из 8: dashboard, объекты, редактирование объекта, услуги, подписка, вывод, профиль).
- Админка admin.rspace.pro (5 блоков: пользователи, тарифы + настройки уровней, услуги, промокоды, карточка юзера).

Не проверены: экран публикации объекта, детальная карточка услуги в ЛК, внешние балансы в админке, AI-генерация, Скоринги, Звонки, Объекты/Публикации на admin-стороне, Настройка коммерческого предложения, `plan_service` связи.

### Обновления `external/*` по итогам волны 6

- `external/00-about.md`: нет изменений (требует бизнес-решения о AI-юристе и наборе услуг).
- `external/01-tariffs.md`: уточнил способ оплаты (баллы, не карта напрямую).
- `external/02-start.md`: переписан флоу регистрации (одноэкранная форма, 6-символьный пароль, обязательная привязка карты при триале + возможность отвязки после).
- `external/12-settings.md`: устранено 2 TBD про устройства.
- `external/16-legal.md`: добавлены реальные реквизиты ЮЛ (ООО «ЭРСПЕЙС», ИНН 5260499800, адрес в Нижнем Новгороде), добавлен 4-й документ (consent), HTML-URL'ы вместо PDF.
- `external/17-contacts.md`: реальный телефон +7 (930) 666-25-95, WhatsApp, Telegram @Maria_RSpace, юр.адрес, убраны несуществующие email'ы.

### Открытые вопросы к продукту (не закроются без команды)

1. **Лендинг показывает устаревшие цены услуг** (Юрист 26 250 ₽), в БД — 15 000 ₽. Либо обновить лендинг, либо `_sources`. Нельзя продавать цены, которых нет в системе.
2. **AI-юрист на Профи/Премиум/Ультима?** Services-shelf показывает «Доступно: ∞» на Профи, карточка подписки Профи AI-юриста не перечисляет, Премиум карточка перечисляет. Какой вариант правда?
3. **Какие лимиты «бесплатных» действий** в тарифе — ДКП (из лендинга) или Проверки объекта (из `_sources`)? Нужна таблица `plan_service` или её UI.
4. **Service Fee −2/−5%** (лендинг) — реализовано? В админке такого параметра нет.
5. **«Демо (Профи)» / «Профи (Демо)»** тарифы с ненулевой ценой — тестовые записи или активные?
6. **Срочные версии услуг** — нужно возвращать или убирать из документации.
7. **Нет услуг «Сопровождение покупателя/продавца», «Проверка задатка/аванса»** в БД — убрать из документации или восстановить в БД.

---

## 2026-04-23 (сессия 13) — Волна 6f: 7 оставшихся разделов админки

Пройдено ещё 10 разделов (больше чем запрошено, т.к. проверил не только 7, но и смежные с баланс-транзакциями/лидами):

### Новые URL'ы

| Раздел | URL | Содержание |
|---|---|---|
| Объекты | `/console/listings` | 1500+ объектов (7 страниц) |
| Продвижение | `/console/promotions` | 3 активных, 2 вкладки (Авито/Циан), тип `x10_7` и т.д. |
| Заявки на продвижение | `/console/promotion-orders` | Пусто сейчас |
| Заявки на услуги | `/console/service-orders` | **111 заявок, все без «Ответственного»** |
| Скоринги | `/console/scorings` | 3 записи (Полная проверка, Проверка собственника, Проверка объекта) |
| Заявки на скоринг | `/console/scoring-requests` | Пусто |
| Звонки | `/console/publishing-calls` | **7 312 звонков**, CSV-выгрузка |
| AI-генерация | `/console/prompts` | 1 промпт, модель **o4-mini-2025-04-16**, уровень мышления «Глубоко» |
| Администраторы | `/console/administrators` | **Только Орлова И. М.**, один супер-админ |
| История платежей | `/console/balance-transactions` | 204 транзакции, 3 вкладки (Баланс/Баланс вывода/CloudPayments) |
| Заявки на вывод | `/console/withdrawal-orders` | 16 заявок, крупнейшая 163 745 ₽ |
| Лиды | `/console/leads` | **48 лидов, источник = сайты застройщиков** (strana-siti.ru, soul-forma.ru, gertzena-city.ru) |

### Ключевые находки

1. **Двойная система проверок: Scoring ≠ Service.** В БД `scorings`-таблица (3 записи, цены 2500/5000/8000) и `services`-таблица (6-7 проверок с другими ценами). Tech-debt подтверждён живьём.

2. **AI-модель — `o4-mini-2025-04-16`** (OpenAI reasoning), **не gpt-4o-mini** как в нашей доке. Нужна правка в `internal/02-modules/realty-prompts.md` и `internal/05-integrations/openai.md`.

3. **Источники лидов включают сайты застройщиков** — `strana-siti.ru`, `soul-forma.ru`, `gertzena-city.ru`. В нашем `external/05-leads.md` упомянуты только avito/cian/jivo/direct/referral. Нужна правка.

4. **Только 1 админ на prod** — Орлова И. М. Роль «Супер администратор», подразделение «Отдел продаж». Обычных админов в системе нет. Документация про 2-уровневую иерархию — концептуальная.

5. **Формат промо на объектах** — `x<multiplier>_<days>` (x10_7 = x10 просмотров на 7 дней). Не описано в нашей доке про publishings.

6. **111 заявок на услуги без назначенного исполнителя** — либо это тест-среда, либо реальная операционная проблема на prod. Нужно уточнить у команды.

7. **7 312 звонков в истории** — это основной КПЭ трафика лидов через классифайды. Реальный prod-объём.

### Что надо обновить после этой волны

**`internal/`:**
- `02-modules/realty-prompts.md`: модель `o4-mini-2025-04-16`, уровень мышления Глубоко.
- `02-modules/scoring.md` + `02-modules/services.md`: явно отметить tech-debt про двойную систему.
- `05-integrations/openai.md`: актуальная модель.
- `06-admin.md`: реальный URL `/console/administrators`, фактическое число админов.
- `14-tech-debt.md`: 2 новых пункта (двойные проверки, AI-модель устаревшая в доке).

**`external/`:**
- `05-leads.md`: добавить «лиды от застройщиков» как источник, убрать устаревшие enum-значения.
- `17-contacts.md`: уточнить, что «Юля / Света / Маша / Даниил / Никита» — это концептуальные роли, не отдельные аккаунты админки.
- `15-known-issues.md`: добавить наблюдение про 111 открытых заявок без исполнителей (если это реально проблема).

### Волна 6 закрыта полностью

За 6 сессий (6a → 6f) пройдено:
- **Лендинг** (1 страница, 13 блоков).
- **ЛК** (7 авторизованных + 4 публичных экрана).
- **Админка** (16 разделов + 3 вкладки).

Всего найдено расхождений с документацией: **~35 критичных**.

---

## 2026-04-23 (сессия 14) — Варианты A+B: правки internal + сводный отчёт для продукта

### Новый источник правды

Получил от Игоря `Подписки RSpace.xlsx` — актуальная финансовая модель и наполнение подписок на 23.04.2026. Сохранил:
- `_sources/01b-tariffs-actual-2026-04-23.xlsx` — оригинал
- `_sources/01b-tariffs-actual.md` — markdown-версия ключевых таблиц + анализ

Обновил `README.md`: новый файл теперь помечен как **актуальный** источник по тарифам, старые `_sources/01-tariffs-tz.md` и `01a-tariffs-quickref.md` **помечены как устаревшие**.

### Ключевые факты из xlsx (ранее неизвестные)

- **5 тарифов, не 4:** Trial / Профи / Премиум / Ультима / **Энтерпрайс** (20 000 ₽, 15 объектов, −30%). Enterprise **отсутствует в prod-БД**.
- **Service Fee** (30/25/19/15%) — новая концепция, разные комиссии на транзакции по тарифу. В админке отдельной настройки не видно — либо реализовано в коде, либо только финансовая модель.
- **Цены подписок одинаковые для Столиц и Регионов** по xlsx (5000/9000/17000) — в БД сейчас разные (4000/7000/13000 для регионов).
- **AI-юрист однозначно только с Премиума.** В Trial и Профи — НЕТ. Это разрешает путаницу UI.
- **Лимит «Подготовка ДКП» в тарифе — 1/2/3 штук**, а не «Проверка объекта» как в старом ТЗ.
- **Срочные версии всех услуг** существуют (×2 цена) — их в prod-БД нет как отдельных записей.
- **ДомКлик интегрирован на уровне фин-модели** (себестоимость 45 ₽/размещение), но в коде нет.
- **Столичный Enterprise убыточен** (−2 081 ₽ валовой маржи при текущих лимитах).

### Вариант B: сводный отчёт для продукта

Создан `_verification/DISCREPANCY-REPORT-2026-04-23.md` — единый документ с 8 блоками:
1. Тарифная сетка (5 vs 13 в БД, единые vs регионные цены подписок, Service Fee).
2. Услуги (ценовой рассинхрон, какие добавить/убрать, AI-юрист, двойная система проверок).
3. Оплата и триал (с баллов, карта при триале).
4. Модель дохода (кэшбек 1,5%, пассивный доход 10k/15k).
5. Площадки (ДомКлик, Яндекс.Недвижимость).
6. Операционные проблемы (111 заявок без исполнителя, 1 админ, промо SUPERSTAR 23/50).
7. Баги на лендинге (5 штук).
8. Баги в ЛК (5 штук).

**~30 продуктовых решений требуется** перед финализацией external-доки.

### Вариант A: правки internal/* по подтверждённым фактам

**`internal/05-integrations/openai.md`:**
- Модели в использовании: `o4-mini-2025-04-16` (reasoning) с reasoning_effort = High / «Глубоко».
- Удалены TBD про gpt-4o-mini / o1.

**`internal/02-modules/realty-prompts.md`:**
- Единственный активный промпт: «Генерация описания объекта v1» (id=1).
- ReasoningEffort = «Глубоко».
- Стоимость генерации выше заявленной — требует повторного замера.

**`internal/06-admin.md`:**
- Переписан блок «Список экранов» — теперь с фактическими URL'ами (подтверждены живьём).
- URL админов: `/console/administrators` (не `/console/admins` как раньше в доке).
- Отдельно отмечено: **на проде 1 админ** (Орлова И. М.).
- Отсутствующие разделы: нет UI для внешних балансов (`/console/monitoring`), нет `/console/invoices`, нет дашборда.

**`internal/02-modules/scoring.md`:**
- Добавлен блок «Tech-debt: параллельная таблица services с теми же проверками» с конкретными id и ценами.

**`internal/02-modules/services.md`:**
- Ссылка на TD-V10 (двойная система проверок) с рассылкой в tech-debt.

**`internal/02-modules/leads.md`:**
- Добавлен источник «Сайты застройщиков» (подтверждено 48/48 лидов с доменов `strana-siti.ru`, `soul-forma.ru`, `gertzena-city.ru`).

**`internal/14-tech-debt.md`:**
- Добавлены **10 новых пунктов TD-V10…V19:**
  - V10: Двойная система Scoring/Service (P1)
  - V11: Цены услуг в БД ≠ ТЗ (−43% на юристе) (P0)
  - V12: AI-юрист UI-баг на Профи (P1)
  - V13: Enterprise-тариф отсутствует в БД (P2)
  - V14: Модель AI в доке устарела (P3)
  - V15: 111 заявок без исполнителя (P0 / P3)
  - V16: Подписка вне регионализации (xlsx vs БД) (P1)
  - V17: ДомКлик интеграция есть в финмодели, нет в коде (P2)
  - V18: Яндекс.Недвижимость-иконка без интеграции (P2)
  - V19: На проде один админ (P3)

### Что не менял

- **`external/*`** — не трогал. Это ждёт продуктовых решений по DISCREPANCY-REPORT.
- **`_sources/01-tariffs-tz.md` и `01a-tariffs-quickref.md`** — не удалял и не переписывал. Они остаются как архив старого ТЗ, просто в README помечены как устаревшие.

### Волна 6 завершена на 100%

После этой сессии:
- Прошли 6 волн (базовая верификация + 6a-6f UI).
- Получили финальный источник правды (xlsx).
- Оформили два результата: правки internal + сводный отчёт для продукта.
- Все блокеры перехода в Notion сведены в один документ (DISCREPANCY-REPORT).

---

## 2026-04-23 (сессия 15) — Игорь уточнил статус ДомКлик и Яндекс.Недвижимости

### Статус, подтверждённый Игорем

Обе площадки (ДомКлик, Яндекс.Недвижимость) **готовы технически** — партнёрства заключены, инфраструктура интеграций работает. **Но в ЛК `lk.rspace.pro` подключение к списку площадок пока не сделано** — появится в ближайшем обновлении.

Это значит, что правдивая формулировка для клиента: «сейчас через RSpace публикуем на Авито и ЦИАН; ДомКлик и Яндекс.Недвижимость подключим в ближайшем обновлении».

### Правки в external/*

Все упоминания «публикуем на 3 площадках» и «ДомКлик через feed» приведены к новому статусу в 5 файлах:

- **`external/00-about.md`** — 5 правок:
  - «Публикация объектов на трёх площадках» → «сейчас Авито+ЦИАН; ДомКлик и Яндекс.Недвижимость в ближайшем обновлении».
  - Обновлён раздел «Технически» (`Классифайды: ...`).
  - Убран устаревший пункт про «полную интеграцию с ДомКлик API в процессе».
  - Поправлен поток публикации («объект уйдёт на Авито и ЦИАН»).
  - Поправлен сегмент аудитории.
- **`external/04-publishing.md`** — полностью переработаны разделы о ДомКлик и Яндексе:
  - В шапке: «сейчас 2 площадки, 4 после релиза».
  - Старые блоки «ДомКлик через feed» / «ДомКлик промо» заменены на «В ближайшем обновлении».
  - Блок «Публикация от персонального аккаунта» — добавлено, что привязка ДомКлик/Яндекс появится с релизом.
  - Известные ограничения переписаны.
- **`external/01-tariffs.md`** — 1 правка (убрано «три площадки» в описании Профи).
- **`external/02-start.md`** — 4 правки (форма публикации, список «что на пробнике», вопросы FAQ).
- **`external/03-listings.md`** — 3 правки (редактирование опубликованного, FAQ, что дальше).
- **`external/13-faq.md`** — 4 правки (главный ответ «что это», «какие площадки», сроки публикации, запись звонков).

### Обновления `internal/14-tech-debt.md`

**TD-V17** переписан: теперь отражает правильный статус (готовы технически, не подключены к ЛК) + чёткий план действий:
1. Портировать клиенты/feed в основной бэкенд (если они сейчас в отдельном репо).
2. Добавить в UI публикации объекта.
3. Настроить отображение статусов/звонков/лидов для обеих площадок.

Бывший отдельный пункт **TD-V18 про иконку Яндекса на лендинге без интеграции** консолидирован в TD-V17 (иконка теперь — корректный анонс, а не баг).

### `DISCREPANCY-REPORT-2026-04-23.md` — вопросы 5.1 и 5.2 помечены ✅ разрешено

Из 30+ продуктовых вопросов в отчёте теперь **два закрыты**. Остальные ждут решений команды (цены, AI-юрист, лимиты, Enterprise, SUPERSTAR, 111 заявок без исполнителя и т.д.).

---

## 2026-04-23 (сессия 16) — Приведение external/* в соответствие xlsx Игоря

На основе авторитетного `_sources/01b-tariffs-actual-2026-04-23.xlsx` переписано наполнение тарифов во всей внешней документации. Цены подписок теперь соответствуют xlsx + БД (6 файлов обновлено).

### Главный файл: `external/01-tariffs.md`

**Полностью переписан.** Теперь содержит:

- **5 тарифов** (добавлен **Энтерпрайс: 20 000 ₽/мес**, 15 объектов, −30% на услуги, AI-юрист, 3 бесплатных ДКП).
- **Service Fee** (30/25/19/15% по тарифам) — добавлен как отдельная колонка и объяснение, почему он снижается с повышением тарифа.
- **Корректная таблица «Что входит в подписку»** по xlsx:
  - Лимит «Подготовка ДКП» 1/2/3/3 — добавлен как бесплатное наполнение.
  - Убрана строка «Проверка объекта» из лимитов тарифа (в xlsx её там нет — только со скидкой по тарифу).
  - AI-юрист — только с Премиума (было правильно, теперь и Энтерпрайс добавлен).
- **Полный прайс услуг** — две таблицы (Москва + Регионы) со всеми 17 услугами и их срочными версиями (×2 цена), с цветом «выделение» для Ультима-колонки. Раньше прайс был обрезанный.
- **Новый раздел «Продвижение на Авито и ЦИАН»** с формулой скидки по тарифу.
- **Обновлённый пример расчёта экономии** с учётом кэшбека от банков.
- **Обновлённый блок «Пробный период»** — карта привязывается при триале, после можно отвязать, подписка продолжает списываться с баллов.
- **Обновлённый блок «Как оформить подписку»** — автосписание с внутреннего баланса (баллов), а не с карты.
- **Новые вопросы в FAQ:** «Чем Ультима отличается от Энтерпрайса?», «Что такое Service Fee?».
- **Упоминание SUPERSTAR** — действующий промокод −30% на подписку.

### Связанные правки в `external/`

- **`external/00-about.md`**: таблица тарифов в блоке «Тарифы — коротко» расширена Энтерпрайсом (15 объектов, 20 000 ₽/мес). Сноска про AI-юриста обновлена — «начиная с Премиума», не «только Премиум и Ультима». Известные ограничения переписаны.
- **`external/02-start.md`**: в «Что активно на пробном периоде» убрана устаревшая строка про «1 проверку объекта», заменена на «1 бесплатная подготовка ДКП» — по xlsx именно так.
- **`external/07-legal.md`**: таблица цен услуг переработана: Ультима и Энтерпрайс объединены в одну колонку (одна и та же скидка −30%). Услуги «Проверка объекта/собственника (Scoring)» переименованы в обычные, т.к. они из базового списка услуг. Добавлена пометка «ДКП в подписке — 1/2/3/3 бесплатно + сверху по цене». Уточнение про AI-юриста: «начиная с Премиума».
- **`external/10-analytics.md`**: пример расчёта экономии переписан корректно (Ультима = −30% от базы), добавлено упоминание кэшбека.
- **`external/13-faq.md`**: в разделе «Тарифы» добавлена строка про Энтерпрайс 20 000 ₽. Обновлён ответ про триал (карта привязывается, отвязать можно). Ответ про AI-юрист теперь говорит «начиная с Премиума». Вопрос «Когда появится Энтерпрайс?» заменён на «Что даёт Энтерпрайс?» — он уже есть в модели.

### Сохранённый tech-debt

Остались расхождения, которые я **не правил в external** (они — реальность в БД, но не xlsx):
- Цены **услуг** в prod-БД на 43% ниже, чем в xlsx. external теперь показывает xlsx-цены (которые совпадают с лендингом). Клиент, зайдя в ЛК, может увидеть ниже. Это tech-debt TD-V11 — требует миграции цен в БД.
- Энтерпрайса физически **нет в `plans`-таблице** БД. В external он описан как доступный. Это tech-debt TD-V13 — нужна запись в БД.

Оба пункта остаются в `internal/14-tech-debt.md` на решение команды разработки.

### Что ещё не сделано

- `external/09-balance.md` (Баланс и выплаты) — требует отдельной ревизии по теме «баллы vs рубли».
- `external/05-leads.md` — уже поправил раньше, но теперь, зная про застройщиков, можно сделать более подробный раздел.
- Перенос в Notion (волна 11) — технически разблокирован по тарифам, но лучше дождаться решений команды по оставшимся продуктовым вопросам (AI-юрист на Профи, Service Fee в коде, 111 заявок без исполнителя).

---

## 2026-04-23 (сессия 17) — Переписка external/09-balance.md + унификация терминологии «баллы vs рубли»

### `external/09-balance.md` — полностью переписан

Раньше файл говорил:
- «Внутренний баланс» / «Комиссионный баланс» (внутренние коднеймы).
- «Подписка списывается с карты».
- «Оплата подписки с внутреннего баланса невозможна, в планах».

Всё это **неверно**. Прод-реальность:
- Термины в UI: **«Баллы»** (внутренний баланс) и **«Рубли»** (рублёвый счёт / баланс вывода).
- **Подписка списывается с баллов, а не с карты.** Карта — только для пополнения баллов.
- Баллы **не конвертируются в рубли** (в одну сторону работает обратное: рубли → баллы).

Новый файл полностью отражает prod-модель:
- Вступление с таблицей «Два кошелька» с чёткой разницей.
- Раздел «Баллы» — как пополнить, что можно оплатить, почему нельзя вывести.
- Раздел «Рубли» — источники (комиссии банков, страховые, аккредитивы, клубные сделки), как вывести (3-5 рабочих дней), статусы заявки.
- Раздел «Платёжные методы» — объяснение, что карта привязывается при триале, может быть отвязана после, используется только для пополнения баллов (не для подписки напрямую).
- FAQ переработан: новые вопросы «В чём разница между баллами и рублями?», «Можно ли перевести баллы в рубли?», «Баллы закончились — что будет?».
- Примеры транзакций и история операций — соответствуют тому, что видит админ в `/console/balance-transactions`.

### Унификация терминологии в остальных файлах

Заменил устаревшие термины в 4 файлах:

- **`external/00-about.md`**: «на карту, счёт или внутренний баланс» → «на банковский счёт или конвертируются в баллы».
- **`external/06-mortgage.md`**: 3 упоминания «компенсационный баланс» → **«рублёвый счёт (баланс вывода)»**. «Внутренний баланс RSpace» в списке получателей → «баллы (внутренний баланс RSpace 1:1)».
- **`external/08-insurance.md`**: 3 упоминания «компенсационный баланс» → **«рублёвый счёт (баланс вывода)»**.
- **`external/13-faq.md`**: переработаны 4 ответа — про оплату подписки, про комиссию банка, про два баланса, про вывод. Теперь используют термины «баллы» и «рубли», соответствующие UI.

### Критический факт зафиксирован

«Подписка оплачивается баллами, не картой» теперь **единообразно** описан во всех внешних файлах: `01-tariffs.md`, `02-start.md`, `09-balance.md`, `13-faq.md`. Это была главная точка несоответствия с продом в external — закрыто.

### Что ещё осталось в external

- `05-leads.md` — можно добавить детали про источники от застройщиков (Yandex Disk / Google Spreadsheets) и 48 реальных лидов в админке. Сейчас источники описаны корректно, но без операционных деталей.
- Карточки услуг в `07-legal.md` — раздел про конкретные рабочие процессы можно расширить (как админ обрабатывает заявку, сколько ждать после оплаты и т.д.), опираясь на `/console/service-orders` из админки.

### Готовность к переносу в Notion

После сессий 16-17 внешняя документация **синхронизирована** с prod-моделью в ключевых местах: тарифы, услуги, способ оплаты, баланс, юридические документы, контакты. Осталось только 2-3 «прикосновения» для полировки (см. выше).

---

## 2026-04-23 (сессия 18) — external/05-leads.md: источники от застройщиков

### Правки

**Таблица «Откуда приходят лиды» переработана:**
- Добавлена строка **«Лиды от застройщиков»** как реальный источник (48 лидов на проде, 100% от доменов ЖК).
- Поток импорта описан: застройщик выгружает таблицу в Yandex.Диск / Google Spreadsheets, мы импортируем по расписанию.
- **ДомКлик и Яндекс** — статус синхронизирован с остальной докой: «пока не подключены к ЛК».

**Добавлен новый раздел «Лиды от застройщиков (новостройки)»:**
- Как это работает (промо-страницы ЖК → импорт).
- Что видно в кабинете (реальные примеры доменов: `strana-siti.ru`, `soul-forma.ru`, `gertzena-city.ru`).
- Workflow агента: перезвонить → бронь → сделка → комиссия на рублёвый счёт.
- Как подключиться к программе.

**Пример в таблице «Раздел «Лиды»» обновлён** — добавлена строка от `strana-siti.ru` / ЖК «Страна сити» как real-world пример.

**Известные ограничения** переформулированы — старая фраза «ДомКлик лиды в RSpace не попадают автоматически, приходят прямо на телефон» заменена на актуальную «ДомКлик и Яндекс.Недвижимость пока не подключены к кабинету».

---

<!-- следующие сессии добавляют записи сверху, новые даты сверху -->

## 2026-04-23 · Wave 7: screenshots

### Added

- **10 скриншотов лендинга** в `assets/screenshots/landing/`:
  - `landing-hero-desktop.png` (438KB), `landing-about-section.png` (485KB),
    `landing-earning-cards.png` (337KB), `landing-features-grid.png` (337KB),
    `landing-pricing-moscow.png` (147KB), `landing-pricing-regions.png` (145KB),
    `landing-rspace-pro.png` (146KB), `landing-testimonials.png` (662KB),
    `landing-faq.png` (662KB), `landing-footer.png` (138KB).
- **`_scripts/landing-screens.mjs`** — playwright-автомат: 10 снимков лендинга
  с правильным переключением таба МОСКВА ↔ ДРУГОЙ РЕГИОН.
- **`_scripts/screens-auth.mjs`** — полу-автомат для ЛК и админки:
  один раз руками логинишься, дальше скрипт обходит 8 экранов ЛК
  и 14 экранов админки.
- **`_scripts/compress-screens.py`** — оптимизатор через Pillow:
  ресайз до 1200-1440px + optimize=True.
- **`_scripts/README.md`** — инструкция.
- **`.gitignore`** — `_scripts/.auth-state.json`, `node_modules/`.

### Changed

- `external/00-about.md` — вставлен `landing-hero-desktop.png`.
- `external/01-tariffs.md` — вставлены `landing-pricing-{moscow,regions}.png`.
- `external/17-contacts.md` — вставлен `landing-footer.png`.
- `assets/SCREENSHOTS-PLAN.md` — обновлён статус (что сделано / что требует
  одноразового логина), добавлен раздел «Как обновлять скриншоты».

### Ограничения обнаруженные по ходу

- **html2canvas / modern-screenshot** на React Router 7 SPA (lk.rspace.pro)
  либо висит, либо тормозит до 25 секунд на один кадр.
- **Chrome блокирует множественные автодаунлоуды** после первого файла без
  явного "Allow" от пользователя в UI браузера — делает fully-autonomous
  скриншоты через `a.download` невозможными из Chrome extension.
- **gif_creator MCP** требует tab group которая не инициализируется
  в текущем Cowork-сеансе (ошибка "Tab is not in the MCP tab group").

Обходной путь выбран: `_scripts/screens-auth.mjs` с playwright на Mac
пользователя + один ручной логин на первом запуске. Дальше — полностью
автоматически.

## 2026-04-23 · Wave 8: product decisions applied

### Critical conceptual fix: «нет кэшбека» = агентская комиссия

После уточнения от Игоря: у RSpace нет «кэшбека». То, что лендинг называл
«кэшбек 1.5% от банка с ипотеки» — это **агентская комиссия РИЕЛТОРУ** за
привлечение заёмщика к партнёрскому банку. Аналогично для страховых сделок.

### Removed

- **Термин «кэшбек»** во всех external-файлах (кроме одного disclaimer в
  `external/06-mortgage.md`, где явно подчёркивается что это НЕ кэшбек):
  - `external/06-mortgage.md` — «Кэшбек»/«кэшбек» → «агентская комиссия»
  - `external/01-tariffs.md` — 3 упоминания
  - `external/10-analytics.md`
  - `external/11-notifications.md` — «Кэшбек начислен» → «Агентская комиссия начислена»
  - `external/16-legal.md` — «выплаты/кэшбеки» → «агентские комиссии и вознаграждения»
  - `external/02-start.md` — «заработали кэшбек с банков» → «конвертировали рубли, заработанные как агентская комиссия»
  - `external/README.md` — «расчёт кэшбека» → «агентская комиссия риелтору»

- **Service Fee как концепция в публичной документации** (до уточнения
  формулы с командой разраба):
  - `external/01-tariffs.md` — удалён столбец «Service Fee» из таблицы тарифов
  - `external/01-tariffs.md` — удалён раздел «Что такое Service Fee»
  - `external/09-balance.md` — удалено «платформа берёт Service Fee с каждой транзакции»
  - `external/00-about.md`, `external/13-faq.md` — переформулировано

### Added

- `_sources/check-types-breakdown.md` — детальный состав трёх пакетов проверок
  (Проверка объекта = 3 пункта, Проверка собственника = 8 пунктов, Комплексная = 11).
  Источник — фото от Игоря (2026-04-23).
- `_verification/BUGS-PENDING-2026-04-23.md` — сводный файл всех обнаруженных
  багов (4 на лендинге, 5 в ЛК, 1 операционный в админке), **не правятся из
  документации**, передаются разработке.
- `_verification/DISCREPANCY-DECISIONS-2026-04-23.md` — чек-лист решений
  с применёнными ответами Игоря и 4 вопросами, которые требуют команды
  (Service Fee формула, задаток/аванс, scorings vs services, числа страховки).

### Changed

- `external/07-legal.md` — полная переделка разделов «Проверка объекта» и
  «Проверка собственника» под реальный состав пакетов (не «банкротство,
  суды, приставы» как было раньше, а точный breakdown 3 + 8 + 11 пунктов).
  Добавлен новый раздел «Комплексная проверка».
- `external/01-tariffs.md` — заменён раздел «Что такое Service Fee» на
  «Как риелтор зарабатывает на платформе». FAQ «Что такое Service Fee»
  переписан в «Что такое агентская комиссия».
- `external/06-mortgage.md` — добавлен disclaimer «Это не кэшбек клиенту
  и не скидка — это ваш агентский процент за привлечение заёмщика».

### Task #22 outcomes

Применены все ✅-решения из DISCREPANCY-DECISIONS-2026-04-23.md:
1.1, 1.2 (флаг для команды), 1.3 (переосмыслено), 2.1 (для БД), 2.3, 3.1,
4.1 (нет кэшбека — применено), 6.2, 6.3, 7.1-7.5 (в BUGS-PENDING).

Вопросы для команды (🧑‍🤝‍🧑):
- 1.3 Service Fee: по какой базе считается (30/25/19/15%)?
- 2.2 Проверка задатка / аванса: существуют ли как услуги?
- 2.4 scorings vs services в БД — какую удалить?
- 4.2 Страховка 10K/15K — точные числа или «до»?
- 6.1 111 заявок без назначения — prod?

Всё это сформулировано как одно сообщение к команде в
DISCREPANCY-DECISIONS-2026-04-23.md → «Вопросы команде RSpace».

## 2026-04-23 · Wave 9: finalize pass + LK/admin screenshots captured

### Proofreading pass (subagent + grep sweep)

- Нашёл и поправил единственную реальную несогласованность:
  `external/02-start.md` — «AI-юрист Грут (только Премиум и Ультима)» →
  «(доступен начиная с Премиума — Премиум / Ультима / Энтерпрайс)».
- Все ссылки между external/*.md работают (comm-проверка).
- Остаточных «кэшбек», «Service Fee», «старый стиль описания проверок» — нет.

### Screenshots captured (19 PNG auto)

- **LK authenticated (6):** `lk-dashboard.png`, `lk-objects-list.png`,
  `lk-services-shelf.png`, `lk-subscription.png`, `lk-withdrawal.png`, `lk-profile.png`.
  Размеры 77-219 KB. Аккаунт — Профи (Регионы, Краснодар).
- **Admin (13):** список пользователей, карточка юзера, тарифы, настройки уровней,
  услуги, скоринги, заявки на услуги, лиды, промокоды, AI-промпты,
  администраторы, история платежей, заявки на вывод, звонки.
  Размеры 63-132 KB.

**Что пропущено автоматом** (нужно руками или отдельной итерацией):
- `lk-object-edit.png` — не нашёлся объект с `/edit` href
- `lk-dashboard-wallet.png` — зум-шот (не автоматизирован)
- `lk-login.png`, `lk-registration.png`, `lk-password-requirements.png`,
  `lk-reset.png` — публичные страницы, нужны в отдельной incognito-сессии

### Added to _scripts

- `_scripts/screens-auth.mjs` — playwright скрипт с авто-логином
  (отдельные контексты для LK и admin, разные креды).
- `_scripts/run-screenshots.command` — double-click launcher для Mac,
  запускает node + сжатие одной командой.
- `_scripts/.auth-creds.json` — креды от Игоря (gitignored).

### Image refs вставлены в markdown

- `external/02-start.md` — `lk-dashboard` после описания триала.
- `external/03-listings.md` — `lk-objects-list` перед разделом «Редактирование».
- `external/09-balance.md` — `lk-withdrawal` после объяснения «баллы vs рубли».
- `external/12-settings.md` — `lk-profile` в начале раздела.
- `external/15-known-issues.md` — `lk-services-shelf` (доказательство BUG-LK-001).
- `internal/06-admin.md` — 14 admin-скринов с описаниями в секции UI-walkthrough
  (заменил placeholder «требует скриншоты»).

### Data updates

- `external/13-faq.md` — 247 → **437** зарегистрированных пользователей
  (увидели в админке / list = Всего: 437, стр. 22 по 20). Дата обновлена
  с февраля на 23 апреля 2026.

## 2026-04-23 · Wave 10: 6 доп.скринов + wallet zoom

### Added screenshots (6)

- `lk-object-edit.png` (84 KB) — Редактирование объекта #977 (Оренбургская обл).
  Accordion 6 секций (Расположение / О доме / О квартире / Описание / Цена /
  Как выглядит), CTA «ОПУБЛИКОВАТЬ ОБЪЯВЛЕНИЕ», sidebar «Ускорьте продажу»
  с опциями 2D-планировка 400 ₽ и Продвижение.
- `lk-dashboard-wallet.png` (29 KB) — zoom-кроп из lk-dashboard.png на блок
  Кошелёк: «99 516 баллов / 89 000 рублей», кнопки «Пополнить баланс / Купить услуги /
  Мои карты» и объяснение «Баллы — твой инструмент роста».
- `lk-login.png` (29 KB) — Публичная форма входа в ЛК.
- `lk-registration.png` (60 KB) — Публичная форма регистрации (4 поля +
  блок требований к паролю + чекбокс согласия с офертой).
- `lk-password-requirements.png` (62 KB) — Та же страница регистрации,
  скроллена вниз для акцента на блоке требований.
- `lk-reset.png` (52 KB) — Публичная форма восстановления пароля
  (телефон + новый пароль + подтверждение + требования).

### New script

- `_scripts/screens-extra.mjs` — playwright-скрипт для «dessert»-скринов.
  Отдельный auth-контекст для LK-авторизованных (object-edit, wallet-zoom) +
  incognito-контекст для 4 публичных (login, registration, password-requirements, reset).
- `_scripts/run-extra.command` — launcher, обёртка как в run-screenshots.command.

### Image refs вставлены

- `external/02-start.md` — `lk-login` (перед «Шаг 1. Регистрация»),
  `lk-registration` (после шага 3), `lk-dashboard-wallet` (под описанием дашборда),
  `lk-reset` (в новой подсекции «Забыли пароль»).
- `external/03-listings.md` — `lk-object-edit` (в разделе «Редактирование опубликованного»).

### Notes

- wallet zoom автоматически не получился (селектор text=Кошелёк не смог
  найти карточку). Сделан ручным кропом через Pillow из `lk-dashboard.png`
  (800×340 px, покрывает блок Кошелёк полностью).
- `lk-password-requirements.png` и `lk-registration.png` почти идентичны
  (регистрация короткая, требования видны сразу). Оставил оба как
  планировалось в SCREENSHOTS-PLAN.md — можно использовать любой из них
  для акцента на блоке требований.

## 2026-04-23 · Wave 11: GitBook публикация

### Published documentation site

**URL: https://rspace.gitbook.io/rspace-docs/**

- **External space** "Документация для риелторов" → `./external` → default space
- **Internal space** "Техническая документация (для команды)" → `./internal`
- Оба засинхронизированы с GitHub через Git Sync (bidirectional)

### Infrastructure

- **Git-repo created:** https://github.com/igoradam-hub/rspace-docs (public)
- **Git init + commit** добавлены в `/rspace-docs/` (187 файлов, 5.18 MB)
- **GitBook Cloud:** organization Rspace (`AXievlr1dm3uTPaIaeap`), site_25wGw Ultimate plan
- **GitBook App** авторизован для igoradam-hub/rspace-docs через installationId `ac83120ffd290c2b960c9e45951bf3cc1e93a123ab938343db68b2a623f7fb44`
- **site-spaces:** sitesp_ljtDr (external, default) + sitesp_mYJ1l (internal)

### Flow: как обновлять документацию

1. Правка `external/*.md` или `internal/*.md` локально
2. `git add -A && git commit -m "..." && git push origin main`
3. GitBook автосинхронизируется (обычно в течение минуты)

**Или двусторонне:** редактирование в GitBook UI → автоcommit в GitHub → синк обратно.

### Scripts added

- `_scripts/deploy-to-github.command` — автопуш на GitHub через gh CLI
  (инициализирует git, коммитит изменения, создаёт/обновляет remote)

### Новая точка входа

**Для пользователей:** https://rspace.gitbook.io/rspace-docs/
**Для команды (internal):** тот же URL, переключить space в sidebar dropdown

### .gitignore

- `_scripts/.auth-state.json` (playwright session)
- `_scripts/.auth-creds.json` (LK + Admin credentials — КРИТИЧНО)
- `node_modules/`

## 2026-04-23 · Wave 12: зачистка user-facing документации

После ревью опубликованного сайта убрано всё что не должно быть в пользовательской доке.

### Structural

- **Перенесён** `external/15-known-issues.md` → `internal/15-known-issues-external-archive.md`
  (bugs и статусы фиксов не нужны риелтору; сохранили в internal для истории).
- **README.md, 14-troubleshooting.md** — убраны ссылки на 15-known-issues.

### 17-contacts.md — полностью переписан

- **Правильный телефон:** `+7 (929) 047-24-77` (было `+7 (930) 666-25-95`).
- **Правильный Telegram:** `@Mikhail_Rspace` (был `@Maria_RSpace`).
- **Заменён WhatsApp на Max:** `+7 (930) 064-11-05`.
- **Убраны имена:** «Биллинг (Света)», «Ипотечный брокер (Юля)» → просто
  «Биллинг» / «Ипотечный брокер». Убраны упоминания CEO, CPO, девелоперов.
- **Юр.отдел:** добавлен «или вашего менеджера».
- **Удалён раздел «Социальные сети»** (пустой плейсхолдер).
- **Удалён раздел «Команда RSpace (для внутреннего использования)»** —
  имена, роли, email-адреса команды не должны быть в публичной доке.
- **Удалён раздел** «Email-адреса `press@`, `invest@`, `partners@`, `club@`
  не подтверждены…» из «Известных ограничений».
- **Удалено** упоминание Notion-URL в «Где ещё можно узнать».

### 00-about.md

- **Удалена метастрока** «Для кого / Сложность / Последнее обновление».
- **«на трёх площадках» → «на двух площадках»** (Авито+ЦИАН в ЛК).
- **Удалён пункт** «Сотрудник RSpace — эта документация поможет…».
- **Удалён пункт** «RSpace не подходит агентствам с 50+ людьми».
- **Удалено уточнение** «ДомКлик и Яндекс.Недвижимость готовы технически…»
  из раздела «Ядро — мультилистинг и кабинет».
- **Удалён bullet** «CRM: входящие лиды уходят в AmoCRM».
- **«Тарифы — коротко» → «Тарифы».**

### 01-tariffs.md

- **Удалена метастрока** «Для кого / Сложность / Последнее обновление».

### 03-listings.md

- **Удалён bullet** «3D-планировки через AI — есть как отдельная услуга»
  из «Известных ограничений».

### 05-leads.md

- **Удалены строки таблицы** «ДомКлик / Яндекс.Недвижимость» и
  «Форма на public-offer».
- **Удалён целиком раздел «AmoCRM»** (настройки интеграции — техническая
  деталь, не для риелтора).

### Итог

Push `358a3aa..ab0eea6 main -> main` → `ab0eea6..8b8994c main -> main`,
9 файлов, 25 вставок, 89 удалений. GitBook синхронизировался за ~40 секунд.

## 2026-04-24 · Wave 13-14: knowledge base + скриншоты по всем разделам

### Волна 13 — knowledge/ для будущих AI-сессий

- **Создан `CLAUDE.md`** в корне — главная инструкция для любого Claude (или другого AI/девелопера), работающего с проектом. Структура, критичные правила (нет имён, метастрок, «на двух площадках», «агентская комиссия» не «кэшбек»), источники правды, workflow публикации.
- **Создана папка `knowledge/`** с 4 справочниками:
  - `voice.md` — стилистика (тон, эмодзи, имена, форматы чисел, checklist перед commit)
  - `terms.md` — глоссарий (баллы/рубли, агентская комиссия, Service Fee, AI-юрист Грут, проверки) + таблица «запрещённое → правильное»
  - `data-points.md` — все актуальные цифры (тарифы, цены услуг, лимиты, Service Fee %, контакты, prod-цифры 437 юзеров)
  - `workflow.md` — как пушить, как синкать GitBook, как снимать скрины, как чинить если не работает, куда смотреть при проблемах
- `knowledge/README.md` — оглавление с порядком чтения в новой сессии.

### Волна 14 — скриншоты по всем разделам

**Было:** 14 скринов в 8 файлах.
**Стало:** 30 скринов, все 17 external-файлов покрыты.

**Вставки:**
- `00-about.md` — landing-earning-cards, landing-features-grid, landing-rspace-pro, landing-testimonials (+ hero был)
- `04-publishing.md` — lk-object-edit (кнопка «Опубликовать»)
- `05-leads.md` — lk-dashboard (как выглядит интерфейс с лидами)
- `06-mortgage.md` — landing-earning-cards, lk-services-shelf
- `07-legal.md` — lk-services-shelf, landing-features-grid
- `08-insurance.md` — landing-earning-cards (блок про страхование)
- `10-analytics.md` — lk-dashboard, lk-dashboard-wallet
- `11-notifications.md` — lk-profile (Telegram binding)
- `13-faq.md` — landing-faq
- `14-troubleshooting.md` — lk-login (для раздела «Проблемы с входом»)
- `16-legal.md` — landing-footer (юр.ссылки)

Плюс линтер убрал метастроки «Для кого / Сложность / Последнее обновление» во всех 13 файлах где они остались, и исправил падежи в «агентской комиссии» (было артефактом замены «кэшбек»).

### Итого

- Push `d5c7e07` (initial) → `358a3aa` → `ab0eea6` → `8b8994c` → `d9df2b8`
- 24 файла в последнем коммите, 842 вставки, 70 удалений
- GitHub: https://github.com/igoradam-hub/rspace-docs
- GitBook live: https://rspace.gitbook.io/rspace-docs/

## 2026-04-24 · Wave 15: разделение публичного сайта и internal

### Problem

Публичный сайт `rspace.gitbook.io/rspace-docs` показывал в sidebar dropdown оба space'а — «Документация для риелторов» **и** «Техническая документация (для команды)». Пользователь мог переключиться и увидеть internal-доку (имена сотрудников, GitLab-ссылки, tech-debt, bus factor, архитектуру).

### Fix

- **Отвязан Internal space** от публичного сайта через `DELETE /v1/orgs/{org}/sites/{site}/site-spaces/{sitespaceId}` (sitesp_mYJ1l). HTTP 205.
- **Результат:** на публичном сайте в sidebar осталась только «Пользовательская документация RSpace», dropdown выбора между spaces исчез.

### Internal — где теперь живёт

- Продолжает существовать как space `2RzLw8hycrC3nCMygSg7` в GitBook organization Rspace.
- Доступен только через `https://app.gitbook.com/o/AXievlr1dm3uTPaIaeap/s/2RzLw8hycrC3nCMygSg7/` — требует логин и членство в workspace.
- GitHub Git Sync остаётся активным — правки в `internal/*.md` через push в GitHub продолжают синкаться.
- Пользователи публичного сайта не имеют ссылки и способа туда попасть.

### CLAUDE.md обновлён

Добавлен явный раздел «⚠️ Публичный сайт vs Internal» — **не вставлять ссылки из external/ на internal/** (нарушит разделение).

### Verification

- Публичный URL `rspace.gitbook.io/rspace-docs/` — в sidebar только один space ✓
- grep external/ на `internal/` ссылки — пусто ✓
- Internal всё ещё редактируется через GitBook UI и git push ✓

## 2026-04-24 · Wave 16: сквозная зачистка user-facing документации

Полный grep-аудит показал что в публичной документации остались:
- ДомКлик / Яндекс.Недвижимость — **36 упоминаний** в 11 файлах
- AmoCRM — **15 упоминаний** в 7 файлах
- Имена (Ринат, Оксана, Елена, Юля, Света, Михаил-как-пример) — **8 упоминаний**
- CusDev — **11 упоминаний** в 9 файлах
- «Bus factor», «из паспорта продукта» — **3 упоминания**
- «На трёх площадках» — 1 упоминание
- Артефакты `**** и ****` после предыдущей зачистки

### Сквозной fix через Python regex

Делал через 30+ regex-паттернов в python-скрипте:
- Удалены все упоминания ДомКлик/Яндекс.Недвижимости во всех контекстах
  (скобки, элементы списков, строки таблиц, ### заголовки секций, в planах).
- AmoCRM удалён полностью: упоминания в таблицах источников лидов,
  секция «AmoCRM интеграция» в 12-settings.md, пункты в списках,
  FAQ-ответы, ссылки в README.
- Имена убраны: «По CusDev (Оксана): …» → обобщённо, «(Ринат, 5 лет): …» → убрано.
- Bus factor и паспорт продукта убраны из публичной документации.
- «На трёх площадках» → «на двух площадках».
- Артефакты `**** и ****` и «После релиза это станет четырьмя…» удалены.
- Пустые вопросы в 13-faq.md заполнены корректными ответами.
- Frankenstein-таблица / rspace-analytics (внутренние метрики команды) убраны.

### Итог

- Push commit `37800a0..4df9059`
- 15 файлов, 105 вставок, **173 удаления**
- Финальный аудит: **0 проблем** по всем 8 категориям (ДомКлик/Яндекс, AmoCRM, имена, CusDev, «на трёх», bus factor, паспорт, Frankenstein)
