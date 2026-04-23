# API: Suggestions (подсказки и Dadata-proxy)

Подсказки для форм — города, адреса, новостройки. Используются в автоподсказках при создании объектов.

## Dadata-proxy

Префикс: `/proxy/dadata`. Middleware: `auth:user,admin`.

Controller: `app/Http/Controllers/Proxy/DadataController.php`.

### `GET /proxy/dadata/suggestions/{path}`

**Универсальный проксирующий endpoint** — что пришло после `/suggestions/`, то летит в Dadata API. Backend добавляет API-key.

**Пример запроса:**
```
GET /proxy/dadata/suggestions/address?query=Тверская
GET /proxy/dadata/suggestions/party?query=770123         (по ИНН)
GET /proxy/dadata/suggestions/fio?query=Иванов
```

**Ответ:** как есть от Dadata (через наш proxy).

## Cities

### `GET /suggestions/cities`

Middleware: `auth:user,admin`.
Controller: `app/Http/Controllers/Dadata/Cities/DadataCityController.php`.

Поиск городов РФ.

**Query:** `?query=Мос`

**Ответ:**
```json
{
  "data": [
    { "value": "Москва", "region": "Москва", "federal_district": "ЦФО" },
    { "value": "Московский", "region": "Московская область" }
  ]
}
```

## Avito / CIAN new developments

### `GET /suggestions/avito/new-developments`

Поиск новостроек в базе Avito по городу/поисковой строке.

Controller: `app/Http/Controllers/Suggestions/AvitoSuggestionController.php`.

**Query:** `?query=ЖК Символ`

### `GET /suggestions/cian/new-objects`

То же для ЦИАН.

Controller: `app/Http/Controllers/Suggestions/CianSuggestionController.php`.

## Зачем нужно

- При создании объекта — **адрес** из Dadata (точные координаты + ФИАС-ID).
- При заполнении **собственника** — ФИО / ИНН-проверка через Dadata.
- Для **новостроек** (первичка) — выбор из каталога застройщика (Avito/CIAN).

## Связанные

- [Dadata интеграция](../05-integrations/dadata.md)
- [Realty модуль](../02-modules/realty.md)

## Ссылки

- [DadataController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Proxy/DadataController.php)
- [DadataCityController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Dadata/Cities/DadataCityController.php)
