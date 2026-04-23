# 10. Фоновые задачи и очереди

> **Аудитория:** backend-разработчики, DevOps.
> **Последнее обновление:** 2026-04-23

Queue + Jobs + Scheduled commands — всё, что работает асинхронно или по cron.

## Queue

**Driver:** `database` (из `.env`: `QUEUE_CONNECTION=database`, таблица `jobs`).

Для прод — вероятно тот же `database` (не Redis). Это **достаточно** для текущей нагрузки RSpace (14 платящих, сотни регистраций в день), но при росте — кандидат на переход к Redis/SQS.

### Почему database queue работает
- Нет отдельной Redis-инстанции → меньше операционной сложности.
- Failover не нужен (БД уже HA).
- Прозрачный мониторинг через `SELECT * FROM jobs WHERE ...`.

### Таблицы queue
- `jobs` — активная очередь.
- `failed_jobs` — упавшие после всех retry.
- `job_batches` — групповые задачи (если используются).

### Запуск worker'ов

В docker-compose backend стандартный worker:
```bash
php artisan queue:work --queue=default,webhooks --tries=3 --timeout=90
```

**Требует подтверждения у DevOps:** количество воркеров на проде, настройки supervisor/systemd, restart-стратегия при deploy. По коду это не восстанавливается.

## Jobs

Централизованная папка `app/Jobs/` — **тонкая**, большинство доменных Jobs лежат в `app/<Domain>/Jobs/`.

### Централизованные (`app/Jobs/`)

| Job | Назначение |
|---|---|
| `Billing\ExpireInvoicesJob` | Переводит просроченные `Invoice`'ы в статус `expired` |
| `Billing\PayOffSessionCPPaymentJob` | Закрывает CP-сессию по истечении TTL |
| `Billing\VoidCPPaymentJob` | Отмена CP-авторизации (для `Auth`-типа платежей) |
| `Feeds\GenerateFeedJob` | Генерация XML feed'а для Avito / CIAN (ленивый, по запросу) |

### Доменные Jobs

| Модуль | Job |
|---|---|
| **AmoCRM** | `app/AmoCrm/Jobs/SendAmoCrmEventDispatchJob.php` — отправка events в hooks.tglk.ru. 5 попыток, backoff `[60, 60, 300, 3600, 43200]` сек |
| **Telegram** | `app/Telegram/Jobs/SendTelegramMessageJob.php` — асинхронная отправка push-сообщений через Telegram Bot API |
| **Avito/CIAN** | **Выделенных Job-классов для публикации нет.** Публикации запускаются из контроллеров синхронно; ошибки возвращаются в UI. Эвенты (`AvitoPublishingActivated`, `CianPublishingPublished`) диспатчатся через Laravel Events, но не через Jobs. Фоновые задачи этих доменов — console-команды `LoadAvito*Command` / `LoadCian*Command` (статистика, звонки, feed-results). |
| **OpenAI** | Генерация описания — **синхронно**, не Job (10-20 сек, приемлемо) |

### Retry-стратегии

Примеры из кода:
- **SendAmoCrmEventDispatchJob**: `$tries = 5`, backoff `[60, 60, 300, 3600, 43200]` сек = 1 мин, 1 мин, 5 мин, 1 час, 12 часов.
- **Default Laravel**: 1 попытка, без backoff (если не указано).

Для новых Jobs **принятая практика** — указывать `$tries` и `backoff()` явно.

### Failed jobs

Упавшие после всех retry — в `failed_jobs`. Смотрим через:
```bash
php artisan queue:failed
# Повторить упавший
php artisan queue:retry <job_id>
# Очистить все
php artisan queue:flush
```

В админке RSpace **нет UI** для просмотра failed_jobs — смотрим через Artisan-команду на проде.

## Scheduled commands (cron)

Laravel Scheduler (`app/Console/Kernel.php` или распределённые `Scheduler.php` по доменам).

### Все console-команды RSpace (из `app/Console/Commands/`)

#### Root-уровня
- `AddSuperAdminCommand` — ручное создание супер-админа (обычно первый).

#### Avito
- `LoadAvitoCallsDataCommand` — pull звонков с Avito.
- `LoadAvitoFeedResultsCommand` — проверка статусов feed-публикаций.
- `LoadDailyAvitoStatisticsCommand` — дневная статистика (просмотры/контакты).
- `LoadWeeklyAvitoStatisticsCommand` — недельная агрегация.
- `LoadFullAvitoStatisticsCommand` — полная пересборка (вручную).
- `SyncNewDevelopmentsCommand` — синхронизация каталога новостроек.

#### CIAN (зеркально)
- `LoadCianCallsDataCommand`
- `LoadCianFeedResultsCommand`
- `LoadDailyCianStatisticsCommand`, `LoadWeeklyCianStatisticsCommand`, `LoadFullCianStatisticsCommand`
- `SyncNewObjectsCommand`

#### Billing
- `RecalculateCompensationBalanceCommand` — пересчёт баланса (консистентность).

#### Dadata
- `SyncDadataCitiesCommand` — обновление справочника городов от Dadata.

#### Feeds
- `GenerateAvitoFeedCommand`, `GenerateCianFeedCommand` — пересборка XML feed.
- `PruneFeedRequestData` — очистка старых feed-логов.

#### Subscriptions (из `app/Subscriptions/Console/Commands/`)
- `ProcessExpiringSubscriptionsCommand` — уведомления за 3 дня до окончания.
- `ProcessSubscriptionRenewalsCommand` — автосписание по `ends_at`.

#### Leads (из `app/Leads/Console/Commands/`)
- `SyncLeadsCommand` — pull новых лидов с Avito/CIAN.

#### Publishings (из `app/Publishings/Console/Commands/`)
- `ProcessPublishingExpirationCommand` — архивирование истёкших публикаций.

#### Migration (одноразовые)
- `FillDadataCommand` — backfill Dadata-данных.
- `MigrateRealtyPublishedStatusCommand` — миграция статусов.
- `MigrateVideoUrlCommand` — миграция video_url полей.

### Доменные Scheduler-файлы

Каждый домен регистрирует свои scheduled tasks локально через `final readonly class Scheduler { initialize() }`. Провайдер домена вызывает `$scheduler->initialize()` в `boot()`.

| Домен | Файл |
|---|---|
| Subscriptions | `app/Subscriptions/Console/Scheduler.php` |
| Leads | `app/Leads/Console/Scheduler.php` |
| Publishings | `app/Publishings/Console/Scheduler.php` |
| Reporting | `app/Reporting/Console/Scheduler.php` |

### Точные расписания (из `Scheduler.php`)

Сверено 2026-04-23 прямо по коду каждого Scheduler-файла:

| Команда | Частота | Источник |
|---|---|---|
| `ProcessExpiringSubscriptionsCommand` | **каждую минуту** | `app/Subscriptions/Console/Scheduler.php` |
| `ProcessSubscriptionRenewalsCommand` | **каждую минуту** | там же |
| `SyncLeadsCommand` | **каждые 15 минут** | `app/Leads/Console/Scheduler.php` |
| `ProcessPublishingExpirationCommand` | **каждые 30 минут** | `app/Publishings/Console/Scheduler.php` |
| `ReportExpiringPublishingsCommand` | **каждый час, в :40** | `app/Reporting/Console/Scheduler.php` |
| `ReportPublishingPlatformErrorsCommand` | **каждый час, в :05** | там же |

**Важно**: большинство `Load*Command` (статистика и звонки Avito/CIAN, Dadata cities, feed-генерация, backfill-миграции, балансы партнёров) в `Scheduler.php` **не зарегистрированы** — это commands, которые запускаются вручную (`php artisan avito:load-calls`) или через внешний cron / CI. Документировать автозапуск для них **нельзя**, т.к. его в коде нет.

### Запуск scheduler'а

Cron-запись на проде:
```bash
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```

Запускается каждую минуту, Laravel сам решает, что пора запускать.

## Broadcasting

**Driver:** `log` (из `.env`: `BROADCAST_CONNECTION=log`).

Это значит — **реал-тайм события НЕ рассылаются** через WebSocket / Pusher / Laravel Reverb. События просто логируются. Для уведомлений используется Telegram (см. [telegram.md](./05-integrations/telegram.md)).

**Future:** при росте UI-живых обновлений (например, лента лидов в реальном времени) — можно включить Reverb или Pusher. TBD в roadmap.

## Jobs vs Events vs Listeners

Как устроено:

```
Event (фактов произошёл) → Listener (обрабатывает) → (опционально) Job (async работа)
```

Примеры:

### UserRegistered
```
POST /auth/register → UserService::registerUser
                   → event(UserRegistered(user))
                   → Listener DispatchUserRegistered
                     → EventDispatchService::createDispatch(user.registered, user)
                     → SendAmoCrmEventDispatchJob (queue)
                   → queue worker отправляет в hooks.tglk.ru
```

### InvoicePaid
```
CP webhook /webhook/cloud-payments/pay → проверка HMAC
                                      → CPInvoicePayment.status=paid
                                      → Invoice.status=Paid
                                      → event(InvoicePaid(invoice))
                                      → Listener DispatchPaymentSuccess → AmoCRM
                                      → (для Subscription) Listener → активирует подписку
                                      → (для ServiceRequest) Listener → переводит в in_progress
```

## IdempotentEvent

`app/Events/IdempotentEvent.php` — базовый класс для событий, которые должны обрабатываться **ровно один раз**. Защита от дубликатов webhook'ов (CP может повторить).

Паттерн:
1. Webhook приходит, создаётся `IdempotentEvent` с уникальным `event_key` (например, `cp_pay:{TransactionId}`).
2. Таблица `idempotency_events` хранит обработанные ключи.
3. Повторный webhook с тем же key — пропускается (no-op).

## Мониторинг очередей

**Текущий:** через `failed_jobs` вручную + логи (`[AMO_CRM]`, `[CLOUD_PAYMENTS]`, `[SMS]` префиксы).

**TBD улучшения:**
- Dashboard для админки (список failed jobs + retry-кнопка).
- Alert через Telegram при фейле критичных jobs (например, `SendAmoCrmEventDispatchJob` падает 5 раз).
- Метрики: время обработки каждого job, очередь depth.

### Horizon?

Laravel Horizon — мощный monitoring UI для queue, **НЕ установлен** в проекте (из `composer.json` не видно `laravel/horizon`). Кандидат на установку, если перейдём на Redis.

## Как добавить новый Job

```bash
cd backend
php artisan make:job MyCustomJob
```

В классе:
```php
final class MyCustomJob implements ShouldQueue {
    use Queueable, InteractsWithQueue, SerializesModels, Dispatchable;

    public int $tries = 3;

    public function backoff(): array {
        return [30, 120, 300]; // 30s, 2m, 5m
    }

    public function handle(SomeService $service): void {
        // работа
    }
}
```

Dispatch:
```php
MyCustomJob::dispatch($data);
// или с задержкой
MyCustomJob::dispatch($data)->delay(now()->addMinutes(5));
```

## Known issues

- **Database queue driver** — масштабируется до определённой нагрузки. При росте — миграция на Redis.
- **Нет UI failed_jobs** — админ не видит статуса очередей, только через `artisan queue:failed`.
- **Scheduled расписания разбросаны** — каждый домен свой `Scheduler.php`. Нет единого сводного документа с расписанием.
- **Broadcasting = log** — нет real-time UI.
- **Concurrent job execution** для одной сущности — не везде защищено (race conditions возможны, например при параллельных webhook'ах CP → защита через `DB::transaction + lockForUpdate`).

## Связанные разделы

- [11. Events](./11-events.md) — полный список событий.
- [05-integrations/amocrm.md](./05-integrations/amocrm.md) — пример retry-стратегии.
- [05-integrations/telegram.md](./05-integrations/telegram.md) — async отправка.
- [12. Инфраструктура](./12-infrastructure.md) — как воркеры развёрнуты.
- [14. Tech Debt](./14-tech-debt.md) — Redis, Horizon, мониторинг.

## Ссылки GitLab

- [app/Jobs/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Jobs)
- [app/Console/Commands/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Console/Commands)
- [.env.example](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/.env.example)
