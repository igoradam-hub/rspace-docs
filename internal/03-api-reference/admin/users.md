# Admin API: Users

Управление пользователями. Префикс: `/admin/users`. Middleware: `auth:admin`.
Controllers: `UserController`, `UserCommentsController`, `UserFileController`, `AdminSubscriptionController`, `AdminPublishingsController` (для подсчёта публикаций юзера).

## Список и поиск

### `GET /admin/users`
Список всех пользователей с фильтрами.

**Query params:**
- `page`, `per_page`
- `search` (по телефону, имени, email)
- `has_subscription` (bool)
- `subscription_level` (`trial`, `professional`, `premium`, `ultima`, `enterprise`)
- `curator_id` (фильтр по менеджеру)
- `city`, `created_from`, `created_to`
- `sort_by`, `sort_order`

### `GET /admin/users/csv`
Экспорт всех пользователей в CSV. Возвращает файл.

### `GET /admin/users/possible-curators`
Список активных менеджеров для UI-селекторов (кому можно назначить юзера).

## Работа с одним пользователем

Все под `/admin/users/{user_id}`.

### `GET /admin/users/{user_id}`
Полный профиль юзера — все поля User + активная подписка + привязки (Telegram, carts).

### `PUT /admin/users/{user_id}`
Обновить профиль (имя, email, город, curator_id, и т.д.).

**Request body** — поля User, которые разрешены админу.

### `POST /admin/users/{user_id}/activate`
Активировать (снять деактивацию).

### `POST /admin/users/{user_id}/deactivate`
Деактивировать (soft).

### `POST /admin/users/{user_id}/avatar`
Загрузить аватар от имени юзера. `multipart/form-data`, `file`.

## Баланс (ручное управление)

### `POST /admin/users/{user_id}/balance/increment`
Начислить средства на **внутренний** баланс.

**Request body:**
```json
{ "amount": 100000, "comment": "Компенсация за сбой в оплате 22 апреля" }
```

**Use case:** юзер жалуется, что оплата прошла, но услугу не активировали. Админ возвращает сумму на баланс вручную.

### `POST /admin/users/{user_id}/balance/decrement`
Списать с баланса.

**Use case:** редко, обычно при ошибочном начислении.

> Комиссионный баланс — через отдельные эндпоинты `/admin/billing/compensation-balance/*` (см. [plans-and-billing.md](./plans-and-billing.md)).

## Подписка (ручная активация)

Все под `/admin/users/{user_id}/subscription`. Controller: `AdminSubscriptionController`.

### `POST /admin/users/{user_id}/subscription/assign`
**Ручная активация подписки** — без оплаты, от имени админа.

**Request body:**
```json
{
  "plan_id": 2,
  "ends_at": "2026-05-23T23:59:59Z"
}
```

**Use case:** VIP-клиент, договорились офлайн, либо промо-акция.

### `POST /admin/users/{user_id}/subscription/start-trial`
**Ручной старт триала** — даже если юзер уже использовал триал.

**Use case:** клиент жалуется, что триал протёк из-за бага — даём вторую попытку.

### `PUT /admin/users/{user_id}/subscription/payment-method`
Сменить привязанную карту для автосписания.

**Request body:**
```json
{ "payment_method_id": 42 }
```

## Комментарии админов

Под `/admin/users/{user_id}/comments`. Controller: `UserCommentsController`.

**Назначение:** внутренние заметки о юзере (разговоры, особенности, договорённости). Видят только админы.

### `GET /admin/users/{user_id}/comments`
Список комментариев.

### `POST /admin/users/{user_id}/comments`
Добавить комментарий.

**Request body:**
```json
{ "text": "Разговор 23 апреля: клиент хочет перейти на Премиум с следующего месяца." }
```

### `PUT /admin/users/{user_id}/comments/{comment_id}`
Редактировать (только свой комментарий, либо админ-супервайзер).

### `DELETE /admin/users/{user_id}/comments/{comment_id}`
Удалить.

### Файлы к комментариям

- `POST /admin/users/{user_id}/comments/{comment_id}/files` — приложить.
- `GET /admin/users/{user_id}/comments/{comment_id}/files/{file_uuid}` — скачать.
- `DELETE /admin/users/{user_id}/comments/{comment_id}/files/{file_uuid}` — удалить.

## Файлы юзера (прикрепление документов)

Под `/admin/users/{user_id}/files`. Controller: `UserFileController`.

**Назначение:** приложить к юзеру важные документы (сканы паспорта, подписанные договоры на Enterprise и т.п.). Не показываются юзеру, только админам.

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/admin/users/{user_id}/files` | Загрузить файл |
| `GET` | `/admin/users/{user_id}/files/{file_uuid}` | Скачать |
| `DELETE` | `/admin/users/{user_id}/files/{file_uuid}` | Удалить |

## Публикации юзера

### `GET /admin/users/{user_id}/publishings/charges`
Текущие использованные лимиты публикаций — сколько активно из разрешённых тарифом. Controller: `AdminPublishingsController::listCharges`.

**Ответ:**
```json
{
  "data": {
    "plan": "premium",
    "used": 3,
    "limit": 5,
    "active_realties": [...]
  }
}
```

**Use case:** проверить, почему юзер не может опубликовать новый объект.

## Коды ошибок

- `404` — юзер не найден.
- `409` — нельзя повторно запустить триал (если эта логика включена).
- `422` — валидация.

## Ссылки

- [UserController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Admin/Users/UserController.php)
- [UserCommentsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Admin/Users/UserCommentsController.php)
- [UserFileController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Admin/Users/UserFileController.php)
- [AdminSubscriptionController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Subscriptions/Http/Controllers/AdminSubscriptionController.php)
