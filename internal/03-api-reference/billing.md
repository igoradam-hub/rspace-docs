# API: Billing

Финансовые эндпоинты — баланс, комиссии, платёжные методы, промокоды, CloudPayments-история. Префикс: `/billing`. Middleware: `auth:user`.

Модуль: [Billing](../02-modules/billing.md).
Интеграция: [CloudPayments](../05-integrations/cloudpayments.md).

---

## Внутренний баланс

### `POST /billing/balance/deposit`

Пополнить внутренний баланс. Создаёт `BalanceDeposit` + `Invoice` + `CPInvoicePayment`, возвращает payment_url.

**Request body:**
```json
{
  "amount": 500000,
  "payment_method_id": 7
}
```
`amount` — в копейках. `payment_method_id` опциональный (если не передан, создаётся новая авторизация).

**Ответ:** `200 OK`
```json
{
  "data": {
    "invoice_id": 234,
    "payment_url": "https://widget.cloudpayments.ru/..."
  }
}
```

### `GET /billing/balance/transactions`

История операций по внутреннему балансу.

**Query params:** `page`, `per_page`, `from`, `to`.

**Ответ:**
```json
{
  "data": [
    {
      "id": 567,
      "type": "deposit",
      "amount": 500000,
      "balance_after": 500000,
      "description": "Пополнение через CloudPayments",
      "created_at": "2026-04-22T14:35:00Z"
    },
    {
      "id": 568,
      "type": "charge",
      "amount": -99900,
      "balance_after": 400100,
      "description": "Промо XL на Avito (objet 789)",
      "created_at": "2026-04-22T15:02:00Z"
    }
  ],
  "meta": { ... }
}
```

**`type`:** `deposit` / `charge` / `refund`.

---

## Комиссионный баланс

### `GET /billing/compensation-balance/transactions`

История начислений/списаний комиссий.

**Ответ:** аналогично balance/transactions, но `type` могут быть `accrual` (начисление от партнёра), `withdrawal` (вывод), `transfer` (перевод на внутренний баланс).

---

## Вывод комиссий

### `GET /billing/compensation-withdrawals`

Список запросов на вывод юзера.

**Ответ:**
```json
{
  "data": [
    {
      "id": 89,
      "recipient_type": "card",
      "amount": 90000,
      "status": "completed",
      "created_at": "2026-04-20T10:00:00Z",
      "completed_at": "2026-04-22T16:30:00Z"
    }
  ]
}
```

**`recipient_type`:** `balance` / `card` / `bank_account`.
**`status`:** `pending` / `started` / `completed` / `rejected`.

### `POST /billing/compensation-withdrawals`

Создать запрос на вывод.

**Request body:**
```json
{
  "recipient_type": "card",
  "amount": 90000,
  "details": {
    "card_number": "2200123412341234",
    "card_holder": "IVAN IVANOV"
  }
}
```

Для `bank_account`:
```json
{
  "recipient_type": "bank_account",
  "amount": 90000,
  "details": {
    "bik": "044525225",
    "account_number": "40817810099910004312",
    "inn": "7712345678",
    "recipient_name": "ООО РСпейс"
  }
}
```

Для `balance`:
```json
{
  "recipient_type": "balance",
  "amount": 90000
}
```

**Ответ:** `201 Created` с созданным `CompensationWithdrawal`.

**Ошибки:**
- `400` `insufficient_funds` — на комиссионном балансе нет такой суммы.
- `400` `invalid_recipient_details` — некорректные реквизиты.
- `422` — валидация.

### `GET /billing/compensation-withdrawals/recipient-details`

Шаблоны/подсказки реквизитов (если где-то сохранены предыдущие выводы) — удобство для UI.

---

## Счета

### `GET /billing/invoices`

Список счетов (invoices) юзера.

**Query params:** `status` (`open` / `paid` / `cancelled` / `expired`), `page`.

**Ответ:**
```json
{
  "data": [
    {
      "id": 234,
      "status": "paid",
      "final_amount": 500000,
      "currency": "RUB",
      "invoiceable_type": "BalanceDeposit",
      "invoiceable_id": 56,
      "created_at": "2026-04-22T14:35:00Z",
      "paid_at": "2026-04-22T14:36:15Z"
    }
  ]
}
```

`invoiceable_type` — полиморфная связь: `Subscription`, `BalanceDeposit`, `ServiceRequest`, `WidgetOrder`, `AvitoPromotionOrder`, и т.д.

---

## Платёжные методы (сохранённые карты)

### `GET /billing/payment_methods`

Список сохранённых карт.

**Ответ:**
```json
{
  "data": [
    {
      "id": 7,
      "brand": "mir",
      "last4": "1234",
      "expiry": "12/28",
      "is_default": true,
      "created_at": "2026-03-24T12:15:00Z"
    }
  ]
}
```

### `POST /billing/payment_methods/authorize`

Запустить авторизацию новой карты. Backend создаёт `CPInvoicePayment(type=Auth, amount=100)` и возвращает payment_url.

**Request body:** опциональный `redirect_url` (куда вернуть пользователя после успеха).

**Ответ:**
```json
{
  "data": {
    "authorization_id": 42,
    "payment_url": "https://widget.cloudpayments.ru/..."
  }
}
```

Flow:
1. Юзер идёт на CP, вводит карту, проходит 3DS.
2. CP блокирует 1 ₽ (не списывает).
3. Webhook `/webhook/cloud-payments/pay` с `Token` создаёт `PaymentMethod`.
4. CP автоматически разблокирует 1 ₽ через 3-5 дней.

### `DELETE /billing/payment_methods/{payment_method_id}`

Удалить карту.

**Ответ:** `204 No Content`.

**Ошибки:**
- `400 payment_method_in_use` — к карте привязано активное автосписание подписки.

---

## CloudPayments история

### `GET /billing/payments/cloud-payments`

История всех CP-платежей (успешных и неуспешных).

**Ответ:**
```json
{
  "data": [
    {
      "id": 123,
      "transaction_id": "987654321",
      "invoice_id": 234,
      "type": "Charge",
      "status": "paid",
      "amount": 500000,
      "currency": "RUB",
      "card_brand": "mir",
      "card_last4": "1234",
      "fail_code": null,
      "created_at": "2026-04-22T14:36:00Z"
    },
    {
      "id": 124,
      "status": "failed",
      "fail_code": "insufficient_funds",
      "amount": 900000,
      "created_at": "2026-04-15T10:15:00Z"
    }
  ]
}
```

---

## Промокоды

### `POST /billing/promo-codes/activate`

Активировать промокод.

**Request body:**
```json
{ "code": "SPRING2026" }
```

**Ответ:** `200 OK`
```json
{
  "data": {
    "promo_code": {
      "code": "SPRING2026",
      "discount_percent": 15,
      "valid_until": "2026-05-31T23:59:59Z"
    }
  }
}
```

**Ошибки:**
- `400 promo_code_not_found`
- `400 promo_code_expired`
- `400 promo_code_already_used`
- `400 promo_code_limit_exceeded`

### `GET /billing/promo-codes/active`

Текущий активированный промокод (если есть).

**Ответ:**
```json
{
  "data": {
    "code": "SPRING2026",
    "discount_percent": 15,
    "expires_at": "2026-05-31T23:59:59Z"
  }
}
```
или `data: null` если активного нет.

---

## Webhooks

См. [webhooks.md](./webhooks.md) (Волна 5) для полного описания.

| URL | Источник |
|---|---|
| `POST /webhook/cloud-payments/check` | CloudPayments pre-check |
| `POST /webhook/cloud-payments/pay` | CloudPayments успех |
| `POST /webhook/cloud-payments/fail` | CloudPayments неудача |

---

## Коды ошибок (специфичные для Billing)

- `400 insufficient_funds` — недостаточно на балансе.
- `400 invalid_recipient_details` — некорректные реквизиты вывода.
- `400 payment_method_in_use` — карта привязана к автосписанию.
- `400 promo_code_*` — проблемы с промокодом.

---

## Ссылки

- [Модуль Billing](../02-modules/billing.md)
- [Интеграция CloudPayments](../05-integrations/cloudpayments.md)
- [BalanceController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/Balance/BalanceController.php)
- [CompensationWithdrawalController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/CompensationBalance/CompensationWithdrawalController.php)
- [PaymentMethodController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/PaymentMethod/PaymentMethodController.php)
- [PromoCodeController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Billing/PromoCodes/PromoCodeController.php)
