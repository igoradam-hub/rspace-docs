# API: Scorings

Юридические проверки (собственник / объект / комбо). Префикс: `/scorings`.

Модуль: [Scoring](../02-modules/scoring.md).

---

## `GET /scorings`

Каталог типов проверок.

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "owner",
      "name": "Проверка собственника",
      "base_price": 375000,
      "final_price": 300000,
      "discount_percent": 20,
      "estimated_days": 2
    },
    {
      "id": 2,
      "type": "realty",
      "name": "Проверка объекта",
      "base_price": 875000,
      "final_price": 700000,
      "discount_percent": 20,
      "estimated_days": 3
    },
    {
      "id": 3,
      "type": "realty_and_owner",
      "name": "Проверка объекта + собственника",
      "base_price": 1125000,
      "final_price": 900000,
      "discount_percent": 20,
      "estimated_days": 3
    }
  ]
}
```

## `GET /scorings/{scoring_id}`

Детали типа проверки.

**Ответ:** расширенная карточка типа + что именно включает (список проверяемых пунктов).

## `POST /scorings/{scoring_id}/request`

Создать заявку на проверку.

**Request body** зависит от типа:

### Проверка собственника (`type: owner`)
```json
{
  "owner_info": {
    "first_name": "Иван",
    "last_name": "Петров",
    "patronymic": "Сергеевич",
    "birth_date": "1985-03-15",
    "passport_info": {
      "series": "4521",
      "number": "123456",
      "issued_at": "2015-05-20",
      "issued_by": "ОУФМС России по г. Москве",
      "department_code": "770-123"
    },
    "inn": "771234567890"
  }
}
```

### Проверка объекта (`type: realty`)
```json
{
  "realty_info": {
    "address": "г. Москва, ул. Тверская, д. 8, кв. 45",
    "cadastral_number": "77:01:0001001:1234"
  }
}
```

### Комбо (`type: realty_and_owner`)
```json
{
  "owner_info": { ... },
  "realty_info": { ... }
}
```

**Ответ:** `201 Created`
```json
{
  "data": {
    "request_id": 777,
    "status": "created",
    "final_price": 700000
  }
}
```

## `GET /scorings/requests`

Список заявок юзера.

**Query params:** `status`, `page`.

**Ответ:**
```json
{
  "data": [
    {
      "id": 777,
      "scoring": {"id": 2, "name": "Проверка объекта"},
      "status": "finished",
      "final_price": 700000,
      "paid_at": "2026-04-22T10:00:00Z",
      "finished_at": "2026-04-23T14:30:00Z",
      "has_file": true
    }
  ]
}
```

**`status`:** `created`, `paid` / `in_progress`, `finished`, `cancelled`.

## `GET /scorings/requests/{request_id}`

Детали заявки со всеми полями.

## `POST /scorings/requests/{request_id}/pay`

Оплатить заявку (если статус `created`).

**Request body:**
```json
{ "payment_method_id": 7 }
```

**Ответ:**
```json
{
  "data": {
    "invoice_id": 999,
    "payment_url": "https://widget.cloudpayments.ru/..."
  }
}
```

После оплаты — webhook CP → `ScoringRequest.state = InProgress` → event `ScoringRequestPaid`.

**Ошибки:**
- `400 already_paid` — заявка уже оплачена.
- `400 cant_be_paid` — статус не позволяет (например, `cancelled`).

## `GET /scorings/requests/{request_id}/file`

Скачать PDF-отчёт (когда `finished`).

**Ответ:** binary PDF, `Content-Type: application/pdf`.

**Ошибки:**
- `404 file_not_ready` — статус не `finished` или файл ещё не загружен.

---

## Ошибки (enum `fail_code`)

Кроме стандартных — специфичные для Scoring:

- `scoring_request_cant_be_canceled` — заявка уже в работе / завершена.
- `scoring_request_cant_be_finished` — переход невозможен из текущего state.
- `scoring_request_cant_be_paid` — статус не позволяет оплату.

---

## Admin эндпоинты

Префикс: `/admin/scorings` + `/admin/scorings/requests`. Middleware: `auth:admin`.

- CRUD типов скоринга.
- `POST /admin/scorings/requests/{request_id}/start` — начать работу.
- `POST /admin/scorings/requests/{request_id}/cancel` — отменить + возврат.
- `POST /admin/scorings/requests/{request_id}/finish` + file — завершить, приложив PDF.
- `GET /admin/scorings/requests/{request_id}/file` — скачать отчёт.

Детали — [admin/scorings.md](./admin/services-scorings.md) (Волна 7).

---

## Ссылки

- [Модуль Scoring](../02-modules/scoring.md)
- [ScoringRequestsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Scoring/Http/Controllers/ScoringRequestsController.php)
- [ScoringsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Scoring/Http/Controllers/ScoringsController.php)
