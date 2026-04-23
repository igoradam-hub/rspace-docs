# API: Leads

Входящие лиды. Префикс: `/leads`. Middleware: `auth:user`.

Модуль: [Leads](../02-modules/leads.md).

---

## `GET /leads`

Список лидов, назначенных текущему пользователю.

**Query params:**
- `page`, `per_page`
- `source` (`avito`, `cian`, `jivo`)
- `status` (обычно `applied`, т.к. юзер видит только свои)

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
  "meta": { "current_page": 1, "total": 7 }
}
```

**Поля:**
- `phone` — единственное обязательное (лид без телефона не создаётся).
- `full_name` — если клиент представился в чате или на Jivo.
- `residental_complex` — ЖК, если упомянут (используется для новостроек, устаревшее поле).
- `source` — ключ источника.
- `status` — `available` (в общем пуле) или `applied` (назначен).

## Webhooks лидов (inbound, без `auth`)

Приходят от внешних источников:

- `POST /webhook/jivo/3752813899114971` — чат-сообщения от JivoSite (см. [webhooks.md](./webhooks.md) — Волна 5).
- `POST /webhook/telegram/{token}` — сообщения в бот (не напрямую лиды, но могут конвертироваться).

## Admin эндпоинты

Префикс: `/admin/leads`. Middleware: `auth:admin`.

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/leads` | Все лиды (пул + назначенные) |
| `POST` | `/admin/leads/bulk-assign` | Массовое назначение |
| `POST` | `/admin/leads/sync` | Принудительная синхронизация с площадок |

Детали — [admin/leads.md](./admin/services-scorings.md) (Волна 7).

## Источники (`source`)

| `source` | Откуда приходит |
|---|---|
| `avito` | Звонок или сообщение с Avito-объявления |
| `cian` | Звонок или сообщение с ЦИАН |
| `jivo` | Чат JivoSite (на сайте или в ЛК) |
| `direct` (TBD) | Форма связаться на public-offer |
| `referral` (TBD) | Реферальная программа |

## Ошибки

- `403` — попытка получить чужой лид.
- `404` — лид не найден.

## Ссылки

- [Модуль Leads](../02-modules/leads.md)
- [LeadController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Leads/Http/Controllers/LeadController.php)
- [Интеграции Avito / CIAN / Jivo](../05-integrations/)
