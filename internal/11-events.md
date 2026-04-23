# 11. Events & Broadcasting

> **Аудитория:** backend-разработчики.
> **Последнее обновление:** 2026-04-23

Laravel Events — основной механизм межмодульной коммуникации в RSpace. Domain publishes, другие домены подписываются. Обеспечивает слабую связность.

## Architecture

```
Service Layer (Identity, Billing, Realty, ...)
       │
       ▼ event(SomeEvent::dispatch(data))
┌─────────────────┐
│  Laravel Event  │
│   Dispatcher    │
└───┬─────────────┘
    │
    ├──▶ Listener A (sync) — изменяет БД
    ├──▶ Listener B (async, ShouldQueue) — отправляет в AmoCRM
    ├──▶ Listener C (async) — посылает Telegram-push
    └──▶ Listener D (sync) — пишет PostHog event
```

**Регистрация listeners** — в каждом `ServiceProvider` домена через `Event::listen()` / `Event::subscribe()`.

## Все events в системе

Из `app/Events/` (+ доменные events в `app/<Domain>/Events/`):

### Users
- **`UserRegistered`** (`app/Events/Users/UserRegistered.php`) — после успешной регистрации (SMS-код подтверждён, user создан).
  - Единственный listener в коде на 2026-04-23: `app/AmoCrm/Listeners/DispatchUserRegistered.php` (→ webhook в AmoCRM).
  - PostHog-трекинг **не реализован** на бэкенде (зависимость установлена, но кода вызова нет).
  - Telegram welcome — не настроен как listener, приветственное сообщение, если есть, уходит из реакции на `TelegramChatBound` (после привязки).

### Billing
- **`InvoicePaid`** (`app/Events/Billing/Invoices/InvoicePaid.php`) — универсальный event «счёт оплачен». Работает для Subscription, ServiceRequest, ScoringRequest, BalanceDeposit, WidgetOrder.
  - Listeners: `DispatchPaymentSuccess` (AmoCRM), активация подписки / услуги / скоринга в зависимости от `invoiceable_type`.
- **`PaymentMethodCreated`** — привязана новая карта.
  - Listeners: (вероятно) `DispatchCardAuthorized` (AmoCRM `card.authorized` event).
- **`PaymentMethodRestored`** — восстановленная карта (после ошибки / reauth).
- **`CompensationWithdrawalCreated`** (`app/Events/Billing/CompensationWithdrawal/`) — юзер запросил вывод.
  - Listeners: уведомление админу / Света получает сигнал.

### Publishings
- **`PublishingCreated`** — создана публикация (`Publishing`, корень).
- **`PublishingArchived`** — публикация снята со всех площадок.
- **`AvitoPublishingActivated`** — Avito подтвердил публикацию (прошла модерацию).
  - Listeners: `DispatchAvitoObjectPublished` (AmoCRM).
- **`AvitoPublishingStatusChanged`** — смена статуса (любая).
- **`AvitoPublishingFeedErrorOccurred`** — ошибка в feed-генерации для Avito.
- **`CianPublishingPublished`** — ЦИАН подтвердил.
  - Listeners: `DispatchCianObjectPublished` (AmoCRM).
- **`CianPublishingStatusChanged`**.
- **`CianPublishingFeedErrorOccurred`**.
- **`PublishingExpired`** (`app/Publishings/Events/`) — истёк срок публикации.
  - Listeners: уведомление агенту в Telegram за 3 дня до.

### Publishings / Promotion
- **`AvitoPromotionRequested`** — юзер запросил промо (заявка админу).
  - Listeners: уведомление админам в Telegram / email.
- **`CianPromotionRequested`** — то же для ЦИАН.

### Services
- **`ServiceRequested`** (`app/Events/Service/Request/ServiceRequested.php`) — создана заявка на услугу.
  - Listeners: уведомление юристу / админу.

### Scoring
- **`ScoringRequestPaid`** (`app/Scoring/Events/ScoringRequestPaid.php`) — заявка на проверку оплачена, state → InProgress.
  - Listeners: уведомление админу / запуск work-flow.

### Realty
- **`RealtyPublished`** (`app/Realty/Realty/Events/RealtyPublished.php`) — объект отправлен в публикацию.
  - Listener: `app/Onboarding/Listeners/ProcessRealtyPublished.php` — отмечает шаг онбординга «Опубликовать объект». Других listener'ов в коде нет.

### Identity
- **`UserProfileUpdated`** (`app/Identity/Events/UserProfileUpdated.php`) — профиль обновлён.
  - Listener'ов в коде **нет** (grep по `UserProfileUpdated` в `Listeners/` пуст). Событие диспатчится, но никто не реагирует — задел на будущее.

### Telegram
- **`TelegramChatBound`** (`app/Telegram/Events/TelegramChatBound.php`) — user привязал Telegram bot.
  - Listeners: welcome-message в бот.

### SMS
- **`SmsRuMessageSent`** (`app/Sms/Events/SmsRuMessageSent.php`) — SMS успешно отправлена.
  - Listeners: аналитика, counters.

## Special: IdempotentEvent

`app/Events/IdempotentEvent.php` — **базовый класс** для событий, которые должны обрабатываться ровно один раз.

**Назначение:** защита от **дубликатов webhook'ов**. CloudPayments / Avito / CIAN могут повторно прислать уведомление о том же событии — если событие уже обработано, скипаем.

**Паттерн:**
1. Webhook → создаётся event, имеющий уникальный key (например `cp_pay:{TransactionId}`).
2. Перед dispatch'ем проверяется `idempotency_events` таблица.
3. Если key уже есть → event не выстреливает (no-op).
4. Иначе → listeners работают, после успеха key сохраняется.

**Таблица:** `idempotency_events`, ключевое поле — `event_key`.

## Event subscribers

`AmoCrmServiceProvider::registerEventListeners`:

```php
Event::listen(AvitoPublishingActivated::class, DispatchAvitoObjectPublished::class);
Event::listen(CianPublishingPublished::class, DispatchCianObjectPublished::class);
Event::listen(InvoicePaid::class, DispatchPaymentSuccess::class);
Event::listen(UserRegistered::class, DispatchUserRegistered::class);
Event::subscribe(DispatchCardAuthorized::class);  // подписчик сам решает, на какие события
```

**`Event::listen()`** — один event → один listener.
**`Event::subscribe()`** — подписчик-класс с методом `subscribe()`, регистрирует несколько handler'ов.

## Broadcasting

**Driver:** `log`.

**Что это значит:** real-time события **НЕ** рассылаются по WebSocket. Laravel просто логирует факт срабатывания.

**Почему не Reverb/Pusher:**
- UI-сценариев real-time обновления мало (новые лиды — через Telegram push, не через WebSocket на страницу ЛК).
- Стоимость инфры не оправдана на 14 платящих.

**Future:** если появится потребность (live-feed лидов, realtime notifications в UI кабинета) — включить Laravel Reverb (бесплатный self-hosted WebSocket-сервер).

## Как добавить новое событие

1. **Создать event:**
   ```bash
   php artisan make:event MyDomain/MyEvent
   ```

2. **Класс:**
   ```php
   namespace App\MyDomain\Events;

   use Illuminate\Foundation\Events\Dispatchable;
   use Illuminate\Queue\SerializesModels;

   class MyEvent {
       use Dispatchable, SerializesModels;
       public function __construct(public readonly User $user, public readonly int $amount) {}
   }
   ```

3. **Dispatch:**
   ```php
   event(new MyEvent($user, 1000));
   // или
   MyEvent::dispatch($user, 1000);
   ```

4. **Listener (опционально):**
   ```bash
   php artisan make:listener MyDomain/Listeners/HandleMyEvent
   ```

5. **Регистрация в ServiceProvider:**
   ```php
   Event::listen(MyEvent::class, HandleMyEvent::class);
   ```

## Практики

- **Event names** — глагол в прошедшем времени: `UserRegistered`, `InvoicePaid`, `SubscriptionActivated`, `ScoringRequestFinished`.
- **Read-only properties** в event-классах (иммутабельные).
- **SerializesModels trait** — обязателен, если event обрабатывается в queue.
- **ShouldQueue** в Listener — если работа тяжёлая (HTTP-запросы, многострочная логика).
- **Fat event, thin listener** — event несёт всю нужную data, listener только обрабатывает.

## Debug и мониторинг

### Локально
```bash
# Все зарегистрированные события и их listeners
php artisan event:list

# Логи событий
tail -f storage/logs/laravel.log | grep 'Event\\\\'
```

### Прод
- Логи с префиксами `[AMO_CRM]`, `[CLOUD_PAYMENTS]`, `[TELEGRAM]`.
- Таблица `event_dispatches` — для AmoCRM-событий (статусы отправки).

## Known issues

- **Нет централизованного каталога events** (кроме этого файла) — разработчики должны идти в код.
- **Нет visualization event-flow** (Mermaid в этом документе — компенсация).
- **PostHog events в backend** — `posthog-php` в composer.json зависимостью есть, но на 2026-04-23 ни один listener в `app/` не шлёт событий в PostHog. Серверный трекинг полностью отсутствует.
- **Listener errors** в async-queue могут тихо падать (popping to failed_jobs). Нужен UI-дашборд.

## Связанные разделы

- [10. Jobs & Queues](./10-jobs-queues.md) — где async-listeners запускаются.
- [02-modules/](./02-modules/) — где events генерируются.
- [05-integrations/amocrm.md](./05-integrations/amocrm.md) — главный потребитель events (5 типов).
- [14. Tech Debt](./14-tech-debt.md) — мониторинг + Reverb для real-time.

## Ссылки GitLab

- [app/Events/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Events)
- [AmoCrmServiceProvider (listeners)](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/AmoCrm/AmoCrmServiceProvider.php)
- [app/Scoring/Events/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Scoring/Events)
- [app/Publishings/Events/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Publishings/Events)
