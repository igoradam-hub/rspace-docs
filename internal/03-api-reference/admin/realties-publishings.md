# Admin API: Realties, Publishings, Feeds, AI-Prompts

Админские возможности для работы с объектами недвижимости: полное редактирование от имени юзера, управление публикациями, заявки на промо (Avito/CIAN), генерация feed, CRUD AI-промптов. Controllers: `AdminRealtyController`, `AdminRealtyPromptsController`, `AdminPublishingsController`, `AdminPromotionsController`, `AdminPublishingPromotionRequestController`, `PublishingCallsAdminController`, `FeedController`.

---

## Realties (объекты — админский CRUD)

Все под `/admin/realties`. Зеркалят публичные `/realties/*`, но админ может работать **с любым** объектом, а не только своим.

### Список и создание

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/realties` | Список всех объектов (все юзеры). Фильтры: `user_id`, `status`, `type`, `city`, `price_min/max` |
| `POST` | `/admin/realties` | Создать draft от имени юзера (поле `user_id` в body) |

### Редактирование конкретного объекта

Под `/admin/realties/{realty_id}`:

| Метод | URL | Назначение |
|---|---|---|
| `GET` | `/admin/realties/{id}` | Полный объект |
| `POST` | `/admin/realties/{id}/archive` | Архивировать |
| `POST` | `/admin/realties/{id}/restore` | Восстановить из архива |
| `POST` | `/admin/realties/{id}/publish` | Опубликовать (targets в body) |
| `PUT` | `/admin/realties/{id}/apartment` | Обновить данные квартиры |
| `PUT` | `/admin/realties/{id}/apartment/building` | Данные здания |
| `PUT` | `/admin/realties/{id}/house` | Данные дома |
| `PUT` | `/admin/realties/{id}/land-plot` | Данные участка |
| `PUT` | `/admin/realties/{id}/location` | Адрес/координаты |
| `PUT` | `/admin/realties/{id}/deal-terms` | Условия сделки |
| `PUT` | `/admin/realties/{id}/description` | Описание |
| `PUT` | `/admin/realties/{id}/video-url` | URL видео |
| `PUT` | `/admin/realties/{id}/share` | Доля собственности |

### Новостройки (ДДУ)

| Метод | URL | Описание |
|---|---|---|
| `PUT` | `/admin/realties/{id}/new-apartment-info` | Данные о новостройке |
| `POST` | `/admin/realties/{id}/new-apartment-info/ddu` | Загрузить ДДУ (multipart) |

### Собственник

| Метод | URL | Описание |
|---|---|---|
| `PUT` | `/admin/realties/{id}/owner-info` | ФИО, паспорт |
| `POST` | `/admin/realties/{id}/owner-info/files` | Загрузить документ |
| `DELETE` | `/admin/realties/{id}/owner-info/files/{file_uuid}` | Удалить |

### Фото

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/admin/realties/{id}/photos` | Загрузить |
| `POST` | `/admin/realties/{id}/photos/reorder` | Переупорядочить |
| `PATCH` | `/admin/realties/{id}/photos/{photo_uuid}` | Обновить категорию |
| `DELETE` | `/admin/realties/{id}/photos/{photo_uuid}` | Удалить |

### Комнаты

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/admin/realties/{id}/rooms` | Добавить |
| `PATCH` | `/admin/realties/{id}/rooms/{room_id}` | Обновить |
| `DELETE` | `/admin/realties/{id}/rooms/{room_id}` | Удалить |

---

## Realty Prompts (AI-промпты для генерации описаний)

Под `/admin/realties/prompts`. Controller: `AdminRealtyPromptsController`.

Управление шаблонами промптов, которые отправляются в OpenAI для генерации описаний объектов.

### Общие настройки

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/realties/prompts/settings` | Глобальные настройки (включено/выключено, модель по умолчанию) |
| `POST` | `/admin/realties/prompts/toggle` | Включить/выключить генерацию для всех |
| `GET` | `/admin/realties/prompts/variables` | Список доступных переменных (20+: `{{address}}`, `{{floor}}`, `{{price}}`, `{{all_fields_json}}`, ...) |

### CRUD шаблонов

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/realties/prompts` | Список всех шаблонов |
| `POST` | `/admin/realties/prompts` | Создать шаблон |
| `GET` | `/admin/realties/prompts/{id}` | Детали |
| `PUT` | `/admin/realties/prompts/{id}` | Обновить |
| `DELETE` | `/admin/realties/prompts/{id}` | Удалить |
| `POST` | `/admin/realties/prompts/{id}/activate` | Сделать активным (один шаблон за раз) |
| `POST` | `/admin/realties/prompts/{id}/deactivate` | Отключить |

**Body для create/update шаблона:**
```json
{
  "title": "Коммерческий стиль — 3-5 предложений",
  "template": "Напиши описание объекта: {{room_count}}-комнатная, {{total_area}} м², {{floor}} этаж...",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 500
}
```

---

## Publishings (админские операции)

Под `/admin/publishings`. Controller: `AdminPublishingsController`. Зеркалят публичные `/publishings/*`, но админ работает с любыми.

### CRUD публикаций

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/publishings` | Все публикации (все юзеры) |
| `POST` | `/admin/publishings` | Создать |
| `GET` | `/admin/publishings/{id}` | Детали |
| `PUT` | `/admin/publishings/{id}` | Обновить |
| `POST` | `/admin/publishings/{id}/archive` | Снять со всех площадок |
| `POST` | `/admin/publishings/{id}/prolong` | Продлить |
| `PATCH` | `/admin/publishings/{id}/external-id` | Установить внешний ID (Avito/CIAN) вручную |

### Avito

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/admin/publishings/{id}/avito` | Опубликовать на Avito |
| `DELETE` | `/admin/publishings/{id}/avito` | Удалить с Avito |
| `POST` | `/admin/publishings/{id}/avito/promotions` | Админский заказ промо (AdminPromotionsController) |

### CIAN

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/admin/publishings/{id}/cian` | Опубликовать на ЦИАН |
| `DELETE` | `/admin/publishings/{id}/cian` | Удалить с ЦИАН |
| `POST` | `/admin/publishings/{id}/cian/promotions` | Заказать промо |

---

## Promotions Requests (заявки на промо)

Под `/admin/publishings/promotions/requests`. Controller: `AdminPublishingPromotionRequestController`.

Заявки, созданные юзерами через `POST /publishings/{id}/{platform}/promotions/request` — ждут ручной обработки админом.

### Avito

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/admin/publishings/promotions/requests/avito` | Список всех заявок (pending) |
| `POST` | `/admin/publishings/promotions/requests/avito/{request_id}/complete` | Завершить заявку (промо применено) |
| `DELETE` | `/admin/publishings/promotions/requests/avito/{request_id}` | Удалить (отказано) |

### CIAN

Аналогично:
- `GET /admin/publishings/promotions/requests/cian`
- `POST /admin/publishings/promotions/requests/cian/{request_id}/complete`
- `DELETE /admin/publishings/promotions/requests/cian/{request_id}`

---

## Promotions (текущие активные продвижения)

Под `/admin/publishings/promotions`. Controller: `AdminPromotionsController`.

### `GET /admin/publishings/promotions/avito`
Список всех активных промо-услуг на Avito (с истечением, статистикой).

### `GET /admin/publishings/promotions/cian`
То же для ЦИАН.

---

## Publishing Calls (журнал звонков + CSV-экспорт)

Под `/admin/publishings/calls`. Controller: `PublishingCallsAdminController`.

### `GET /admin/publishings/calls`
Лог всех звонков с Avito + ЦИАН. Фильтры: `user_id`, `publishing_id`, `platform`, `from`, `to`.

### `GET /admin/publishings/calls/csv`
**Экспорт в CSV** — для аналитики вне админки.

---

## Feeds (ручная генерация)

Под `/admin/feeds/{feed_type}`. Controller: `FeedController`.

`feed_type` — значения enum `FeedType`: `avito`, `cian`, плюс (вероятно) `domclick`, `yandex`.

### `GET /admin/feeds/{feed_type}`
Получить сгенерированный feed (XML).

### `POST /admin/feeds/{feed_type}/generate`
Принудительно пересобрать feed (обычно генерируется автоматически, но можно триггернуть вручную при проблемах с площадкой).

---

## Ссылки

- [AdminRealtyController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Realty/Admin/AdminRealtyController.php)
- [AdminRealtyPromptsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Realty/Prompts/Http/Controllers/AdminRealtyPromptsController.php)
- [AdminPublishingsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Admin/Publishings/AdminPublishingsController.php)
- [PublishingCallsAdminController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Publishings/Http/Controllers/PublishingCallsAdminController.php)
- [../../02-modules/realty-prompts.md](../../02-modules/realty-prompts.md) — логика AI-промптов.
- [../../05-integrations/avito.md](../../05-integrations/avito.md), [cian.md](../../05-integrations/cian.md), [domclick.md](../../05-integrations/domclick.md).
