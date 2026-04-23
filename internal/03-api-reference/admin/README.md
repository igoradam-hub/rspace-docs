# Admin API Reference

Все эндпоинты под `/admin/*`, middleware: `auth:admin`. Источник правды — `backend/routes/api.php` (строки 90-439) ветки `dev`.

## Общие принципы

- **Auth**: Sanctum Bearer-токен для admin guard. Получить — через `POST /admin/auth/login`.
- **Rate limits**: на login / change-password — 5/минуту (`throttle:5,1`).
- **Формат**: JSON, UTF-8.
- **Ошибки**: `400` бизнес-ошибки с `error_code`, `401` auth, `403` доступ, `404` не найдено, `422` валидация.

## Разделы

| Раздел | URL-префикс | Файл | Endpoints |
|---|---|---|---|
| **Auth & Admins** | `/admin/auth`, `/admin/admins` | [auth-and-admins.md](./auth-and-admins.md) | ~15 |
| **Users** | `/admin/users` | [users.md](./users.md) | ~20 |
| **Plans** | `/admin/plans` | [plans-and-billing.md](./plans-and-billing.md) | ~8 |
| **Billing** | `/admin/billing` | [plans-and-billing.md](./plans-and-billing.md) | ~18 |
| **Realties** | `/admin/realties` | [realties-publishings.md](./realties-publishings.md) | ~25 |
| **Realty Prompts** | `/admin/realties/prompts` | [realties-publishings.md](./realties-publishings.md) | ~9 |
| **Publishings** | `/admin/publishings` | [realties-publishings.md](./realties-publishings.md) | ~18 |
| **Feeds** | `/admin/feeds/{type}` | [realties-publishings.md](./realties-publishings.md) | 2 |
| **Services & Charges** | `/admin/services` | [services-scorings.md](./services-scorings.md) | ~20 |
| **Scorings** | `/admin/scorings` | [services-scorings.md](./services-scorings.md) | ~8 |
| **Leads** | `/admin/leads` | [services-scorings.md](./services-scorings.md) | 3 |
| **External Balances** | `/admin/balances` | [services-scorings.md](./services-scorings.md) | 1 |

**Итого: ~130 endpoints.**

## Тестовый супер-админ

- **Имя:** Орлова И. М. (из QA-отчёта).
- **Креды:** `superadmin` + пароль (хранится в ENV разработчика, не в документации).

## Обзор админки

Дерево функций в UI и связка с API — [internal/06-admin.md](../../06-admin.md).

## Ссылки

- [routes/api.php на GitLab](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/routes/api.php)
- [../README.md](../README.md) — общий API reference (публичные эндпоинты).
