# API: Profile

Управление профилем пользователя, аватар, Telegram-привязка. Префикс: `/profile`. Middleware: `auth:user`.

Модуль: [Identity](../02-modules/identity.md).

---

## `GET /profile`

Получить текущий профиль пользователя.

**Ответ:** `200 OK`
```json
{
  "data": {
    "id": 123,
    "external_key": "usr_abc...",
    "phone": "+79123456789",
    "fake_phone": "+79001234567",
    "first_name": "Анна",
    "last_name": "Иванова",
    "patronymic": "Петровна",
    "email": "anna@example.com",
    "country": "Россия",
    "city": "Москва",
    "gender": "female",
    "balance": 0,
    "compensation_balance": 15000,
    "avatar": {
      "url": "https://s3.rspace.pro/avatars/abc-def.jpg",
      "thumb": "https://s3.rspace.pro/avatars/abc-def-thumb.jpg"
    },
    "telegram": {
      "chat_id": "123456789",
      "username": "anna_realtor"
    },
    "active_subscription": {
      "id": 45,
      "plan": { "name": "Премиум", "level": "premium" },
      "ends_at": "2026-05-23T00:00:00Z",
      "status": "active"
    }
  }
}
```

---

## `PATCH /profile`

Частичное обновление профиля (передаются только изменяемые поля).

**Request body (все поля опциональны):**
```json
{
  "first_name": "Анна",
  "last_name": "Иванова",
  "patronymic": "Петровна",
  "email": "anna@example.com",
  "country": "Россия",
  "city": "Санкт-Петербург",
  "gender": "female",
  "fake_phone": "+79001234567"
}
```

**Поле `city`** влияет на регион (Столица / Регионы) для расчёта цен.
**Поле `fake_phone`** — публичный номер для объявлений (если агент не хочет палить основной).

**Ответ:** `200 OK` с обновлённым ресурсом.

**Ошибки:**
- `422` — валидация (неверный email, телефон и т.д.).

После успеха выстреливает event `UserProfileUpdated`.

---

## `POST /profile/avatar`

Загрузить или обновить аватар.

**Content-Type:** `multipart/form-data`

**Fields:**
- `file` — изображение (JPEG/PNG, до ~5 MB — точный лимит в `AvatarRequest`)

**Ответ:** `200 OK`
```json
{
  "data": {
    "avatar": {
      "url": "https://s3.rspace.pro/avatars/abc-def.jpg",
      "thumb": "https://s3.rspace.pro/avatars/abc-def-thumb.jpg"
    }
  }
}
```

Хранение — Spatie Media Library → AWS S3. Старый аватар автоматически удаляется.

**Пример:**
```bash
curl -X POST https://api.rspace.pro/profile/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/avatar.jpg"
```

---

## `POST /profile/change-password`

Смена пароля.

**Throttle:** `5,1` — 5 запросов в минуту.

**Request body:**
```json
{
  "current_password": "SecurePassword123",
  "password": "NewSecurePassword456",
  "password_confirmation": "NewSecurePassword456"
}
```

**Ответ:** `200 OK` с пустым телом.

**Ошибки:**
- `422` — `current_password` не совпал, или новый пароль не соответствует правилам.
- `429` — лимит.

---

## `POST /profile/deactivate`

Деактивировать аккаунт (soft — `active=false`). Данные сохраняются, но войти больше нельзя.

**Request body:** может содержать причину (`reason: string`) — TBD.

**Ответ:** `200 OK`.

**Эффекты:**
- Подписка ставится в `pending_cancel` (дорабатывает период).
- Все токены удаляются.
- Telegram-привязка удаляется.

---

## `POST /profile/telegram/generate-link`

Генерирует deeplink для привязки Telegram-бота. Юзер открывает ссылку → Telegram → бот привязывается к аккаунту.

**Ответ:** `200 OK`
```json
{
  "data": {
    "link": "https://t.me/rspace_bot?start=abcdefghijklmnop",
    "expires_at": "2026-04-23T15:30:00Z"
  }
}
```

Токен в deeplink одноразовый, TTL — несколько минут.

---

## `POST /profile/telegram/unbind`

Отвязать Telegram-бот.

**Ответ:** `200 OK` с пустым телом.

**Эффект:**
- `UserTelegramInfo` удаляется.
- Юзер получает finalize-сообщение в Telegram (`TelegramUnbindedNotification`).
- Дальнейшие уведомления через бота не приходят.

---

## Связанные эндпоинты

- [auth.md](./auth.md) — вход и выход.
- [subscription.md](./subscription.md) — информация о подписке (встроена в `/profile` как `active_subscription`).
