# Admin API: Plans & Billing

CRUD тарифов, настройка скидок по уровням (Plan Level Settings), управление биллингом, обработка выводов комиссий, промокоды. Controllers: `AdminPlanController`, `AdminBalanceController`, `AdminCompensationBalanceController`, `AdminCompensationWithdrawalController`, `AdminInvoiceController`, `AdminPaymentMethodController`, `AdminCloudPaymentsController`, `AdminPromoCodeController`.

---

## Plans (тарифы)

Под `/admin/plans`.

### `GET /admin/plans`
Список всех тарифов (активные + архивные).

### `POST /admin/plans`
Создать новый тариф.

**Request body (пример):**
```json
{
  "name": "Профи",
  "level": "professional",
  "region": "capital",
  "price": 500000,
  "discount_percent": 20,
  "services": [
    { "service_id": 17, "limit": 0 },
    { "service_id": 25, "limit": 1 }
  ]
}
```

### `GET /admin/plans/{plan_id}`
Детали конкретного тарифа.

### `PUT /admin/plans/{plan_id}`
Обновить (название, цена, лимиты).

### `POST /admin/plans/{plan_id}/archive`
Архивировать — новые подписки не создаются, старые продолжают работать.

### `POST /admin/plans/{plan_id}/restore`
Восстановить из архива.

---

## Plan Level Settings (матрица скидок)

**Критичная фича**: админ может менять **%-скидки** на услуги в зависимости от уровня тарифа — **без релиза**.

### `GET /admin/plans/levels`
Получить матрицу: уровень × услуга → % скидки.

**Ответ (упрощённый):**
```json
{
  "data": [
    { "level": "professional", "discount_percent": 20 },
    { "level": "premium", "discount_percent": 25 },
    { "level": "ultima", "discount_percent": 30 },
    { "level": "enterprise", "discount_percent": 40 }
  ]
}
```

(Структура может быть сложнее — с разбивкой по типам услуг. TBD уточнить по `PlanLevelSettings` модели.)

### `PUT /admin/plans/levels`
Обновить матрицу. Используется для корректировки скидок без деплоя.

**Use case:** маркетинг решил запустить промо-неделю с повышенной скидкой — меняем % → обновляет все подписки мгновенно.

---

## Balance (внутренний баланс юзеров — транзакции)

Под `/admin/billing/balance` и `/admin/billing/balance-transactions` (deprecated-alias).

### `GET /admin/billing/balance/transactions`
Лог всех транзакций по внутренним балансам (всех юзеров).

**Query params:** `user_id`, `type`, `from`, `to`, `page`.

**Use case:** аудит «куда делись деньги юзера».

---

## Compensation Balance (комиссионный баланс)

Под `/admin/billing/compensation-balance`. Controller: `AdminCompensationBalanceController`.

### `POST /admin/billing/compensation-balance/increment`
**Начислить** на компенсационный баланс юзера (когда банк / страховая заплатила комиссию).

**Request body:**
```json
{
  "user_id": 123,
  "amount": 9000000,
  "source": "alpha_bank_mortgage",
  "reference_id": "MTG-2026-04-22-001",
  "comment": "Комиссия за ипотечную сделку (Иван Петров, 6 млн)"
}
```

### `POST /admin/billing/compensation-balance/decrement`
**Списать** (исправление ошибки, возврат, штраф).

### `GET /admin/billing/compensation-balance/transactions`
Лог транзакций комиссионного баланса.

---

## Compensation Withdrawals (обработка выводов)

Под `/admin/billing/compensation-withdrawals`. Controller: `AdminCompensationWithdrawalController`.

### `GET /admin/billing/compensation-withdrawals`
Все запросы на вывод (от всех юзеров) с фильтрами по статусу.

**Ответ:**
```json
{
  "data": [
    {
      "id": 89,
      "user": { "id": 123, "phone": "+7...", "name": "..." },
      "recipient_type": "card",
      "amount": 9000000,
      "status": "pending",
      "recipient_details": { "card_number": "2200...", "card_holder": "..." },
      "created_at": "..."
    }
  ]
}
```

### `GET /admin/billing/compensation-withdrawals/{withdrawal_id}`
Детали одного запроса.

### Workflow: обработка запроса

```
Юзер создаёт запрос (status=pending)
       ↓
Админ: POST /admin/billing/compensation-withdrawals/{withdrawal_id}/start  (status=started)
       ↓
Админ делает перевод в своём банк-клиенте
       ↓
Админ фиксирует завершение одним из трёх способов:
       ├─ POST .../complete/balance        — на внутренний баланс RSpace
       ├─ POST .../complete/card           — перевод на карту выполнен
       └─ POST .../complete/bank-account   — перевод на счёт выполнен
       ↓
 status=completed, юзеру — уведомление в Telegram
```

### `POST /admin/billing/compensation-withdrawals/{withdrawal_id}/start`
Перевести в статус «В работе» (админ взял запрос).

### `POST /admin/billing/compensation-withdrawals/{withdrawal_id}/complete/balance`
Завершить с зачислением на внутренний баланс RSpace (без перевода в банк).

### `POST /admin/billing/compensation-withdrawals/{withdrawal_id}/complete/card`
Завершить с пометкой «перевод на карту выполнен».

**Request body:**
```json
{ "reference": "...", "comment": "..." }
```

### `POST /admin/billing/compensation-withdrawals/{withdrawal_id}/complete/bank-account`
То же для банковского счёта.

### `POST /admin/billing/compensation-withdrawals/{withdrawal_id}/reject`
Отклонить с причиной.

**Request body:**
```json
{ "reason": "Некорректные реквизиты карты" }
```

**Эффект:** сумма возвращается на compensation_balance юзера, статус `rejected`, юзер получает уведомление.

---

## Invoices (счета)

### `GET /admin/billing/invoices`
Список всех счетов с фильтрами.

**Query params:** `user_id`, `status`, `invoiceable_type`, `from`, `to`.

---

## Payment Methods

### `GET /admin/billing/payment-methods`
Список всех сохранённых карт всех юзеров. Для аудита и поддержки.

---

## CloudPayments

### `GET /admin/billing/payments/cloud-payments`
История всех CP-платежей с фильтрами.

**Query params:** `user_id`, `status`, `fail_code`, `from`, `to`.

**Use case:** найти, почему у юзера не прошёл платёж — смотрим `fail_code`.

---

## Promo Codes

Под `/admin/billing/promo-codes`. Controller: `AdminPromoCodeController`.

### `GET /admin/billing/promo-codes`
Список всех промокодов.

### `POST /admin/billing/promo-codes`
Создать.

**Request body:**
```json
{
  "code": "SPRING2026",
  "discount_percent": 15,
  "valid_from": "2026-04-01",
  "valid_until": "2026-05-31",
  "usage_limit": 100,
  "user_limit": 1,
  "applies_to": "subscription"
}
```

### `GET /admin/billing/promo-codes/{promo_code_id}`
Детали.

### `PATCH /admin/billing/promo-codes/{promo_code_id}`
Обновить.

### `POST /admin/billing/promo-codes/{promo_code_id}/activate`
Принудительно активировать для конкретного юзера (без ввода юзером).

**Request body:** `{ "user_id": 123 }`.

### `GET /admin/billing/promo-codes/{promo_code_id}/activations`
Список всех активаций этого кода (кто когда использовал).

---

## Ссылки

- [AdminPlanController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Subscriptions/Http/Controllers/AdminPlanController.php)
- [AdminCompensationWithdrawalController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/CompensationBalance/AdminCompensationWithdrawalController.php)
- [AdminPromoCodeController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/PromoCodes/AdminPromoCodeController.php)
- [`_sources/01-tariffs-tz.md`](../../../_sources/01-tariffs-tz.md) — ТЗ актуальной модели тарифов.
