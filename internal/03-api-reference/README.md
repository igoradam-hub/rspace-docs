# 03. API Reference

Все HTTP-эндпоинты backend-а, разбитые по разделам. Источник истины: `backend/routes/api.php` ветка `dev` + OpenAPI-аннотации `#[OA\...]` в контроллерах.

## Base URL

Production: `https://api.rspace.pro` (TBD — подтвердить у DevOps)
Dev: определяется окружением.

## Authentication

Используем **Laravel Sanctum** — Bearer-токены.

```http
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
```

Токен выдаётся через `POST /auth/login` или `POST /auth/register`. TTL: 1 день (обычный) или 1 месяц (`remember_me: true`).

Guards:
- `user` — обычные пользователи (риелторы).
- `admin` — админы (см. [admin/](./admin/)).
- Некоторые эндпоинты допускают `auth:user,admin` (например proxy к Dadata).

## Дерево эндпоинтов

### Публичные (user)

| Раздел | Префикс | Файл | Волна |
|---|---|---|---|
| **Auth** | `/auth` | [auth.md](./auth.md) | 2 ✅ |
| **Profile** | `/profile` | [profile.md](./profile.md) | 2 ✅ |
| **Realties** (объекты) | `/realties` | [realties.md](./realties.md) | 2 ✅ |
| **Publishings** (публикации) | `/publishings` | [publishings.md](./publishings.md) | 3 |
| **Leads** | `/leads` | [leads.md](./leads.md) | 3 |
| **Subscription** | `/subscription` | [subscription.md](./subscription.md) | 2 ✅ |
| **Billing** | `/billing` | [billing.md](./billing.md) | 2 (core) ✅ / 4 (детали) |
| **Services** | `/services` | [services.md](./services.md) | 5 |
| **Scorings** | `/scorings` | [scorings.md](./scorings.md) | 5 |
| **Onboarding** | `/onboarding` | [onboarding.md](./onboarding.md) | 6 |
| **Settings** | `/settings/offer` | [settings.md](./settings.md) | 6 |
| **Suggestions** | `/suggestions`, `/proxy/dadata` | [suggestions.md](./suggestions.md) | 2 ✅ |

### Feeds (outbound, публичные)

| Метод | URL | Назначение |
|---|---|---|
| `GET` | `/feed/avito` | XML/JSON feed для Avito |
| `GET` | `/feed/cian` | XML/JSON feed для CIAN |

Доступны без аутентификации (для pull со стороны площадки). Подробнее — [feeds.md](./feeds.md) (Волна 3).

### Webhooks (inbound)

Префикс: `/webhook`. Без `auth`-middleware, но защищены HMAC / секретом в URL.

| URL | Источник | Волна |
|---|---|---|
| `/webhook/cloud-payments/check` | CloudPayments (pre-check) | 4 |
| `/webhook/cloud-payments/pay` | CloudPayments (успех) | 4 |
| `/webhook/cloud-payments/fail` | CloudPayments (неудача) | 4 |
| `/webhook/jivo/{token}` | JivoSite | 5 |
| `/webhook/telegram/{token}` | Telegram Bot API | 5 |

Подробнее — [webhooks.md](./webhooks.md) (Волна 4-5).

### Admin (отдельный раздел)

Префикс: `/admin`. Middleware: `auth:admin`. ~100+ эндпоинтов.

Отдельный индекс: [admin/README.md](./admin/README.md). Заполняется в Волне 7.

## Общие соглашения

### Форматы

- **Request body** — всегда JSON, `Content-Type: application/json`, за исключением multipart (фото, файлы, аватар).
- **Response** — всегда JSON.
- **Даты** — ISO 8601 в UTC (`2026-04-23T14:30:00Z`).
- **Деньги** — целое число копеек (`15000` = 150 ₽). Проверять округление в конкретном эндпоинте.
- **Номера телефонов** — E.164 (`+79123456789`), валидация через `propaganistas/laravel-phone`.
- **UUID** — для Media (фото, документы), некоторых других сущностей.

### Коды ответов

| Код | Когда |
|---|---|
| `200` | Успех (GET, PATCH, PUT, POST обычный) |
| `201` | Created (POST для создания сущности) |
| `204` | No Content (DELETE, logout) |
| `400` | BadRequest — бизнес-ошибка. Тело содержит `message` (человеческое) и `error_code` (машинный) |
| `401` | Unauthorized — токен отсутствует/невалиден/истёк |
| `403` | Forbidden — нет прав на действие |
| `404` | Not Found — ресурс не найден или не принадлежит юзеру |
| `422` | Unprocessable Entity — валидация форм не прошла (Laravel FormRequest) |
| `429` | Too Many Requests — rate limit |
| `500` | Internal Server Error — логируется, в Sentry (если настроен) |

### Структура ошибок

`400 BadRequest`:
```json
{
  "message": "Неверный код верификации",
  "error_code": "incorrect_verification_code"
}
```

`422 Unprocessable Entity` (Laravel validation):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "phone": ["Поле phone обязательно"],
    "password": ["Пароль должен быть не короче 8 символов"]
  }
}
```

`429 Too Many Requests`:
```json
{
  "message": "Too Many Attempts."
}
```
Headers: `Retry-After: <секунды>`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

### Пагинация

Стандарт Laravel — cursor или length-aware:

```json
{
  "data": [ ... ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "per_page": 20, "total": 147, "last_page": 8 }
}
```

Параметры запроса: `?page=2`, `?per_page=20`.

### Throttle names (rate limits)

Определяются в `app/Http/Kernel.php` + `RouteServiceProvider`:

- `login` — 5/мин
- `register_sms_code` — 1/90сек
- `reset_password` — 5/мин
- `reset_password_sms_code` — 1/90сек
- `throttle:5,1` — на эндпоинтах профиля (смена пароля) — 5/мин

## OpenAPI / Swagger

Backend использует `zircote/swagger-php` (OpenAPI 3) — аннотации вшиты в контроллеры:

```php
#[OA\Post(
    path: '/auth/register',
    summary: 'Регистрация пользователя',
    requestBody: new OA\RequestBody(...),
    tags: ['Auth'],
    responses: [...]
)]
public function register(RegisterRequest $request, UserService $userService) { ... }
```

Артефакт (`swagger.json`) генерируется командой artisan. Frontend подтягивает его скриптом `yarn fetch-swagger` и генерирует TypeScript-типы.

Для быстрого взгляда — запустить локально `php artisan scribe:generate` (если включён Scribe) и открыть `/docs`.

## Как читать страницы эндпоинтов

Для каждого эндпоинта:
- **Метод + URL** — сигнатура.
- **Middleware** — `auth:user` / `auth:admin` / нет.
- **Throttle** — если есть.
- **Request body** — схема JSON с описанием полей.
- **Response** — пример успеха и возможные ошибки.
- **Коды ошибок** — `error_code` и что они означают.
- **Примеры** — `curl` или полная HTTP-пара.

## Ссылки

- [routes/api.php на GitLab](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/routes/api.php) — источник правды.
- [OpenAPI-definitions в контроллерах](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Http/Controllers) — inline.
- [02-modules/](../02-modules/) — модули с бизнес-логикой.
