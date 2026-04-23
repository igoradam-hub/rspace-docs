# API: Realties (объекты)

Управление объектами недвижимости. Префикс: `/realties`. Middleware: `auth:user` (кроме `GET /offer`).

Модуль: [Realty](../02-modules/realty.md).

## Структура

Работа с объектом многошаговая. Один объект (`Realty`) содержит:
- **Тип-специфичные данные** (`/apartment` / `/house` / `/land-plot`) — ровно один из трёх типов.
- **Building** (только apartment) — данные здания.
- **Location** — адрес и координаты.
- **Deal-terms** — цена, комиссия, условия.
- **Description** — текст описания (руками или AI).
- **Owner-info** — собственник и его документы.
- **Photos** — медиа (Spatie).
- **Rooms** (только apartment) — комнаты.
- **Share** — доля (если долевая собственность).
- **Video-url** — ссылка на видео.
- **New-apartment-info** (только apartment-новостройка) — ЖК, застройщик, ДДУ.
- **Widget** — встраиваемый блок услуг.

## Список

### `GET /realties/settings`

Получить настройки создания объекта: дефолтный регион, город, допустимые типы.

**Ответ:** `200 OK`
```json
{
  "data": {
    "default_city": "Москва",
    "default_country": "Россия",
    "available_types": ["apartment", "house", "land_plot"]
  }
}
```

---

### `GET /realties`

Список объектов агента с пагинацией.

**Query params:**
- `page`, `per_page` — пагинация.
- `status`, `type` — фильтры.
- `search` — поиск по адресу.

**Ответ:** `200 OK`
```json
{
  "data": [
    {
      "id": 789,
      "type": "apartment",
      "status": "active",
      "aggregated_status": "published",
      "address": "Москва, ул. Тверская, 8",
      "price": 18900000,
      "photos_count": 12,
      "cover_photo": "https://...",
      "created_at": "2026-04-20T10:00:00Z"
    }
  ],
  "meta": { "current_page": 1, "total": 6, "per_page": 20, "last_page": 1 }
}
```

---

### `POST /realties`

Создать объект (draft).

**Request body:**
```json
{
  "type": "apartment"
}
```

**Поля:**
- `type` — `apartment` / `house` / `land_plot`. Определяет, какие эндпоинты будут доступны (`/apartment` или `/house` или `/land-plot`).

**Ответ:** `201 Created` с моделью draft-объекта. Дальше заполняем шагами.

**Ошибки:**
- `403` — превышен лимит объектов по тарифу.

---

## Работа с конкретным объектом

Все эндпоинты ниже — под `/realties/{realty_id}` (whereNumber).

### `GET /realties/{realty_id}`

Полный объект со всеми под-сущностями.

**Ответ:** большой JSON с полями (зависит от `type`):
- `id`, `external_key`, `type`, `status`, `aggregated_status`, `created_at`, `updated_at`
- `apartment` / `house` / `land_plot` — подтип
- `apartment_building` (для квартир)
- `location` (адрес, координаты)
- `deal_terms` (цена, комиссия)
- `description` (текст)
- `owner_info` (собственник)
- `photos[]` (массив с URL и thumb)
- `rooms[]` (для квартир)
- `share` (доля)
- `video_url`
- `new_apartment_info` + `ddu_files` (для новостроек)
- `publishings[]` (связанные публикации на площадках — см. [publishings.md](./publishings.md))

### `DELETE /realties/{realty_id}`

Удалить объект. Поведение (hard/soft) — проверить в коде (`RealtyController::delete`).

**Ответ:** `200 OK` или `204 No Content`.

### `POST /realties/{realty_id}/archive`

Перевести объект в архив. Освобождает слот в лимите тарифа.

**Ответ:** `200 OK`.

### `POST /realties/{realty_id}/restore`

Восстановить из архива.

**Ответ:** `200 OK`.

---

## Тип-специфичные обновления

### `PUT /realties/{realty_id}/apartment`

Данные квартиры. Тело зависит от enum'ов (точный список — в `UpdateApartmentRequest`).

**Пример тела:**
```json
{
  "room_count": "three",
  "total_area": 56.5,
  "living_area": 42.0,
  "kitchen_area": 10.5,
  "floor": 12,
  "floor_count": 25,
  "apartment_type": "studio",
  "windows_view": "yard_and_street",
  "repair_type": "euro",
  "has_balcony": true,
  "has_loggia": false,
  "bathroom_combined_count": 0,
  "bathroom_separate_count": 1
}
```

### `PUT /realties/{realty_id}/apartment/building`

Данные здания (дом, где находится квартира).

**Пример:**
```json
{
  "built_year": 2015,
  "apartment_building_type": "brick",
  "floor_count": 25,
  "elevator_count": 2,
  "has_passenger_elevator": true,
  "has_freight_elevator": true,
  "has_concierge": true,
  "has_parking": "underground",
  "heating_system": "central",
  "water_system": "central",
  "gas_type": "none"
}
```

### `PUT /realties/{realty_id}/house`

Данные дома.

**Пример:**
```json
{
  "house_type": "cottage",
  "material": "brick",
  "total_area": 240.0,
  "living_area": 180.0,
  "floor_count": 2,
  "condition": "livable",
  "heating_type": "gas",
  "drainage_type": "septic",
  "gas_type": "central",
  "water_type": "well",
  "bathroom_location": "indoor"
}
```

### `PUT /realties/{realty_id}/land-plot`

Данные участка.

**Пример:**
```json
{
  "area": 10.0,
  "land_plot_type": "residential"
}
```

---

## Локация, сделка, описание, видео

### `PUT /realties/{realty_id}/location`

Адрес + координаты. Валидация через Dadata (вызов на клиенте или серверный proxy).

**Пример:**
```json
{
  "address": "г. Москва, ул. Тверская, д. 8",
  "city": "Москва",
  "country": "Россия",
  "latitude": 55.7629,
  "longitude": 37.6100,
  "cadastral_number": "77:01:0001001:1234"
}
```

### `PUT /realties/{realty_id}/deal-terms`

Условия сделки.

**Пример:**
```json
{
  "price": 18900000,
  "sell_type": "direct",
  "commission_type": "percent",
  "commission_value": 3.0,
  "commission_share": "seller",
  "heard_from": "avito",
  "is_negotiable": true,
  "published_by_owner": false
}
```

**Enum'ы:**
- `sell_type` — `direct` / `alternative` / `new_development`
- `commission_type` — `percent` / `fixed`
- `commission_share` — `seller` / `buyer` / `both`

### `PUT /realties/{realty_id}/description`

Ручное описание.

**Пример:**
```json
{
  "description": "Просторная 2-комнатная квартира в центре Москвы..."
}
```

### `PUT /realties/{realty_id}/video-url`

Ссылка на видео объекта.

**Пример:**
```json
{
  "video_url": "https://youtu.be/abcdef"
}
```

### `PUT /realties/{realty_id}/share`

Доля собственности (если объект в долевой собственности).

**Пример:**
```json
{
  "share_ownership": "fractional",
  "share_numerator": 1,
  "share_denominator": 2
}
```

---

## Новостройка (ДДУ)

### `PUT /realties/{realty_id}/new-apartment-info`

```json
{
  "developer_name": "Донстрой",
  "complex_name": "ЖК «Символ»",
  "person_type": "legal",
  "decoration": "chistovaya",
  "planned_delivery_year": 2027,
  "planned_delivery_quarter": 4
}
```

### `POST /realties/{realty_id}/new-apartment-info/ddu`

Загрузить ДДУ (договор долевого участия) как файл.

**Content-Type:** `multipart/form-data`
**Fields:** `file` (PDF)

**Ответ:** с UUID файла для последующих операций.

---

## Собственник

### `PUT /realties/{realty_id}/owner-info`

```json
{
  "type": "individual",
  "last_name": "Иванов",
  "first_name": "Иван",
  "patronymic": "Иванович",
  "birth_date": "1985-03-15",
  "inn": "771234567890",
  "passport_series": "4521",
  "passport_number": "123456",
  "passport_issued_by": "ОУФМС России...",
  "passport_issued_at": "2015-05-20",
  "passport_department_code": "770-123",
  "published_by": "agent"
}
```

**Enum'ы:**
- `type` — `individual` (физлицо) / `legal` (юрлицо)
- `published_by` — `agent` / `owner`

### `POST /realties/{realty_id}/owner-info/files`

Загрузить документ собственника. `multipart/form-data`, `file` — PDF/JPG.

### `DELETE /realties/{realty_id}/owner-info/files/{file_uuid}`

Удалить документ по UUID.

---

## Фото

### `POST /realties/{realty_id}/photos`

Загрузить фото. `multipart/form-data`.

**Fields:**
- `file` — изображение (JPEG/PNG)
- `category` — `facade` / `living_room` / `bedroom` / `kitchen` / `bathroom` / `plan` / `view` / ... (enum `PhotoCategory`)
- `description` — опциональное описание

**Ответ:**
```json
{
  "data": {
    "uuid": "abc-123-...",
    "url": "https://s3.rspace.pro/realties/789/photo-abc.jpg",
    "thumb": "https://s3.rspace.pro/realties/789/photo-abc-thumb.jpg",
    "category": "living_room",
    "position": 1
  }
}
```

### `POST /realties/{realty_id}/photos/reorder`

Переупорядочить фото.

**Request body:**
```json
{ "photo_uuids": ["uuid1", "uuid2", "uuid3"] }
```

### `PATCH /realties/{realty_id}/photos/{photo_uuid}`

Обновить фото (категория, описание).

```json
{ "category": "bathroom", "description": "После ремонта" }
```

### `DELETE /realties/{realty_id}/photos/{photo_uuid}`

Удалить фото.

---

## Комнаты (для квартир)

### `POST /realties/{realty_id}/rooms`

```json
{ "type": "bedroom", "area": 12.5 }
```

### `PATCH /realties/{realty_id}/rooms/{room_id}`

```json
{ "area": 14.0 }
```

### `DELETE /realties/{realty_id}/rooms/{room_id}`

---

## Публикация

### `POST /realties/{realty_id}/publish`

Опубликовать объект на выбранных площадках.

**Request body:**
```json
{
  "targets": ["avito", "cian", "domclick"]
}
```

**Эффекты:**
- Создаются `Publishing` с per-платформенными child-записями (см. [publishings.md](./publishings.md)).
- Запускаются Job'ы публикации.
- Event `RealtyPublished` выстреливает.

**Ошибки:**
- `403` — лимит активных публикаций по тарифу.
- `422` — объект не заполнен полностью (нет цены, адреса, фото).

---

## AI-описание

### `GET /realties/{realty_id}/description/generate/eligible`

Проверить, можно ли запустить генерацию описания.

**Ответ:**
```json
{
  "data": {
    "eligible": true,
    "reason": null
  }
}
```

Или:
```json
{
  "data": {
    "eligible": false,
    "reason": "missing_required_fields"
  }
}
```

### `POST /realties/{realty_id}/description/generate`

Сгенерировать описание через OpenAI.

**Ответ:**
```json
{
  "data": {
    "description": "Просторная 2-комнатная квартира в историческом центре Москвы...",
    "prompt_id": 42
  }
}
```

Подробнее — [realty-prompts.md](../02-modules/realty-prompts.md) (Волна 5) и `_sources/05-ai-descriptions.md`.

---

## Public Offer

### `GET /realties/{realty_id}/offer` **(без `auth:user`)**

Публичная страница объекта для клиентов агента. Используется в ссылках, которые агент отправляет клиенту.

**Ответ:** JSON с публичными полями (без паспорта собственника и его документов):
- Фото, описание, цена, параметры, адрес.
- Контакты агента (с `fake_phone`, если настроен).
- Лого и цвета агента (из `/settings/offer`).

---

## Widget

### `GET /realties/{realty_id}/widget`

Конфигурация виджета.

### `POST /realties/{realty_id}/widget/order`

Заказ услуг из виджета.

Подробнее — [widget.md](../02-modules/widget.md) (Волна 5).

---

## Связанные эндпоинты

- [publishings.md](./publishings.md) — публикации (Волна 3).
- [leads.md](./leads.md) — лиды (Волна 3).
- [settings.md](./settings.md) — настройки public offer (Волна 6).

## Ссылки GitLab

- [RealtyController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Realty/Public/RealtyController.php)
- [realty module](../02-modules/realty.md)
