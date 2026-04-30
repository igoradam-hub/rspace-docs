# Модуль: Identity

> **Домен:** Identity (регистрация, аутентификация, профиль, Telegram-привязка)
> **Репозиторий:** `rspase/project/backend`
> **Путь:** `backend/app/Identity/` + `backend/app/Http/Controllers/Auth/` + `backend/app/Http/Controllers/Profile/`
> **Ветка prod:** `dev`
> **Статус:** production

## Назначение

Все, что связано с личностью пользователя: регистрация по SMS, вход, токены доступа (Laravel Sanctum), сброс пароля, управление профилем, привязка Telegram-аккаунта. Смежный модуль — `Onboarding` (чек-лист после регистрации).

## Ключевые сущности

| Модель | Путь | Описание |
|---|---|---|
| `User` | `app/Identity/Models/User.php` | Основная модель агента. Extends `Authenticatable`, HasApiTokens (Sanctum), HasMedia (Spatie), HasUuids, HasFactory |
| `UserTelegramInfo` | `app/Identity/Models/UserTelegramInfo.php` | Связка User ↔ Telegram chat_id, username |
| `Inn`, `PassportSeries`, `PassportNumber`, `PassportDepartmentCode` | `app/Identity/Models/` | Value-объекты для валидации паспорта и ИНН (для бизнес-аккаунта и услуг) |

### Поля модели `User`

```
id                       bigint    PK
external_key             string    ключ для внешней идентификации
active                   bool      деактивация (soft) — деактивированный не может войти
phone                    string    основной ключ входа (E.164)
phone_verified_at        ts|null   время подтверждения телефона
password                 string    bcrypt
curator_id               int|null  → admins.id (закреплённый менеджер RSpace)
referred_by_id           int|null  → users.id (кто пригласил)
email                    string?
country, city            string?   адрес (для города публикации — Столица/Регионы)
fake_phone               string?   публичный номер для объявлений (скрывает реальный)
first_name, last_name, patronymic   string?
gender                   enum Gender
balance                  int       внутренний баланс (копейки)
compensation_balance     int       баланс комиссий от банков/страховщиков (копейки)
last_active_at           ts?
utm_source / medium /
  campaign / term / content  string?   маркетинговая атрибуция на момент регистрации
telegram_chat_id         string?   (в UserTelegramInfo)
telegram_username        string?   (там же)
created_at / updated_at  ts
```

### Связи

- `hasMany` → `Subscription` (`subscriptions`)
- `hasOne` → `Subscription` (`activeSubscription` — текущая активная)
- `hasMany` → `PaymentMethod` — сохранённые карты CloudPayments
- `hasMany` → `PromoCodeActivation`
- `hasOne` → `PromoCodeActivation` (`active_promo_code`)
- `hasMany` → `Realty` (`published_realties` — объекты, с которыми агент работает)
- `belongsTo` → `Admin` (`curator`)
- `belongsTo` → `User` (`referredBy`)
- `hasMany` → `AdminComment` — комментарии админов про юзера
- `hasMany` → `Media` (Spatie — аватар)

### Константы имён (выдержка)

Модель определяет все имена колонок как константы (`COL_PHONE`, `COL_BALANCE`, …) — используем их в запросах вместо магических строк. Аналогично для связей (`REL_SUBSCRIPTIONS`, `REL_ACTIVE_SUBSCRIPTION`, …).

## API-эндпоинты

### Auth (публичные, без токена)

Все живут под префиксом `/auth`. Controller: `app/Http/Controllers/Auth/AuthController.php`.

| Метод | URL | Throttle | Описание |
|---|---|---|---|
| GET | `/auth/check` | — | Проверка валидности токена (если токен передан в header) |
| POST | `/auth/register/send-code` | `register_sms_code` (1 req / 90 сек) | Отправляет SMS с 4-значным кодом для регистрации. TTL кода — 5 минут. |
| POST | `/auth/register` | — | Регистрация. Создаёт `User`, возвращает его ресурс (201). |
| POST | `/auth/login` | `login` | Вход. Возвращает `AccessToken` (Sanctum). |
| POST | `/auth/reset-password/send-code` | `reset_password_sms_code` | SMS-код для восстановления пароля |
| POST | `/auth/reset-password` | `reset_password` (5/мин) | Смена пароля через код |

### Auth (для авторизованных)

Middleware: `auth:user` (Sanctum user-guard).

| Метод | URL | Описание |
|---|---|---|
| POST | `/auth/logout` | Удаляет текущий токен (тот, которым юзер авторизовался) |
| POST | `/auth/logout/all` | Удаляет все токены пользователя |

### Profile

Controller: `app/Http/Controllers/Profile/ProfileController.php` + `app/Identity/Http/Controllers/ProfileTelegramController.php`.

Все под `auth:user`:

| Метод | URL | Описание |
|---|---|---|
| GET | `/profile` | Текущий профиль пользователя |
| PATCH | `/profile` | Частичное обновление профиля (имя, email, город, ...) |
| POST | `/profile/avatar` | Загрузка аватара (multipart) |
| POST | `/profile/change-password` (throttle 5/мин) | Смена пароля (старый + новый) |
| POST | `/profile/deactivate` | Деактивировать аккаунт (soft: `active=false`) |
| POST | `/profile/telegram/generate-link` | Генерирует deeplink `t.me/rspace_bot?start=<token>` для привязки |
| POST | `/profile/telegram/unbind` | Отвязать Telegram |

## Сервисы и бизнес-логика

### `UserService`

**Путь:** `app/Services/Users/UserService.php` (живёт в общей папке `app/Services/`, а не внутри `app/Identity/` — хотя домен у него identity-ный).

**Точки входа:**
- `registerUser(RegisterUserDto $dto): User` — основной метод. Проверяет код верификации через `VerificationCodeService`, создаёт пользователя, пишет UTM, запускает `UserRegistered` event.

**DTO:** `app/Services/Users/RegisterUserDto.php` — содержит phone, password, verificationCode, name, refId, utm_*.

### `VerificationCodeService`

**Путь:** `app/Services/Verification/VerificationCodeService.php`.

**Методы:**
- `new(string $for, Carbon $expireAt, string $action): string` — генерирует 4-значный код, сохраняет в БД, возвращает для отправки.
- `verify(string $code, string $for, string $action): bool` — валидирует код; одноразовый.

**Actions:** `'register'`, `'password_reset'`. Action изолирует коды: код регистрации не подойдёт для сброса пароля.

### `TelegramBindingService` (интерфейс)

**Имплементация:** `DefaultTelegramBindingService` (`app/Identity/Services/`).

**Что делает:**
- Генерирует deeplink с одноразовым токеном.
- При приходе `/start <token>` в Telegram-бот (через webhook) находит юзера по токену и сохраняет `chat_id`, `username`.
- Listener `BindTelegramChat` обрабатывает событие от webhook'а.

## События и очереди

### События (Laravel Events)

- `UserProfileUpdated` (`app/Identity/Events/UserProfileUpdated.php`) — выстреливает после `PATCH /profile`.
- `UserRegistered` (`app/Events/Users/UserRegistered.php`) — выстреливается в `UserService::registerUser`. Listener `DispatchUserRegistered` (`app/AmoCrm/Listeners/DispatchUserRegistered.php`) отправляет в AmoCRM.

### Listeners

- `BindTelegramChat` — слушает Telegram-webhook event, привязывает `chat_id` к юзеру.

### Notifications

- `CodeForRegister` — SMS с кодом регистрации. `toSms` channel.
- `CodeForPasswordReset` — SMS с кодом сброса.
- `TelegramUnbindedNotification` — сообщение в Telegram при unbind.

### Jobs

Специфичных для Identity Job'ов сейчас нет — регистрация и вход работают синхронно. Email-нотификации (welcome, etc) — см. Notifications раздел (Волна 5).

## Интеграции

- **SMS-провайдер** — `app/Sms/` использует **sms.ru** (`SmsRuClient.php`, `SmsRuDriver.php`). Параллельно есть `LogsSmsDriver` для локальной разработки (пишет в лог вместо отправки). Выбор драйвера — через конфиг. Подробнее — [05-integrations/sms.md](../05-integrations/sms.md).
- **Telegram Bot API** — `irazasyed/telegram-bot-sdk: ^3.15`. См. [05-integrations/telegram.md](../05-integrations/telegram.md).
- **PostHog** — в `composer.json` зависимость `posthog/posthog-php: ^4.0` присутствует, однако на 2026-04-23 код-база не содержит ни одного явного вызова PostHog-клиента для identity-событий. Значит регистрация/login в PostHog **не трекается серверно** — только на фронте через JS SDK. Если нужен серверный event — это tech-debt.
- **AmoCRM** — регистрация → webhook/event-dispatch → AmoCRM Lead. См. [05-integrations/amocrm.md](../05-integrations/amocrm.md) (Волна 4).

## Авторизация и токены

**Механизм:** Laravel Sanctum, `HasApiTokens` trait.

**Типы токенов:**
- User-токены выдаются методом `$user->createToken($device, expiresAt)`.
- TTL: `1 день` (обычный вход) или `1 месяц` (`rememberMe: true`).
- Хранятся в `personal_access_tokens`, поддерживают abilities (пока не используем).

**Guards:**
- `user` — guard для обычных пользователей (Sanctum PersonalAccessToken → `users.id`).
- `admin` — отдельный guard для админов (см. [06-admin.md](../06-admin.md)).

**Middleware:** `auth:user`, `auth:admin`, комбо `auth:user,admin` (например, proxy Dadata).

## Валидация

Custom-Rule'ы в `app/Identity/Rules/`:
- `InnRule` — ИНН (10 или 12 цифр + контрольная сумма)
- `PassportSeriesRule` — серия паспорта РФ (4 цифры)
- `PassportNumberRule` — номер паспорта (6 цифр)
- `PassportDepartmentCodeRule` — код подразделения (`NNN-NNN`)

Эти value-объекты используются в Request-классах и формах (подготовка документов для ДКП, скоринги).

## Frontend-привязка

| Страница кабинета | URL frontend | Использует |
|---|---|---|
| Регистрация | `/registration` | POST `/auth/register/send-code` → `/auth/register` |
| Вход | `/login` | POST `/auth/login` |
| Восстановление | `/reset` | POST `/auth/reset-password/send-code` → `/auth/reset-password` |
| Профиль | `/my/profile` | GET/PATCH `/profile`, POST `/profile/avatar` |
| Привязка Telegram | `/my/profile` (кнопка) | POST `/profile/telegram/generate-link` |

Все запросы — через общий axios-инстанс, токен в localStorage.

## Rate Limits и безопасность

- **Регистрация SMS**: `register_sms_code` — 1 запрос в 90 секунд (защита от спама по одному телефону).
- **Login**: `login` — 5 попыток в минуту по IP/phone.
- **Reset-password**: `reset_password_sms_code` + `reset_password` — по 5/мин.
- **Change-password**: `throttle:5,1` — 5 в минуту.
- **Sanctum ensure**: токены невалидны после deactivate (`active=false`).

## Known issues

- **SMS-провайдер** — **sms.ru** (подтверждено кодом `app/Sms/Clients/SmsRuClient.php`). Нужна проверка, что credentials для sms.ru присутствуют в `.env.example`.
- `UserRegistered` event-flow → PostHog → AmoCRM — нужна end-to-end проверка на проде (из памяти проекта: UTM-данные сохраняются в `users.utm_*`, но клиентская часть landing их не всегда передаёт).
- Backend-PostHog (`posthog-php`) настроен, но события отправляются не для всех критичных действий — проверка открыта.
- `curator_id` и `referred_by_id` заполняются не всегда — curator автоматически по регионам, referral — только если передан `refId`.

## Связанные разделы

- [03. API Reference — Auth](../03-api-reference/auth.md) — полные примеры запросов с payload'ами.
- [03. API Reference — Profile](../03-api-reference/profile.md)
- [02-modules/onboarding.md](./onboarding.md) — прогресс после регистрации (Волна 2, кратко).
- [05-integrations/telegram.md](../05-integrations/telegram.md) — детали Telegram-интеграции (Волна 5).
- [12. Инфраструктура](../12-infrastructure.md) — SMS-провайдер, секреты.

## Ссылки GitLab

- [AuthController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Auth/AuthController.php)
- [User.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Identity/Models/User.php)
- [ProfileController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Profile/ProfileController.php)
- [IdentityServiceProvider.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Identity/IdentityServiceProvider.php)
