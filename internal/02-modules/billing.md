# Модуль: Billing (core)

> **Домен:** Billing (балансы, платежи, платёжные методы, промокоды, выплаты комиссий)
> **Репозиторий:** `rspase/project/backend`
> **Путь:** `backend/app/Http/Controllers/Billing/` + `backend/app/Models/Billing/`
> **Ветка prod:** `dev`
> **Статус:** production

## Назначение

Финансовый слой продукта. Покрывает:
- **Внутренний баланс** пользователя (пополнение через CloudPayments, трата на услуги/подписку).
- **Платёжные методы** — сохранённые карты.
- **Платежи CloudPayments** — проведение и история.
- **Счета** (`Invoice`) — объединяют одну или несколько позиций (подписка, услуги) в один платёж.
- **Промокоды** — скидки и активации.
- **Компенсационный баланс** (`compensation_balance`) — комиссии от банков, страховщиков; отдельный кошелёк для выплат агенту.

Эта страница — **core-структура**. Детали платёжного флоу, webhook'и CP и AmoCRM — в [05-integrations/cloudpayments.md](../05-integrations/cloudpayments.md) (Волна 4).

## Ключевые сущности

### Деньги на стороне юзера

| Модель | Описание |
|---|---|
| `BalanceTransaction` | Каждое движение внутреннего баланса (пополнение, списание, возврат) |
| `BalanceDeposit` | Явное пополнение баланса через CP |
| `CompensationBalanceTransaction` | Движения компенсационного баланса (от партнёров) |
| `CompensationWithdrawal` | Запрос на вывод комиссий (на карту, счёт, внутренний баланс) |
| `CompensationWithdrawalStatus` (enum) | `pending`, `started`, `completed`, `rejected` |
| `CompensationWithdrawalRecipientType` (enum) | `balance` (на внутренний баланс), `card`, `bank_account` |
| `CompensationWithdrawalType` (enum) | Категоризация выплаты |
| `RecipientDetails` | Реквизиты получателя (номер карты / банковский счёт) |

### Счета и платежи (единая модель)

| Модель | Описание |
|---|---|
| `Invoice` | Счёт — логическая сущность «что платим». Полиморфно привязан к `invoiceable` (Subscription, ServiceRequest и пр.) через `Invoiceable` |
| `InvoiceStatus` (enum) | `pending`, `paid`, `failed`, `cancelled` |
| `Order` | Заказ — агрегация нескольких счетов в одну транзакцию (например, подписка + услуги в одной корзине) |
| `OrderItem` | Позиция в заказе |
| `OrderStatus` (enum) | Статус заказа |
| `Payment` | Единый интерфейс платежа, независимый от провайдера |
| `PaymentProcessor` (enum) | `cloud_payments`, `balance` (внутренний) и т.д. |
| `PaymentResult` | Результат операции |
| `PaymentResultAction` | Что сделать после платежа (`redirect`, `show_3ds`, `complete`) |
| `Currency` (enum) | `RUB` и пр. |
| `Tier` | Тарифный срез для расчёта скидок (лежит в `Models/Billing/`, используется во всех прайсингах) |

### CloudPayments-specific

| Модель | Описание |
|---|---|
| `CPInvoicePayment` | Попытка оплаты счёта через CP. Поля: `invoice_id`, `transaction_id` (CP), `status`, `amount` |
| `CPInvoicePaymentStatus` (enum) | `pending`, `paid`, `failed`, `cancelled` |
| `CPInvoicePaymentType` (enum) | Тип операции (обычная / 3DS / SBP) |
| `CPInvoicePaymentFailCode` | Коды ошибок CP (`insufficient_funds`, `do_not_honor`, `expired_card` и т.д.) |
| `BalanceInvoicePayment` | Когда платим с внутреннего баланса, а не картой |

### Платёжные методы

| Модель | Описание |
|---|---|
| `PaymentMethod` | Сохранённая карта: токен CP, last4, brand, expiry |
| `PaymentMethodAuthorization` | Процесс авторизации новой карты (проходит через CP 3DS) |

### Промокоды

| Модель | Описание |
|---|---|
| `PromoCode` | Сам код: `code`, `discount_percent`, `valid_from/until`, `user_limit`, `usage_limit` |
| `PromoCodeActivation` | Факт активации юзером: `user_id`, `promo_code_id`, `activated_at` |
| `PromoCodeStatus` (enum) | `active`, `expired`, `disabled` |
| `PromoCodeUser` | Связь промокод ↔ пользователь (pivot) |

## API-эндпоинты (публичные, `auth:user`)

Префикс: `/billing`.

### Balance — внутренний баланс

| Метод | URL | Controller | Описание |
|---|---|---|---|
| `POST` | `/billing/balance/deposit` | `BalanceController::deposit` | Запрос на пополнение. Возвращает ссылку на CP |
| `GET` | `/billing/balance/transactions` | `BalanceController::listTransactions` | История операций |

### Compensation Balance — комиссионный баланс

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/billing/compensation-balance/transactions` | История начислений комиссий |

### Compensation Withdrawals — вывод комиссий

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/billing/compensation-withdrawals` | Список запросов на вывод |
| `POST` | `/billing/compensation-withdrawals` | Создать запрос (recipient_type + details) |
| `GET` | `/billing/compensation-withdrawals/recipient-details` | Шаблоны/подсказки реквизитов |

### Invoices — счета

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/billing/invoices` | Список счетов юзера |

### Payment methods — карты

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/billing/payment_methods` | Список сохранённых карт |
| `POST` | `/billing/payment_methods/authorize` | Запустить авторизацию новой карты (редирект на CP для 3DS) |
| `DELETE` | `/billing/payment_methods/{id}` | Удалить карту |

### Payments — история платежей

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/billing/payments/cloud-payments` | История CP-платежей с типами и статусами |

### Promo Codes

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/billing/promo-codes/activate` | Активировать по коду |
| `GET` | `/billing/promo-codes/active` | Текущий активированный промокод (если есть) |

### Webhook (без auth)

Префикс: `/webhook/cloud-payments`. Controller: `app/Http/Controllers/Webhook/CloudPayments/CloudPaymentsWebhookController.php`.

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/webhook/cloud-payments/check` | CP проверяет, можно ли провести платёж (`200 OK` если да) |
| `POST` | `/webhook/cloud-payments/pay` | CP сообщает об успешной оплате |
| `POST` | `/webhook/cloud-payments/fail` | CP сообщает об ошибке |

Детально — [05-integrations/cloudpayments.md](../05-integrations/cloudpayments.md) (Волна 4).

## Admin-эндпоинты

Под `/admin/billing/*`, middleware `auth:admin`. Кратко:
- Управление балансами (incrementBalance, decrementBalance).
- Подтверждение/отклонение запросов на вывод (start/complete/reject).
- Подтверждение запросов на вывод через разные способы: `complete/balance`, `complete/card`, `complete/bank-account`.
- CRUD промокодов.
- Admin list платежей CP с фильтрами.

Детально — [../03-api-reference/admin/billing.md](../03-api-reference/admin/plans-and-billing.md) (Волна 7).

## Сервисы и бизнес-логика

Все биллинг-сервисы живут в `app/Services/Billing/`; контракты (интерфейсы) — в `app/Contracts/Services/Billing/`. Паттерн: интерфейс `FooService` + имплементация `DefaultFooService` (или `CPFooService`/`BalanceFooService` для провайдер-специфичных).

| Сервис | Интерфейс | Имплементация | Что делает |
|---|---|---|---|
| `BalanceService` | `Contracts/Services/Billing/Balance/BalanceService.php` | `app/Services/Billing/Balance/BalanceService.php` | Пополнение/списание внутреннего баланса |
| `PaymentService` | `Contracts/Services/Billing/Payment/PaymentService.php` | `app/Services/Billing/Payment/PaymentService.php` + `CPPaymentService`, `BalancePaymentService`, `AbstractProcessor`, `CPProcessor`, `BalanceProcessor` | Единый интерфейс платежа; обработка webhook'ов CP |
| `CompensationBalanceService` | — | `app/Services/Billing/CompensationBalance/CompensationBalanceService.php` + `DefaultCompensationBalanceService` | Начисление и списание комиссионного баланса |
| `CompensationWithdrawalService` | — | `app/Services/Billing/CompensationBalance/Withdrawals/CompensationWithdrawalService.php` + `DefaultCompensationWithdrawalService` + 4 `*Strategy.php` (balance / card / bankAccount / abstract) | Flow вывода комиссий |
| `PromoCodeService` | `Contracts/Services/Billing/PromoCodes/PromoCodeService.php` | `app/Services/Billing/PromoCodes/DefaultPromoCodeService.php` + `ActivatePromoCodeCommand.php` | Активация, проверка валидности |
| `InvoiceService` | — | `app/Services/Billing/Invoice/InvoiceService.php` + `DefaultInvoiceService.php` | Создание счетов (агрегация позиций) |
| `OrderService` | `Contracts/Services/Billing/Order/OrderService.php` | `app/Services/Billing/Order/OrderService.php` | Агрегация счетов в корзину |
| `PaymentMethodService` | `Contracts/Services/Billing/PaymentMethod/PaymentMethodService.php` | `app/Services/Billing/PaymentMethod/PaymentMethodService.php` | CRUD сохранённых карт |
| `TierService` | `Contracts/Services/Billing/Tier/TierService.php` | `app/Services/Billing/Tier/TierService.php` | Расчёт текущего тарифного среза пользователя |

DTO для сервисов (примеры): `CreateInvoiceDto`, `IncrementCompensationBalanceDto`, `DecrementCompensationBalanceDto`, `CreateCompensationWithdrawalDto` — в соответствующих папках.

## События

| Event | Путь | Когда срабатывает |
|---|---|---|
| `InvoicePaid` | `app/Events/Billing/Invoices/InvoicePaid.php` | Успешная оплата счёта |
| `PaymentMethodCreated` | `app/Events/Billing/PaymentMethod/PaymentMethodCreated.php` | Новая карта привязана через авторизацию |
| `PaymentMethodRestored` | `app/Events/Billing/PaymentMethod/PaymentMethodRestored.php` | Карта восстановлена после soft-delete |
| `CompensationWithdrawalCreated` | `app/Events/Billing/CompensationWithdrawal/CompensationWithdrawalCreated.php` | Юзер запросил вывод — админ получает уведомление |
| `SubscriptionActivated` (из Subscriptions) | `app/Subscriptions/Events/SubscriptionActivated.php` | После оплаты подписочного счёта |

**Внимание:** специального события `CompensationWithdrawalCompleted` в коде на 2026-04-23 **нет** — статус `CompensationWithdrawal.status = completed` меняется напрямую в `CompensationWithdrawalCompleteStrategy`, уведомление юзеру уходит из стратегии (не через listener). Если нужен отдельный event — это tech-debt.

## Частые flow (коротко)

### 1. Оплата подписки картой

```
User → POST /subscription/subscribe (plan_id)
SubscriptionService → InvoiceService::create(Subscription, amount)
                   → PaymentService::initCloudPayments(invoice)
                   → CPInvoicePayment created, status=pending
                   → return payment_url (redirect на CP)
User → 3DS на CP → успех
CloudPayments → POST /webhook/cloud-payments/pay
CloudPaymentsWebhookController → проверка HMAC
                              → CPInvoicePayment.status=paid
                              → Invoice.status=paid
                              → event: SubscriptionActivated
                              → event: InvoicePaid
```

### 2. Пополнение внутреннего баланса

```
User → POST /billing/balance/deposit (amount)
BalanceService → BalanceDeposit created
              → Invoice created (invoiceable: BalanceDeposit)
              → CP payment flow (аналогично подписке)
```

### 3. Вывод комиссии на карту

```
User → POST /billing/compensation-withdrawals (recipient_type=card, details)
CompensationWithdrawalService → CompensationWithdrawal created, status=pending
Admin (админка) → start → status=started
                → complete/card → status=completed
                → событие: CompensationWithdrawalCompleted
                → юзер получает уведомление (Telegram/SMS)
```

### 4. Списание услуги с внутреннего баланса

```
User заказал услугу (ServiceRequest)
ServiceRequest.final_price (с учётом скидки по тарифу)
→ BalanceInvoicePayment если хватает средств
→ иначе → CP-платёж
```

## Интеграции

- **CloudPayments** — см. [05-integrations/cloudpayments.md](../05-integrations/cloudpayments.md). Основной провайдер.
- **AmoCRM** — подписка/платёж → event dispatch в AmoCRM (через `AmoCrm` модуль).
- **PostHog** — события `payment_started`, `payment_failed`, `subscription_activated` (если активно).

## Security

- Webhook CP — валидация **HMAC-подписи** (секрет в `.env`).
- 3DS — обязателен для всех card-платежей (CP настройка).
- Promo code — проверки в `PromoCodeService::activate`: срок, лимит по юзеру, лимит по коду.
- Withdrawal — админский workflow, юзер не может сам провести выплату.
- `RecipientDetails` (реквизиты для выплат) — **хранятся как обычный JSON без шифрования** (подтверждено кодом `app/Models/Billing/Balance/RecipientDetails.php` — чистый `json_decode/json_encode` через Laravel `Castable`). Это содержит `accountNumber`, `bik`, `inn` и т.д. в открытом виде в БД — **требует аудита безопасности** (PII + платёжные данные).

## Known issues
- **Polymorphic Invoiceable** — работает, но admin-debug иногда падает когда модель удалена без каскада на Invoice.
- **Compensation Withdrawal** — ручной апрув админом (нет автоматики с банк-API).
- **Promocodes** — скидка применяется только к подписке, не к услугам (из ТЗ Пересборки это открытый вопрос).
- **Failed CP transactions** — код `CPInvoicePaymentFailCode` читается, но нотификация юзеру не всегда приходит. TBD.
- **Multi-currency** — `Currency` enum есть, но фактически только `RUB` используется.

## Связанные разделы

- [subscriptions.md](./subscriptions.md) — подписочный flow.
- [../05-integrations/cloudpayments.md](../05-integrations/cloudpayments.md) — детальный CP flow (Волна 4).
- [../05-integrations/amocrm.md](../05-integrations/amocrm.md) — синхронизация событий.
- [../03-api-reference/billing.md](../03-api-reference/billing.md)
- [../03-api-reference/webhooks.md](../03-api-reference/webhooks.md) — webhook'и (все вместе).

## Ссылки GitLab

- [Http/Controllers/Billing/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Http/Controllers/Billing)
- [Models/Billing/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Models/Billing)
- [BalanceController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/Balance/BalanceController.php)
- [CloudPaymentsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/Payments/CloudPayments/CloudPaymentsController.php)
- [CloudPaymentsWebhookController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Webhook/CloudPayments/CloudPaymentsWebhookController.php)
