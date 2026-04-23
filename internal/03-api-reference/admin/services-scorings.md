# Admin API: Services, Scorings, Leads, Monitoring

Обработка заявок на услуги юристов, скоринги (проверки), работа с общим пулом лидов, мониторинг внешних балансов. Controllers: `AdminServiceController`, `AdminServiceChargeController`, `AdminServiceRequestController`, `AdminServiceRequestCommentController`, `AdminServiceRequestFileController`, `WidgetAdminController`, `AdminScoringsController`, `AdminScoringRequestsController`, `AdminLeadController`, `ExternalBalancesAdminController`.

---

## Services (каталог услуг)

Под `/admin/services`.

### CRUD

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/services` | Список всех услуг (активные + архив) |
| `POST` | `/admin/services` | Создать новую |
| `GET` | `/admin/services/{id}` | Детали |
| `PUT` | `/admin/services/{id}` | Обновить |
| `POST` | `/admin/services/{id}/archive` | Архивировать |
| `POST` | `/admin/services/{id}/restore` | Восстановить |
| `POST` | `/admin/services/{id}/image` | Загрузить иконку услуги |

**Body для create/update:**
```json
{
  "name": "Юрист на сделку",
  "category_id": 1,
  "description": "...",
  "base_price_capital": 2625000,
  "base_price_regions": 1875000,
  "has_urgent_variant": true
}
```

---

## Service Charges (лимиты подписки)

Под `/admin/services/charges`. Controller: `AdminServiceChargeController`.

### `GET /admin/services/charges`
Список всех charges (право юзера на услуги). Фильтры: `user_id`, `service_id`.

### `POST /admin/services/charges`
**Создать charge вручную** — дать юзеру право на услугу без оплаты.

**Request body:**
```json
{
  "user_id": 123,
  "service_id": 25,
  "quantity": 1,
  "expires_at": "2026-05-31T23:59:59Z",
  "comment": "Компенсация за сбой сервиса"
}
```

### `POST /admin/services/charges/consume`
Принудительно пометить charge как использованный (`ServiceChargeUsage`).

**Use case:** редкий, обычно потребление происходит автоматически при оформлении заявки.

---

## Service Requests (заявки пользователей на услуги)

Под `/admin/services/requests`. Controller: `AdminServiceRequestController`.

### `GET /admin/services/requests`
Очередь всех заявок. Фильтры: `status` (`paid`/`in_progress`/`completed`/`cancelled`), `responsible_id`, `user_id`, `service_id`.

**Use case:** юрист смотрит свою очередь, админ — общую.

### Работа с заявкой `/admin/services/requests/{request_id}`

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/services/requests/{id}` | Детали заявки |
| `POST` | `/admin/services/requests/{id}/start` | Взять в работу (status=in_progress) |
| `POST` | `/admin/services/requests/{id}/complete` | Завершить (status=completed) |
| `POST` | `/admin/services/requests/{id}/cancel` | Отменить (status=cancelled, возврат) |
| `POST` | `/admin/services/requests/{id}/restore` | Восстановить отменённую |
| `PUT` | `/admin/services/requests/{id}/responsible/{responsible_id}` | Назначить ответственного юриста |

### Файлы к заявке

Под `/admin/services/requests/{id}/files`. Controller: `AdminServiceRequestFileController`.

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/admin/services/requests/{id}/files` | Загрузить файл (ДКП, отчёт) |
| `GET` | `/admin/services/requests/{id}/files/{file_uuid}` | Скачать |
| `DELETE` | `/admin/services/requests/{id}/files/{file_uuid}` | Удалить |
| `GET` | `/admin/services/requests/{id}/files/{file_uuid}/url` | Получить подписанный URL (для передачи клиенту без авторизации) |

### Комментарии к заявке

Под `/admin/services/requests/{id}/comments`. Controller: `AdminServiceRequestCommentController`.

Коммуникация между админами в рамках одной заявки (например, юрист → менеджер).

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/services/requests/{id}/comments` | Список комментариев |
| `POST` | `/admin/services/requests/{id}/comments` | Добавить |
| `PUT` | `/admin/services/requests/{id}/comments/{comment_id}` | Редактировать |
| `DELETE` | `/admin/services/requests/{id}/comments/{comment_id}` | Удалить |

### Файлы к комментариям

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/admin/services/requests/{id}/comments/{comment_id}/files` | Приложить |
| `GET` | `/admin/services/requests/{id}/comments/{comment_id}/files/{file_uuid}` | Скачать |
| `DELETE` | `/admin/services/requests/{id}/comments/{comment_id}/files/{file_uuid}` | Удалить |
| `DELETE` | `/admin/services/requests/{id}/comments/{comment_id}/files/{file_uuid}/url` | TBD (метод DELETE на url — вероятно генерация URL; проверить по коду) |

---

## Widget Items (встраиваемый блок услуг)

Под `/admin/services/{service_id}/widget`. Controller: `WidgetAdminController`.

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/services/{id}/widget` | Текущие настройки widget item для услуги |
| `PUT` | `/admin/services/{id}/widget` | Заполнить (title, description, icon) |
| `POST` | `/admin/services/{id}/widget/activate` | Показать widget item в виджетах объектов |
| `POST` | `/admin/services/{id}/widget/deactivate` | Скрыть |

**Лимит активных items** — если превышен, API вернёт `ActiveWidgetItemsLimitExceededException`.

---

## Scorings (типы скорингов)

Под `/admin/scorings`. Controller: `AdminScoringsController`.

### CRUD

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/scorings` | Список типов проверок |
| `POST` | `/admin/scorings` | Создать новый тип |
| `GET` | `/admin/scorings/{id}` | Детали |
| `PUT` | `/admin/scorings/{id}` | Обновить (название, цены) |

**Body для create:**
```json
{
  "type": "owner",
  "name": "Проверка собственника",
  "base_price_capital": 375000,
  "base_price_regions": 312500,
  "estimated_days": 2
}
```

---

## Scoring Requests (заявки на проверки)

Под `/admin/scorings/requests`. Controller: `AdminScoringRequestsController`.

### `GET /admin/scorings/requests`
Очередь заявок. Фильтры: `status` (`created`, `in_progress`, `finished`, `cancelled`), `scoring_id`, `user_id`.

### Обработка

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/scorings/requests/{id}` | Детали заявки |
| `POST` | `/admin/scorings/requests/{id}/cancel` | Отменить (возврат) |
| `POST` | `/admin/scorings/requests/{id}/finish` | Завершить с PDF-отчётом |
| `GET` | `/admin/scorings/requests/{id}/file` | Скачать приложенный отчёт |

**Body для `finish`:** `multipart/form-data` с `file` (PDF).

После `finish`:
- `ScoringRequest.state → Finished` (через State pattern).
- Юзер получает уведомление.
- `GET /scorings/requests/{id}/file` (публичный) становится доступен юзеру.

---

## Leads (общий пул)

Под `/admin/leads`. Controller: `AdminLeadController`.

### `GET /admin/leads`
Все лиды (и назначенные, и в общем пуле).

**Query params:** `status`, `source`, `assigned_to_id`, `from`, `to`, `search`.

### `POST /admin/leads/assign`
Массовое назначение лидов админам / пользователям.

**Request body:**
```json
{
  "lead_ids": [42, 43, 44],
  "assigned_to_id": 7
}
```

**Эффект:** каждому лиду — `assigned_to_id` + `assigned_at=now()` + `status=applied`.

### `POST /admin/leads/sync`
Принудительный запуск `SyncLeadsCommand` (pull с Avito/CIAN API).

**Use case:** админ видит, что новых лидов нет 2 часа — проверяет, запускает вручную.

---

## External Balances (мониторинг)

Под `/admin/balances`. Controller: `ExternalBalancesAdminController`.

### `GET /admin/balances`
Получить балансы на **внешних провайдерах**:
- **sms.ru** (если баланс низкий — SMS перестанут отправляться, критично!)
- **Avito** (рекламный бюджет на публикации/промо)
- **CIAN** (то же)
- **OpenAI** (баланс API — если кончится, AI-юрист и AI-описания отключатся)
- **CloudPayments** (merchant-балансы, комиссии)

**Ответ (предположительный формат):**
```json
{
  "data": [
    {
      "provider": "smsru",
      "balance": 1234.50,
      "currency": "RUB",
      "warning_threshold": 500,
      "status": "ok",
      "last_checked_at": "2026-04-23T15:00:00Z"
    },
    {
      "provider": "openai",
      "balance": 18.75,
      "currency": "USD",
      "warning_threshold": 10,
      "status": "warning",
      "last_checked_at": "..."
    }
  ]
}
```

**Use case:** ежедневно смотрят Игорь / Света. Если баланс ниже порога — пополняют.

---

## Ссылки

- [AdminServiceController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Services/AdminServiceController.php)
- [AdminServiceRequestController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Admin/Services/ServiceRequestController.php)
- [AdminScoringRequestsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Scoring/Http/Controllers/AdminScoringRequestsController.php)
- [AdminLeadController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Leads/Http/Controllers/AdminLeadController.php)
- [ExternalBalancesAdminController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Monitoring/Http/Controllers/ExternalBalancesAdminController.php)
- [../../02-modules/services.md](../../02-modules/services.md)
- [../../02-modules/scoring.md](../../02-modules/scoring.md)
