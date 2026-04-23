# Модуль: Realty

> **Домен:** Realty (объекты недвижимости: квартиры, дома, участки)
> **Репозиторий:** `rspase/project/backend`
> **Путь:** `backend/app/Realty/` + `backend/app/Models/Realty/` + `backend/app/Http/Controllers/Realty/`
> **Ветка prod:** `dev`
> **Статус:** production

## Назначение

Управление объектами недвижимости агента: создание, редактирование, фото, документы, информация о собственнике, условия сделки, публикация. Модуль — **ядро продукта**: через него проходит каждый лид и каждая транзакция.

Включает три под-системы:
- **Realty** (основная) — CRUD объектов, жизненный цикл.
- **Realty/Prompts** — AI-генерация описаний через OpenAI. Подробности — Волна 5.
- **Realty/Widget** — встраиваемый блок заказа услуг под карточкой объекта. Подробности — Волна 5.

## Ключевые сущности

### Главные модели (`app/Models/Realty/`)

| Модель | Описание |
|---|---|
| `Realty` | Корневая сущность объекта. Содержит тип (`apartment`/`house`/`land_plot`), статус, общую цену, ссылки на подтипы |
| `Apartment` | Данные квартиры: этаж, комнаты, площади, ремонт, вид из окон |
| `ApartmentBuilding` | Данные здания: год постройки, тип материала, лифт, парковка, отопление, газ, водоснабжение |
| `House` | Данные дома: материал стен, этажность, общая/жилая площадь, тип канализации, отопление |
| `LandPlot` | Участок: тип использования, площадь, коммуникации |
| `Room` | Комнаты квартиры (с типом, площадью) |
| `NewApartmentInfo` | Данные о новостройке: застройщик, ЖК, тип лица (физ/юр), отделка, загружается ДДУ |
| `Location` | Геолокация (координаты, адрес — интегрирован с Dadata) |
| `RealtyDealTerms` | Условия сделки: цена, тип продажи, комиссия (процент/фикс), откуда клиент, кто публикует |
| `RealtyOwnerInfo` | Собственник(и): ФИО, паспортные данные, тип (физ/юр), ссылки на документы |
| `Share` / `ShareOwnership` | Доли собственности (если объект в долевой собственности) |

### Enum-модели

Все перечисляемые значения — отдельные таблицы / классы: `RealtyType`, `RealtyStatus`, `RealtyAggregatedStatus`, `ApartmentType`, `ApartmentRoomType`, `ApartmentBuildingType`, `ApartmentBuildingParking`, `ApartmentBuildingHeatingSystem`, `ApartmentBuildingWaterSystem`, `ApartmentWindowsView`, `HouseType`, `HouseMaterial`, `HouseCondition`, `HouseHeatingType`, `HouseBathroomLocation`, `HouseLandType`, `LandPlotType`, `DrainageType`, `GasType`, `WaterType`, `RepairType`, `RoomCount`, `PhotoCategory`, `RealtyDealTermsCommissionType`, `RealtyDealTermsCommissionShare`, `RealtyDealTermsSellType`, `RealtyDealTermsHeardFrom`, `NewApartmentInfoDecoration`, `NewApartmentInfoPersonType`, `RealtyOwnerInfoType`, `RealtyOwnerInfoPublishedBy`.

### Типы подобъектов (по `realty.type`)

```
realty.type = 'apartment'   → связан с apartment (hasOne), apartment → apartment_building
            = 'house'       → связан с house (hasOne)
            = 'land_plot'   → связан с land_plot (hasOne)
```

### Статусы

Два уровня:

- `realty.status` — внутренний статус (`draft`, `active`, `archived`, …).
- `realty.aggregated_status` — сводный (учитывает публикации на площадках): `draft`, `in_moderation`, `published`, `archived`, `rejected`.

### Полиморфные связи

- Фото, документы, видео — через **Spatie Media Library** (`media` таблица, полиморфное). Коллекции:
  - `photos` (с категориями — PhotoCategory: комната, кухня, фасад, план и т.п.)
  - `owner_documents`
  - `ddu_files` (для новостроек)

### Новая микроархитектура `Realty/Realty/`

В `app/Realty/Realty/` появляется параллельная доменная структура (events, rules, value-objects):
- `RealtyPublished` event — выстреливает при публикации.
- `CadastralNumber` — value-object для кадастрового номера.
- `CadastralNumberRule` — валидатор.

Это **переход к более чистой DDD-организации**. Старые модели в `app/Models/Realty/` работают, но новый функционал идёт сюда.

## API-эндпоинты (публичные, `auth:user`)

Префикс: `/realties`. Controller: `app/Http/Controllers/Realty/Public/RealtyController.php` (+ `RealtyAiGenerationController`, `WidgetController`).

### Список и создание

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/realties/settings` | Настройки: город по умолчанию, регион, какие поля доступны |
| `GET` | `/realties` | Список объектов агента (пагинация + фильтры) |
| `POST` | `/realties` | Создать draft (только тип — apartment/house/land — и базовые поля) |

### Работа с конкретным объектом `{realty_id}`

#### Базовое

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/realties/{id}` | Полный объект со всеми под-сущностями |
| `DELETE` | `/realties/{id}` | Удалить (hard или soft — см. код) |
| `POST` | `/realties/{id}/archive` | В архив (освобождает слот в тарифе) |
| `POST` | `/realties/{id}/restore` | Восстановить из архива |
| `POST` | `/realties/{id}/publish` | Запустить публикацию на целевые площадки |

#### Редактирование типов

| Метод | URL | Описание |
|---|---|---|
| `PUT` | `/realties/{id}/apartment` | Обновить поля квартиры |
| `PUT` | `/realties/{id}/apartment/building` | Обновить данные здания |
| `PUT` | `/realties/{id}/house` | Обновить поля дома |
| `PUT` | `/realties/{id}/land-plot` | Обновить поля участка |

#### Локация, сделка, описание, видео, доля

| Метод | URL | Описание |
|---|---|---|
| `PUT` | `/realties/{id}/location` | Адрес + координаты (валидация через Dadata) |
| `PUT` | `/realties/{id}/deal-terms` | Условия сделки (цена, комиссия, тип продажи) |
| `PUT` | `/realties/{id}/description` | Ручное описание (текст) |
| `PUT` | `/realties/{id}/video-url` | URL видео (YouTube/RuTube) |
| `PUT` | `/realties/{id}/share` | Доля собственности |

#### Новостройка (ДДУ)

| Метод | URL | Описание |
|---|---|---|
| `PUT` | `/realties/{id}/new-apartment-info` | Данные о новостройке (ЖК, застройщик, отделка) |
| `POST` | `/realties/{id}/new-apartment-info/ddu` | Загрузить скан ДДУ (multipart) |

#### Собственник

| Метод | URL | Описание |
|---|---|---|
| `PUT` | `/realties/{id}/owner-info` | ФИО, паспорт, ИНН, тип (физ/юр) |
| `POST` | `/realties/{id}/owner-info/files` | Загрузить документ собственника |
| `DELETE` | `/realties/{id}/owner-info/files/{file_uuid}` | Удалить документ |

#### Фото

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/realties/{id}/photos` | Загрузить фото (multipart, категория — параметр) |
| `POST` | `/realties/{id}/photos/reorder` | Переупорядочить фото (массив UUID'ов) |
| `PATCH` | `/realties/{id}/photos/{photo_uuid}` | Обновить категорию / описание фото |
| `DELETE` | `/realties/{id}/photos/{photo_uuid}` | Удалить фото |

#### Комнаты (только для квартир)

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/realties/{id}/rooms` | Добавить комнату (тип, площадь) |
| `PATCH` | `/realties/{id}/rooms/{room_id}` | Обновить комнату |
| `DELETE` | `/realties/{id}/rooms/{room_id}` | Удалить комнату |

#### AI-описание

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/realties/{id}/description/generate/eligible` | Проверить, можно ли генерировать (подписка + заполненность полей) |
| `POST` | `/realties/{id}/description/generate` | Запустить генерацию через OpenAI (см. Realty/Prompts, Волна 5) |

#### Public Offer (публичное предложение)

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/realties/{id}/offer` | Публичная страница объекта. **Без `auth:user`** — открыт для клиентов агента |

#### Widget (встраиваемый блок услуг)

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/realties/{id}/widget` | Конфигурация виджета для этого объекта |
| `POST` | `/realties/{id}/widget/order` | Заказать услуги из виджета (массив `widget_item_id`) |

## Сервисы и бизнес-логика

### Основные сервисы

| Сервис | Путь | Что делает |
|---|---|---|
| `RealtyService` | `app/Services/Realties/RealtyService.php` (интерфейс `app/Contracts/Services/Realties/RealtyService.php`) | CRUD объектов |
| `RealtyUpdateService` | `app/Services/Realties/RealtyUpdateService.php` (интерфейс там же) | Обновления всех подтипов (apartment/house/land, deal terms, owner info и т.д.) — принимает Context-DTO (`UpdateApartmentInfoContext`, `UpdateDealTermsContext`, ...) |
| `RealtyStateService` | `app/Services/Realties/RealtyStateService.php` | Смена статусов: archive/restore/publish |
| `RealtyPromptAiService` (+ `DefaultRealtyPromptAiService`) | `app/Realty/Prompts/Services/` | Генерация описаний через OpenAI |
| `RealtyPromptService`, `RealtyPromptTemplatingService` (+ Default*) | `app/Realty/Prompts/Services/` | Управление промптами, подстановка переменных |
| `WidgetService`, `WidgetOrderService` (+ Default*) | `app/Realty/Widget/Services/` | Виджет и заказы из него |

Отдельного `RealtyPublicationService` **нет** — публикация запускается через `PublishingService` из модуля Publishings (вызов из `RealtyStateService::publish` или из `PublishingController`).

### События

- `RealtyPublished` (`app/Realty/Realty/Events/RealtyPublished.php`) — выстреливает при успешной публикации. Слушатели: Telegram-уведомление, AmoCRM event dispatch.

### Jobs

Публикация на площадках часто асинхронная (см. модуль `Publishings`, Волна 3). Jobs:
- Публикация на Avito (job в `Publishings/`)
- Публикация на CIAN (job в `Publishings/`)
- Обновление feeds для ДомКлик (Scheduled или cron)

## AI-описания (коротко)

В `app/Realty/Prompts/Models/Enrichment/` — 20+ классов переменных для подстановки в шаблон:
`Address`, `AllFieldsJson`, `BuiltYear`, `City`, `CombinedBathroomCount`, `FederalDistrict`, `FloorCount`, `Floor`, `HasBalcony`, `HasLoggia`, `HouseArea`, `KitchenArea`, `LivingArea`, `Price`, `RepairType`, `RoomCount`, `SellType`, `SeparateBathroomCount`, `TotalArea`, `Type`.

Как работает:
1. Админ создаёт `RealtyPrompt` (шаблон) с переменными.
2. Юзер нажимает «Сгенерировать описание» в ЛК.
3. `RealtyAiGenerationController::isRealtyEligibleForGeneration` проверяет подписку и заполненность полей.
4. `RealtyAiGenerationController::generateDescription` вызывает `RealtyPromptAiService` → OpenAI → результат в `realty.description`.

Детально — в [02-modules/realty-prompts.md](./realty-prompts.md) (Волна 5) и ТЗ `_sources/05-ai-descriptions.md`.

## Widget (коротко)

Widget показывается под public-offer'ом объекта и в ЛК. Состоит из `WidgetItem` (пункт меню: услуга или лид-магнит). Юзер может `POST /realties/{id}/widget/order` — выбрать пункты, сформируется `WidgetOrder` → далее как заявки на услуги.

Детально — [02-modules/widget.md](./widget.md) (Волна 5).

## Интеграции

| Интеграция | Что используется |
|---|---|
| **Avito API** | Публикация, получение статистики, звонки (`Publishings` модуль) |
| **CIAN API** | То же самое |
| **ДомКлик** | Статический feed-файл (`FeedController`) |
| **Dadata** | Валидация адресов через `Location` (proxy-endpoint `/proxy/dadata/suggestions/*`) |
| **OpenAI** | Генерация описаний (`Realty/Prompts`) |
| **AWS S3** | Хранение фото/видео/документов через Spatie Media Library |
| **AmoCRM** | Публикация → event → dispatch в CRM |
| **Telegram** | Уведомления агенту о статусах публикации |

## Frontend-привязка

| Страница | URL frontend | Использует |
|---|---|---|
| Список объектов | `/my/realties` | `GET /realties` |
| Карточка объекта (детали) | `/my/realties/{id}` | `GET /realties/{id}` + все `PUT /realties/{id}/*` |
| Создание объекта (multi-step wizard) | `/my/realties/new` | `POST /realties` → все `PUT` для заполнения шагов |
| Публичное предложение | `/offer/{realty_id}` (отдельный роут без auth) | `GET /realties/{id}/offer` |

Frontend использует **многошаговую форму** (wizard):
1. Тип объекта → 2. Локация → 3. Детали (apartment/house/land) → 4. Фото → 5. Собственник → 6. Условия сделки → 7. Публикация.

## Rate Limits

Специфичных throttle для `/realties/*` в роутинге нет. Лимиты определяются **подпиской** — количеством активных публикаций (3 / 5 / 10 по тарифам).

## Известные ограничения и техдолг

- **Модели в двух местах**: основная часть в `app/Models/Realty/`, новая микроархитектура в `app/Realty/Realty/`. Нужна миграция, не начата.
- **Архивирование — soft**: `DELETE /realties/{realty_id}` работает в паре с `POST /realties/{realty_id}/archive` (перевод в `archived`) и `POST .../restore` (восстановление). Hard delete из публичного API недоступен.
- **Photo reorder** полагается на клиентский порядок — нет серверной валидации, что все UUID'ы принадлежат этому объекту.
- **Кадастровый номер** — введён недавно (`CadastralNumber` value-object), но не все старые объекты имеют его.
- **NewApartmentInfo**: загрузка ДДУ — один файл, нет версионирования.
- **Widget items**: модель есть, admin API тоже есть (`/admin/services/{service_id}/widget/{activate,deactivate}`, `GET/PUT /admin/services/{service_id}/widget/`). Наличие соответствующего UI на `admin.rspace.pro` — подтверждать визуально при прохождении Волны 7 (скриншоты).

## Связанные разделы

- [publishings.md](./publishings.md) — публикация на Avito/CIAN/DomClick (Волна 3).
- [leads.md](./leads.md) — входящие лиды от публикаций (Волна 3).
- [realty-prompts.md](./realty-prompts.md) — AI-генерация описаний (Волна 5).
- [widget.md](./widget.md) — встраиваемый блок услуг (Волна 5).
- [../03-api-reference/realties.md](../03-api-reference/realties.md) — все эндпоинты с примерами payload.
- [../05-integrations/openai.md](../05-integrations/openai.md) — интеграция OpenAI (Волна 5).

## Ссылки GitLab

- [RealtyController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Realty/Public/RealtyController.php)
- [Realty.php model](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Models/Realty/Realty.php)
- [Realty/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Realty)
- [Models/Realty/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Models/Realty)
