# Модуль: Leads

> **Домен:** Leads (входящие лиды с площадок)
> **Репозиторий:** `rspace/project/backend`
> **Путь:** `backend/app/Leads/`
> **Ветка prod:** `dev`
> **Статус:** production

## Назначение

Приём и назначение лидов, приходящих с внешних площадок (Авито, ЦИАН, JivoSite). Лид — это **контакт потенциального клиента**, с которым агент может связаться. В текущей модели лиды живут как отдельная сущность, привязанная к пользователю (`assigned_to_id`), а не к объекту.

## Ключевые сущности

### `Lead`

**Путь:** `app/Leads/Models/Lead.php`

**Поля:**

```
id                  bigint   PK
phone               string   телефон клиента
full_name           string?  ФИО (если известно)
residental_complex  string?  ЖК / название комплекса (для новостроек)
source              string?  откуда пришёл (avito/cian/jivo/direct/...)
status              enum     LeadStatus
assigned_to_id      int?     → users.id (кому назначен)
assigned_at         ts?      когда назначен
created_at          ts       когда получен
updated_at          ts
```

### `LeadStatus` (enum)

- `available` (value: `"available"`) — «Доступен» — лид в общем пуле, не назначен никому
- `assigned` (value: `"applied"`) — «Применён/назначен» — лид закреплён за конкретным агентом

Переход `available → assigned` происходит либо автоматически (по правилам), либо вручную админом.

### `LeadQuery`

Кастомный Eloquent-builder: `app/Leads/Models/LeadQuery.php` — скоупы для фильтрации (available, assignedTo, bySource и т.д.).

### Связи

- `belongsTo` → `User` (`assignedTo`) — агент, которому назначен лид.

## API-эндпоинты

### Публичные (`auth:user`)

Префикс: `/leads`. Controller: `app/Leads/Http/Controllers/LeadController.php`.

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/leads` | Список лидов текущего пользователя (assigned_to = me) |

Параметры запроса (`ListLeadsRequest`):
- `page`, `per_page` — пагинация
- `source` — фильтр по источнику
- `status` — фильтр по статусу (хотя у обычного юзера видны только `assigned`)

**Ответ:**
```json
{
  "data": [
    {
      "id": 42,
      "phone": "+79150001234",
      "full_name": "Михаил П.",
      "residental_complex": null,
      "source": "avito",
      "status": "applied",
      "assigned_at": "2026-04-22T14:30:00Z",
      "created_at": "2026-04-22T14:28:12Z"
    }
  ],
  "meta": { ... }
}
```

Детали payload'а — [../03-api-reference/leads.md](../03-api-reference/leads.md).

### Admin (`auth:admin`, префикс `/admin/leads`)

Controller: `app/Leads/Http/Controllers/AdminLeadController.php`.

- `GET /admin/leads` — все лиды (общий пул + назначенные) — `ListLeadsAdminRequest`
- `POST /admin/leads/bulk-assign` — массовое назначение — `BulkAssignLeadsAdminRequest`
- `POST /admin/leads/sync` — принудительная синхронизация с площадок — `SyncLeadsAdminRequest`

Подробно — [../03-api-reference/admin/leads.md](../03-api-reference/admin/services-scorings.md) (Волна 7).

## Сервисы и бизнес-логика

### `LeadService` (интерфейс) / `DefaultLeadService`

**Путь:** `app/Leads/Services/`.

**Основные методы:**
- `createFromExternal(source, phone, fullName, residentalComplex)` — создание лида из внешних данных (Avito API, CIAN API, Jivo webhook).
- `assign(Lead $lead, User $user)` — назначение лида агенту.
- `bulkAssign(array $leadIds, array $userIds)` — массовое (админский кейс).
- `syncFromSources()` — pull с площадок (триггер — scheduled command).

### `SyncLeadsCommand`

**Путь:** `app/Leads/Console/Commands/SyncLeadsCommand.php` + `app/Leads/Services/SyncLeadsCommand.php`.

Команда артизан `leads:sync` — подтягивает лиды из Avito/CIAN API (звонки, сообщения), конвертирует в `Lead` записи.

Расписание — в `app/Leads/Console/Scheduler.php`.

### Policies

`app/Leads/Policies/LeadPolicy.php` + `LeadPermission.php` — проверки, может ли юзер видеть/работать с конкретным лидом. Обычно: юзер видит только свои (assigned_to_id = me).

## Источники лидов

| Источник (`source`) | Откуда приходит | Как попадает |
|---|---|---|
| `avito` | Звонок или сообщение с Avito-объявления | `SyncLeadsCommand` → Avito API → `LeadService::createFromExternal` |
| `cian` | Звонок или сообщение с ЦИАН | `SyncLeadsCommand` → CIAN API |
| **Яндекс.Диск** | Импорт лидов из внешнего файла на Я.Диске | `SyncLeadsCommand` → `app/Api/Yandex/YandexDiskApiClient.php` забирает файл по `LEADS_YANDEX_DISK_URL` |
| **Google Spreadsheets** | Импорт из гугл-таблицы | `LEADS_GOOGLE_SPREADSHEETS_ID` в `config/leads.php` — ID таблицы, из которой тянутся лиды |
| **Сайты застройщиков** (источник = домен URL) | Лиды с промо-лендингов ЖК | Подтверждено на проде 2026-04-23 в `/console/leads`: 48/48 записей имеют источник `strana-siti.ru`, `soul-forma.ru`, `gertzena-city.ru` etc. Механизм импорта — через Яндекс.Диск или Google Spreadsheets (это первичные каналы); застройщики выгружают свои CRM-таблицы туда |
| `jivo` | Чат на сайте / в ЛК | JivoSite webhook → `JivoWebhookController::handle` → `LeadService::createFromExternal` |
| `direct` | Форма «Связаться» на public-offer | На 2026-04-23 отдельного endpoint'а для submit'а формы offer в `routes/api.php` не найдено — форма, скорее всего, отправляется на прямой email или Jivo-виджет на лендинге. Flow требует уточнения у фронт-команды |
| `referral` | Реферальная программа | В модели `Lead.source` значение есть, но создающего кода в репо нет — реферальная программа на 2026-04-23 не реализована (статус подтверждается отсутствием соответствующих контроллеров/сервисов) |

Feature-flag для всего sync-процесса: `LEADS_SYNC_ENABLED` из `config/leads.php` (по умолчанию `false`). В dev-окружении — выключен.

Детально JivoSite → [../05-integrations/jivosite.md](../05-integrations/jivosite.md) (Волна 5).

## Flow: лид приходит с Avito

```
SyncLeadsCommand (cron) → AvitoAPI::getCallsSince(lastSync)
                       → для каждого звонка:
                            LeadService::createFromExternal(
                              source='avito',
                              phone=$call->phoneNumber,
                              fullName=null,
                              residentalComplex=null
                            )
                          → new Lead(status=available, source=avito)
                          → если настроено автоназначение на владельца объекта,
                            assign(lead, user)
                          → event: LeadCreated
                            → listener: notify Telegram (если привязан)
                            → listener: dispatch AmoCRM event
                            → listener: PostHog event
```

## События и очереди

На 2026-04-23 **в коде отдельной папки `app/Leads/Events/` нет**, равно как и event-классов `LeadCreated`/`LeadAssigned`. Уведомления/диспатч в AmoCRM и Telegram делаются напрямую из `DefaultLeadService::createFromExternal` и из `SyncLeadsCommand`, без Laravel-events.

**Открытый tech-debt:** выделить `LeadCreated` event и листенеры (Telegram/AmoCRM/PostHog) для единообразия с Publishings/Billing модулями. Это улучшит наблюдаемость (один event, несколько слушателей) и позволит добавить PostHog-трекинг без новых инъекций в сервис.

### Scheduled commands

В `app/Leads/Console/Scheduler.php` зарегистрирована одна задача:

```php
$this->schedule->command(SyncLeadsCommand::class)
    ->everyFifteenMinutes()
    ->runInBackground();
```

- `SyncLeadsCommand` — **каждые 15 минут**. Pull звонков и сообщений с Avito + CIAN API, создание `Lead` записей через `LeadService::createFromExternal`.

## Интеграции

| Источник | Механизм | Статус |
|---|---|---|
| Avito | API pull через `SyncLeadsCommand` | ✅ prod |
| CIAN | API pull через `SyncLeadsCommand` | ✅ prod |
| JivoSite | Inbound webhook `/webhook/jivo/:token` | ✅ prod |
| AmoCRM | Outbound: event dispatch после создания лида | ✅ prod (через AmoCrm модуль) |
| Telegram | Push-уведомление агенту | ✅ prod |

Детали:
- [../05-integrations/avito.md](../05-integrations/avito.md) — pull звонков / сообщений
- [../05-integrations/cian.md](../05-integrations/cian.md)
- [../05-integrations/jivosite.md](../05-integrations/jivosite.md) (Волна 5)
- [../05-integrations/amocrm.md](../05-integrations/amocrm.md) (Волна 4)

## UTM-атрибуция

Лиды из регистрации (referral, direct) могут наследовать UTM из `users.utm_*` — атрибуция работает на уровне пользователя, не лида.

**Известный пробел**: UTM-метки не трекаются client-side на лендинге (из памяти проекта). Бэкенд готов принять `utm_*` в `/auth/register`, но фронт не всегда их передаёт. См. [tech-debt](../14-tech-debt.md) (Волна 9).

## Admin flow: массовое назначение

Админ видит весь пул лидов в `/admin/leads`. Может:

1. Фильтровать (источник, дата).
2. Выбрать массово.
3. `POST /admin/leads/bulk-assign` с `{lead_ids: [...], user_id: N}` → все выбранные лиды → `user_id`.

Возможные правила автоназначения (курирующие менеджеры, геолокация) — могут быть реализованы через `curator_id` на `User` + матчинг по городу.

## Known issues

- **Модель `Lead` минимальна** — нет связи с `Realty` (объектом). Звонок с конкретного объявления Avito попадает в общий пул лидов, связь «какой объект — какой лид» восстанавливается через `phoneNumber` объявления и историю звонков (`AvitoPublishingCall`).
- **`residental_complex`** заполнялся старым процессом (ручной ввод), сейчас почти не используется.
- **LeadStatus** — только 2 значения (`available`, `applied`). Реальный workflow сложнее: «связался», «перезвонить», «встреча», «сделка» — сейчас хранится либо во внешней CRM (AmoCRM), либо в комментариях.
- **Звонки не конвертируются в `Lead` один-в-один**: если клиент звонил трижды — 1 лид или 3? Сейчас дедупликация по `phone` (вероятно), детали в `LeadService::createFromExternal`.
- **UTM-атрибуция на уровне лида** — нет; только на уровне зарегистрированного юзера.

## Связанные разделы

- [publishings.md](./publishings.md) — звонки/сообщения через Avito, CIAN API.
- [../03-api-reference/leads.md](../03-api-reference/leads.md)
- [../05-integrations/avito.md](../05-integrations/avito.md), [cian.md](../05-integrations/cian.md), [jivosite.md](../05-integrations/jivosite.md), [amocrm.md](../05-integrations/amocrm.md)

## Ссылки GitLab

- [Leads/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Leads)
- [LeadController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Leads/Http/Controllers/LeadController.php)
- [Lead.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Leads/Models/Lead.php)
- [SyncLeadsCommand.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Leads/Console/Commands/SyncLeadsCommand.php)
