# Модуль: [Название]

> **Домен:** [Identity / Realty / Publishings / Subscriptions / Billing / Services / Scoring / ...]
> **Репозиторий:** [backend / frontend / landing]
> **Путь:** `app/<PathInCode>/`
> **Ответственный:** [имя / команда / TBD]
> **Статус:** [production / WIP / deprecated]

## Назначение

[1-3 предложения: что делает модуль, какую бизнес-задачу закрывает. Без маркетинга.]

## Ключевые сущности

| Модель | Таблица | Описание | Связи |
|---|---|---|---|
| `ModelName` | `model_names` | Что представляет | `hasMany: X`, `belongsTo: Y` |

## Модели

### `ModelName`

**Путь:** `backend/app/<Path>/Models/ModelName.php`

**Поля:**
| Поле | Тип | Описание |
|---|---|---|
| `id` | `bigint` | PK |
| `field` | `string` | ... |

**Связи:**
- `belongsTo(User::class)`
- `hasMany(OtherModel::class)`

**Enum-значения** (если есть):
- `status`: `draft` / `active` / `archived`

## API-эндпоинты

| Метод | URL | Контроллер | Описание |
|---|---|---|---|
| `GET` | `/api/resource` | `ResourceController@index` | Список |
| `POST` | `/api/resource` | `ResourceController@store` | Создать |
| `PATCH` | `/api/resource/{id}` | `ResourceController@update` | Обновить |

Подробные описания эндпоинтов — в `internal/03-api-reference/`.

## Сервисы и бизнес-логика

### `ServiceName`

**Путь:** `backend/app/<Path>/Services/ServiceName.php`

[Что делает, какие методы-точки входа, какие зависимости.]

## События и очереди

**События:**
- `EventName` — вызывается при [условие]. Обработчики: [список].

**Jobs:**
- `JobName` — запускается [триггер]. Очередь: [default / webhooks / ...]. Retry: [N раз с backoff].

**Scheduled commands** (если есть):
- `command:name` — cron-расписание: `* * * * *`.

## Интеграции

[Если модуль вызывает внешние API — указать какие, с ссылкой на раздел «Интеграции».]

## Frontend-привязка

**Путь:** `frontend/app/<path>/`

[Какие страницы кабинета используют API модуля. React Router routes, основные компоненты.]

## Состояние / known issues

- [Баги / технический долг, если есть]

## Ссылки

- GitLab: [URL на папку]
- Миграции: [последние значимые]
- Тесты: [пути]
