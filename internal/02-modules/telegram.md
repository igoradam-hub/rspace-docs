# Модуль: Telegram

> **Домен:** Telegram (боты RSpace — уведомления + привязка аккаунта)
> **Репозиторий:** `rspase/project/backend`
> **Путь:** `backend/app/Telegram/` + `backend/app/Identity/Http/Controllers/ProfileTelegramController.php`
> **Ветка prod:** `dev`
> **Статус:** production

## Назначение

Telegram-боты RSpace — основной канал push-уведомлений агентов. Через бота приходят новости о лидах, публикациях, платежах. Также через Telegram юзер подтверждает аккаунт (привязка `chat_id`).

Бизнес-логика и код почти полностью — в **интеграционной странице**: [../05-integrations/telegram.md](../05-integrations/telegram.md). На этой странице — краткий обзор модуля как домена.

## Ключевые сущности

| Модель | Путь | Описание |
|---|---|---|
| `TelegramChatBinding` | `app/Telegram/Models/TelegramChatBinding.php` | Привязка user_id ↔ chat_id + username + bot (enum TelegramBot) + активность |
| `UserTelegramInfo` | `app/Identity/Models/UserTelegramInfo.php` | Родственная модель в Identity-домене (читается на уровне профиля) |
| `TelegramBot` (enum) | `app/Telegram/Enums/TelegramBot.php` | Поддержка нескольких ботов одновременно (main, admin, и т.д.) |

## API-эндпоинты

**Привязка** — в домене Identity:

| Метод | URL | Middleware | Описание |
|---|---|---|---|
| `POST` | `/profile/telegram/generate-link` | `auth:user` | Генерирует deeplink для привязки |
| `POST` | `/profile/telegram/unbind` | `auth:user` | Отвязать |

**Webhook** — публичный endpoint для Telegram Bot API:

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/webhook/telegram/{token}` | Единый endpoint для всех ботов RSpace |

## События и Jobs

- **Event**: `TelegramChatBound` — после успешной привязки. Listeners могут высылать welcome-message.
- **Job**: `SendTelegramMessageJob` — асинхронная отправка сообщения (через Laravel queue).
- **Channel**: `TelegramChannel` — драйвер для Laravel Notifications. Используется через `Notification::route('telegram', chat_id)->notify(...)`.

## Используется из других модулей

- [identity.md](./identity.md) — привязка через профиль.
- [leads.md](./leads.md) — уведомления о новых лидах.
- [billing.md](./billing.md) — уведомления о платежах / автосписаниях.
- [subscriptions.md](./subscriptions.md) — уведомления за 3 дня до окончания подписки.
- [publishings.md](./publishings.md) — уведомления о модерации и отклонениях.

Каждый модуль использует `Notification::route('telegram', ...)->notify(new XxxNotification(...))`, реализация через `TelegramChannel`.

## Полное описание

Детальный разбор (webhook handling, ProxyHttpClient, мульти-бот архитектура, sequence-диаграммы привязки и отправки, лимиты, blocks handling) — в [../05-integrations/telegram.md](../05-integrations/telegram.md).

## Ссылки GitLab

- [Telegram/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Telegram)
