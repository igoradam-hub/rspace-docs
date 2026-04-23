# Admin API: Auth & Admins

Логин админов + управление админами (CRUD, супервайзеры, переназначение пользователей). Controllers: `AdminAuthController`, `AdminController`.

## Auth

### `GET /admin/auth/check`
Проверить валидность admin-токена. **Без `auth:admin` middleware** (withoutMiddleware).

**Ответ:** 200 если токен ок, 401 если нет.

### `POST /admin/auth/login`
Вход админа.

**Throttle:** `5,1` (5 попыток/минуту).
**Без `auth:admin` middleware.**

**Request body:**
```json
{ "email": "superadmin@rspace.pro", "password": "..." }
```

**Ответ:** `200 OK` с Sanctum-токеном (guard `admin`).

**Ошибки:**
- `401` — неверные креды.
- `429` — лимит попыток.

### `POST /admin/auth/logout`
Удалить текущий токен.

### `POST /admin/auth/logout/all`
Удалить все токены текущего админа (выход со всех устройств).

### `POST /admin/auth/change-password`
Смена пароля. **Throttle 5/минуту.**

**Request body:**
```json
{ "current_password": "...", "password": "...", "password_confirmation": "..." }
```

---

## Admins (управление админами)

Все под `/admin/admins`.

### `GET /admin/admins`
Список всех админов.

**Query params:** `page`, `per_page`, фильтры.

**Ответ:**
```json
{
  "data": [
    { "id": 1, "name": "Орлова И. М.", "email": "...", "is_supervisor": true, "active": true, "created_at": "..." }
  ]
}
```

### `POST /admin/admins`
Создать нового админа.

**Request body:**
```json
{
  "email": "newadmin@rspace.pro",
  "password": "...",
  "name": "Имя",
  "is_supervisor": false
}
```

### `GET /admin/admins/supervisors`
Список только супер-админов (для UI-селекторов «выбрать супервайзера»).

### `GET /admin/admins/{admin_id}`
Детали конкретного админа.

### `PUT /admin/admins/{admin_id}`
Обновить данные (имя, email, роль).

### `POST /admin/admins/{admin_id}/activate`
Активировать (снять деактивацию).

### `POST /admin/admins/{admin_id}/deactivate`
Деактивировать. **Важно**: перед этим — переназначить пользователей (`reassignUsers`).

### `PUT /admin/admins/{admin_id}/credentials`
Сменить креды (email / пароль) любому админу (требуется роль супер-админа).

### `GET /admin/admins/{admin_id}/assigned-users`
Список пользователей, закреплённых за этим менеджером (`users.curator_id = admin.id`).

**Ответ:**
```json
{
  "data": [
    { "id": 123, "phone": "+7...", "first_name": "...", "active_subscription": {...} }
  ]
}
```

### `POST /admin/admins/{admin_id}/assigned-users/reassign-to/{new_admin_id}`
Массово переназначить всех пользователей `admin_id` → `new_admin_id`.

**Use case:** менеджер ушёл, его клиентов забирает другой.

**Ответ:** `200 OK` с количеством переназначенных.

---

## Files (прикрепление файлов к профилю админа)

Под `/admin/admins/{admin_id}/files`.

### `POST /admin/admins/{admin_id}/files`
Приложить файл к карточке админа (паспорт, трудовой договор и т.п.).

**Content-Type:** `multipart/form-data`, `file` — любой тип, обычно PDF/JPG.

### `GET /admin/admins/{admin_id}/files/{file_uuid}`
Скачать файл.

### `DELETE /admin/admins/{admin_id}/files/{file_uuid}`
Удалить.

---

## Ссылки

- [AdminController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Admin/AdminController.php)
- [AdminAuthController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Auth/AdminAuthController.php)
- [../../06-admin.md](../../06-admin.md)
