# API: Publishings

Публикации объектов на классифайдах. Префикс: `/publishings`. Middleware: `auth:user`.

Модуль: [Publishings](../02-modules/publishings.md).
Интеграции: [Avito](../05-integrations/avito.md), [CIAN](../05-integrations/cian.md), [ДомКлик](../05-integrations/domclick.md).

---

## Общие эндпоинты

### `GET /publishings`

Список публикаций юзера.

**Query params:** `page`, `per_page`, `status`, `realty_id`, `platform` (avito/cian).

**Ответ:**
```json
{
  "data": [
    {
      "id": 123,
      "realty": { "id": 789, "type": "apartment", "address": "Москва, ..." },
      "status": "active",
      "expires_at": "2026-05-23T00:00:00Z",
      "avito": { "status": "published", "external_id": "2891234567", "url": "https://avito.ru/...", "views": 1240, "contacts": 12 },
      "cian": { "status": "moderation", "external_id": null }
    }
  ],
  "meta": { "current_page": 1, "total": 3 }
}
```

### `POST /publishings`

Создать публикацию напрямую (обычно создаётся через `POST /realties/{realty_id}/publish`).

### `GET /publishings/{publishing_id}`

Детали одной публикации со всеми подробностями (звонки, статистика, промо).

### `PUT /publishings/{publishing_id}`

Обновить публикацию (синхронизировать изменения объекта с площадками).

### `POST /publishings/{publishing_id}/archive`

Архивировать — снять со всех площадок.

### `POST /publishings/{publishing_id}/prolong`

Продлить срок размещения (после `expires_at`).

### `PATCH /publishings/{publishing_id}/external-id`

Ручная привязка внешнего ID (если объявление создано вне RSpace, но хотим отслеживать).

**Request body:**
```json
{ "avito_external_id": "2891234567", "cian_external_id": "298765432" }
```

### `GET /publishings/charges`

Использование лимитов по подписке:
```json
{
  "data": {
    "used": 3,
    "limit": 5,
    "plan": "premium"
  }
}
```

---

## Avito-specific

### `POST /publishings/{publishing_id}/avito`

Опубликовать объект на Avito (если публикация создана без этой площадки).

### `DELETE /publishings/{publishing_id}/avito`

Снять с Avito, но оставить на других площадках.

### `GET /publishings/{publishing_id}/avito/statistics`

Статистика Avito.

**Ответ:**
```json
{
  "data": {
    "views_total": 1240,
    "views_today": 45,
    "contacts_total": 12,
    "saves_total": 8,
    "last_updated": "2026-04-23T10:00:00Z"
  }
}
```

### `GET /publishings/{publishing_id}/avito/calls`

История звонков.

**Ответ:**
```json
{
  "data": [
    {
      "id": 501,
      "caller_phone": "+79151234567",
      "started_at": "2026-04-22T14:30:00Z",
      "duration_seconds": 185,
      "recording_url": "https://s3.avito/...mp3"
    }
  ]
}
```

### `GET /publishings/{publishing_id}/avito/called-phone-numbers`

Уникальные номера позвонивших (для анализа).

### `GET /publishings/{publishing_id}/avito/promotions/order/prices`

Цены на промо-услуги Avito.

**Ответ:**
```json
{
  "data": [
    { "type": "highlight", "name": "Выделение", "price": 49900 },
    { "type": "xl", "name": "XL", "price": 99900 },
    { "type": "premium", "name": "Premium", "price": 199900 },
    { "type": "vip", "name": "VIP", "price": 399900 }
  ]
}
```
Цены — в копейках.

### `POST /publishings/{publishing_id}/avito/promotions/order`

Заказать промо-услугу (онлайн-оплата).

**Request body:**
```json
{
  "promotion_type": "xl",
  "payment_method_id": 7
}
```

**Ответ:**
```json
{
  "data": {
    "order_id": 88,
    "payment_url": "https://widget.cloudpayments.ru/..."
  }
}
```

### `POST /publishings/{publishing_id}/avito/promotions/request`

Заявка на промо (если онлайн не хочется или нужен кастомный подход). Обрабатывается админом.

---

## CIAN-specific

### `POST /publishings/{publishing_id}/cian`, `DELETE /publishings/{publishing_id}/cian`

Добавить / снять с ЦИАН.

### `GET /publishings/{publishing_id}/cian/statistics`, `/calls`, `/called-phone-numbers`

Зеркально Avito. Особенность: часть звонков — без записей (зависит от тарифа ЦИАН у RSpace).

### `POST /publishings/{publishing_id}/cian/promotions/request`

**ЦИАН поддерживает только заявку**, не онлайн-заказ. Обработка админом.

---

## Feeds (без `auth`)

См. [feeds.md](./feeds.md).

---

## Коды ошибок

- `403` — превышен лимит активных публикаций по тарифу.
- `403` — объект не принадлежит юзеру.
- `422` — объект не полностью заполнен (нет фото, адреса, цены).
- `404` — публикация не найдена.
- `409` — операция невозможна в текущем статусе (например, `archive` уже архивированной).

## Ссылки

- [Модуль Publishings](../02-modules/publishings.md)
- [PublishingController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Publishings/PublishingController.php)
