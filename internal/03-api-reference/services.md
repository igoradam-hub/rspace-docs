# API: Services

Каталог услуг и заказ. Префикс: `/services`. Middleware: `auth:user`.

Модуль: [Services](../02-modules/services.md).

---

## `GET /services`

Список услуг для юзера с ценами, рассчитанными по его тарифу.

**Query params:** `category_id`, `search`.

**Ответ:**
```json
{
  "data": [
    {
      "id": 17,
      "name": "Юрист на сделку",
      "category": { "id": 1, "name": "Юридические" },
      "description": "Полное сопровождение сделки купли-продажи...",
      "base_price": 2625000,
      "final_price": 1968800,
      "discount_percent": 25,
      "type": "standard",
      "region": "capital",
      "has_urgent_variant": true,
      "urgent_variant": {
        "base_price": 5250000,
        "final_price": 3937500
      }
    }
  ]
}
```

Цены — копейки.

## `GET /services/{service_id}`

Подробности одной услуги — описание, срок выполнения, что входит.

**Ответ:** расширенная версия объекта из списка.

## `POST /services/{service_id}/request`

Заказать услугу.

**Request body:**
```json
{
  "realty_id": 789,
  "type": "standard",
  "client_name": "Иван Петров",
  "client_phone": "+79150000011",
  "client_email": "ivan@example.com",
  "comment": "Нужно к пятнице",
  "payment_method_id": 7
}
```

**Поля:**
- `realty_id` — опционально, если услуга связана с конкретным объектом.
- `type` — `standard` или `urgent` (стоимость другая).
- `client_*` — данные клиента, ради которого заказ (для юриста, проверки).
- `comment` — доп. пожелания.
- `payment_method_id` — опционально (если есть сохранённая карта).

**Ответ:** `201 Created`
```json
{
  "data": {
    "request_id": 555,
    "invoice_id": 888,
    "final_price": 1968800,
    "payment_url": "https://widget.cloudpayments.ru/..."
  }
}
```

**Ошибки:**
- `400 service_not_available` — услуга не доступна для региона юзера.
- `400 subscription_required` — требуется активная подписка.
- `422` — валидация.

## `POST /services/charges/order`

Купить дополнительные charges (лимиты сверх тарифа). Пример: Премиум даёт 2 проверки объекта, вам нужна 3-я — можно докупить charge и использовать.

**Request body:**
```json
{
  "service_id": 17,
  "quantity": 1,
  "payment_method_id": 7
}
```

**Ответ:** `201` с `payment_url` → после оплаты `ServiceChargeUsage` доступен.

---

## Widget (служба через виджет)

Эти эндпоинты под `/realties/{realty_id}/widget/*` — см. [realties.md → Widget](./realties.md#widget) или [Модуль Widget](../02-modules/widget.md).

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/realties/{realty_id}/widget` | Конфигурация виджета для объекта |
| `POST` | `/realties/{realty_id}/widget/order` | Заказ нескольких услуг одним заказом |

---

## Ссылки

- [Модуль Services](../02-modules/services.md)
- [Модуль Scoring](../02-modules/scoring.md) — отдельные API для проверок.
- [ServiceController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Services/ServiceController.php)
