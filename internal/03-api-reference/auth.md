# API: Auth

Регистрация, вход, выход, сброс пароля. Префикс: `/auth`.

Модуль: [Identity](../02-modules/identity.md).

---

## `GET /auth/check`

Проверка токена. Не требует аутентификации, но принимает `Authorization` header опционально.

**Ответ:** `200 OK` (токен валиден) или пустое тело, если нет.

---

## `POST /auth/register/send-code`

Отправить SMS с 4-значным кодом для подтверждения регистрации.

**Throttle:** `register_sms_code` — 1 запрос в 90 секунд **по IP клиента** (не по номеру телефона). Юзеры за одним NAT/публичным IP делят лимит.

**Request body:**
```json
{
  "phone": "+79123456789"
}
```

**Ответ:**
- `200 OK` — код отправлен, живёт 5 минут.
- `422` — невалидный телефон.
- `429` — лимит превышен.

**Пример:**
```bash
curl -X POST https://api.rspace.pro/auth/register/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79123456789"}'
```

---

## `POST /auth/register`

Регистрация нового агента. Требует предварительно запрошенный SMS-код.

**Request body:**
```json
{
  "phone": "+79123456789",
  "password": "SecurePassword123",
  "verification_code": "4829",
  "name": "Анна",
  "ref_id": null,
  "utm_source": "yandex",
  "utm_medium": "cpc",
  "utm_campaign": "realtor_moscow_apr26",
  "utm_term": null,
  "utm_content": null
}
```

**Поля:**
| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `phone` | string E.164 | да | Телефон, на который отправлен код |
| `password` | string | да | Пароль (минимум 8 символов, правила — см. `RegisterRequest`) |
| `verification_code` | string (4 цифры) | да | Код из SMS |
| `name` | string | да | Имя пользователя |
| `ref_id` | int \| null | нет | ID пригласившего (`users.id`) |
| `utm_source` / `utm_medium` / `utm_campaign` / `utm_term` / `utm_content` | string | нет | UTM-метки на момент регистрации (сохраняются в `users.utm_*`) |

**Ответ:** `201 Created`

```json
{
  "data": {
    "id": 123,
    "external_key": "usr_abc...",
    "phone": "+79123456789",
    "first_name": "Анна",
    "active": true,
    "balance": 0,
    "compensation_balance": 0,
    "created_at": "2026-04-23T15:00:00Z"
  }
}
```

**Ошибки:**
- `400 BadRequest` с `error_code`:
  - `phone_already_in_use` — телефон уже зарегистрирован.
  - `incorrect_verification_code` — код неверный или истёк.
- `422` — валидация (неверный формат, короткий пароль).

---

## `POST /auth/login`

Вход по телефону и паролю.

**Throttle:** `login` — 5 попыток в минуту.

**Request body:**
```json
{
  "phone": "+79123456789",
  "password": "SecurePassword123",
  "device": "iPhone 15, Safari",
  "remember_me": false
}
```

**Поля:**
- `device` — описание клиента, попадёт в `name` токена.
- `remember_me` — если `true`, токен живёт 30 дней; иначе — 1 день.

**Ответ:** `200 OK`
```json
{
  "data": {
    "access_token": "1|abcdefghij...",
    "expires_at": "2026-04-24T15:00:00Z"
  }
}
```

**Ошибки:**
- `401` — неверный телефон или пароль.
- `400` `user_inactive` — аккаунт деактивирован.
- `422` — валидация.
- `429` — лимит попыток.

**Пример:**
```bash
curl -X POST https://api.rspace.pro/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79123456789",
    "password": "SecurePassword123",
    "device": "MacBook Pro, Chrome"
  }'
```

---

## `POST /auth/logout`

Удаляет текущий токен (тот, которым юзер авторизовался).

**Middleware:** `auth:user`.

**Ответ:** `200 OK` с пустым телом.

---

## `POST /auth/logout/all`

Удаляет **все** токены пользователя (выход из всех устройств).

**Middleware:** `auth:user`.

**Ответ:** `200 OK` с пустым телом.

---

## `POST /auth/reset-password/send-code`

Отправить SMS-код для восстановления пароля.

**Throttle:** `reset_password_sms_code` — 1/90сек.

**Request body:**
```json
{ "phone": "+79123456789" }
```

**Ответ:** `200 OK`. Если телефон не зарегистрирован — тоже `200 OK` (не раскрываем существование юзера).

---

## `POST /auth/reset-password`

Сбросить пароль через SMS-код.

**Throttle:** `reset_password` — 5/мин.

**Request body:**
```json
{
  "phone": "+79123456789",
  "verification_code": "7392",
  "password": "NewSecurePassword123"
}
```

**Ответ:** `200 OK` с пустым телом.

**Ошибки:**
- `403` — неверный телефон или код. **Внимание**: единый код ошибки для обеих ситуаций — не раскрываем, какой именно фактор не прошёл.
- `422` — валидация.
- `429` — лимит.

---

## Безопасность

- Все `/auth/*/send-code` — **строгий throttle по IP** (1 запрос/90 сек). Юзеры за одним NAT/корпоративным IP делят лимит.
- **`POST /auth/register` сам по себе НЕ throttled** — только этап SMS-кода (`/auth/register/send-code`). Это design choice; даёт теоретическую возможность брутфорса 4-значного кода (10000 попыток за раз). Если решим закрыть — добавить `RateLimiter::for('register', ...)` и `->middleware('throttle:register')` на роут.
- Коды верификации — **одноразовые**, TTL 5 минут, изолированы по `action` (`register` ≠ `password_reset`). Хешированы через `Hash::make`, верификация через `Hash::check` в цикле.
- Логи не содержат пароли и коды.
- Деактивированные пользователи (`active=false`) получают `400 user_inactive` на `/login`.
- **Test backdoor:** при `APP_DEBUG=true` доступен `POST /test/auth/login/{user_id}` — выдаёт токен любому юзеру без пароля. **Прод обязан иметь `APP_DEBUG=false`.**

## OpenAPI

Все эндпоинты аннотированы через `#[OA\Post(...)]` в [AuthController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Auth/AuthController.php).
