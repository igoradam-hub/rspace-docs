# Модуль: Realty Prompts (AI-генерация описаний)

> **Домен:** Realty / Prompts (AI-генерация описаний объектов)
> **Репозиторий:** `rspase/project/backend`
> **Путь:** `backend/app/Realty/Prompts/`
> **Ветка prod:** `dev`
> **Статус:** WIP → production (MVP в проде)

## Назначение

Автогенерация текстового описания объекта на базе заполненных полей (площадь, комнаты, адрес, ремонт и т.д.) через OpenAI (GPT). Избавляет агентов от написания однотипных описаний.

Подробная бизнес-логика и ТЗ — в `_sources/05-ai-descriptions.md`.

## Ключевые сущности

| Модель | Путь | Описание |
|---|---|---|
| `RealtyPrompt` | `app/Realty/Prompts/Models/RealtyPrompt.php` | Шаблон промпта для AI: title, template-строка с переменными, параметры OpenAI (модель, temperature, max_tokens) |
| `RealtyPromptQuery` | там же | Кастомный query-builder |
| `Settings` | там же | Глобальные настройки генерации (включена/выключена, лимиты) |

### Переменные в шаблоне

В `app/Realty/Prompts/Models/Enrichment/` — **20+ классов-переменных**, каждый инкапсулирует одно поле объекта для подстановки в промпт:

```
AddressVariable, CityVariable, FederalDistrictVariable, AllFieldsJsonVariable,
BuiltYearVariable, FloorVariable, FloorCountVariable, HouseAreaVariable,
TotalAreaVariable, LivingAreaVariable, KitchenAreaVariable, RoomCountVariable,
RepairTypeVariable, HasBalconyVariable, HasLoggiaVariable,
CombinedBathroomCountVariable, SeparateBathroomCountVariable,
PriceVariable, SellTypeVariable, TypeVariable
```

Все наследуются от `TemplateVariable`. Шаблон промпта выглядит:

```
Напиши описание квартиры: {{room_count}}-комнатная, {{total_area}} м²,
расположена на {{floor}} этаже в доме {{built_year}} года постройки.
Ремонт: {{repair_type}}. Цена: {{price}} рублей.
Адрес: {{address}}, {{city}}.
Стиль: коммерческий, для сайта объявлений, 3-5 предложений.
```

При генерации — движок подставляет актуальные значения из объекта.

## API-эндпоинты

### Публичные (`auth:user`)

Live эндпоинты под `/realties/{id}/description/`:

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/realties/{id}/description/generate/eligible` | Проверка: можно ли сейчас генерировать (подписка, заполненность, лимит) |
| `POST` | `/realties/{id}/description/generate` | Сгенерировать (GPT call, сохранение в `realty.description`) |

Controller: `app/Realty/Prompts/Http/Controllers/RealtyAiGenerationController.php`.

### Admin (`auth:admin`)

- CRUD `RealtyPrompt` (создать/обновить/удалить).
- Активация одного из промптов как «текущий».
- Список доступных переменных (для UI подсказки).

Controller: `app/Realty/Prompts/Http/Controllers/AdminRealtyPromptsController.php`.

## Сервисы

| Сервис | Путь | Что делает |
|---|---|---|
| `RealtyPromptService` / `DefaultRealtyPromptService` | `app/Realty/Prompts/Services/` | CRUD шаблонов, валидация |
| `RealtyPromptTemplatingService` / `DefaultRealtyPromptTemplatingService` | там же | Подстановка переменных в шаблон |
| `RealtyPromptAiService` / `DefaultRealtyPromptAiService` | там же | Вызов OpenAI через `OpenAiService` |

## Flow

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant OpenAI

    User->>Backend: GET /realties/{id}/description/generate/eligible
    Backend->>Backend: проверка: есть активный RealtyPrompt? подписка активна? обязательные поля заполнены?
    Backend-->>User: {eligible: true}

    User->>Backend: POST /realties/{id}/description/generate
    Backend->>Backend: RealtyPromptTemplatingService::render(realty, prompt)
    Backend->>Backend: Templating заменяет {{variables}} на значения объекта
    Backend->>OpenAI: chat.completions (model, temperature, promptText)
    OpenAI-->>Backend: {content: "Просторная 2-комнатная квартира..."}
    Backend->>Backend: realty.description = content; save
    Backend-->>User: {description: content, prompt_id: X}
```

## Исключения

- `ActivePromptMissingException` — нет активного шаблона.
- `DescriptionGenerationException` — OpenAI упал / вернул мусор.
- `GenerationDisabledException` — генерация выключена в Settings.
- `RealtyNotEligibleException` — объект не готов (нет обязательных полей).

## Политики

- `RealtyPromptPermission`, `RealtyPromptPolicy` — админский доступ к шаблонам.
- `RealtyPromptAiPermission` — доступ юзера к генерации (проверка тарифа).

Сейчас генерация доступна **на всех тарифах, включая триал** (из ТЗ пересборки — не гейтится подпиской напрямую).

## Что собирается в промпт

Из `app/Realty/Prompts/Models/Enrichment/AllFieldsJsonVariable.php` — спецвариант: **вся карточка объекта как JSON** — можно положить в промпт и дать GPT'у сырые данные, чтобы он сам решил, что подчеркнуть.

## Параметры OpenAI

В `app/OpenAi/Models/`:
- `Temperature` — креативность (0-2). В активном промпте на 2026-04-23 — не показана в UI, настраивается в коде.
- `Verbosity` — длина ответа
- `ReasoningEffort` — сколько «размышлять» (для reasoning-моделей OpenAI серии o-). Активное значение в проде на 2026-04-23: **«Глубоко» (`High`)**.

Конкретная модель задаётся в `RealtyPrompt` и настраивается в `admin.rspace.pro/console/prompts`. **В проде на 2026-04-23 активен ровно один промпт:** «Генерация описания объекта v1» (id=1), модель `o4-mini-2025-04-16` (reasoning), уровень мышления «Глубоко».

## Стоимость

Из `_sources/05-ai-descriptions.md`: **~$0.15-0.20 за генерацию** на GPT-4o-mini. Однако в проде используется **o4-mini с reasoning_effort=High** — это **дороже** (reasoning-модели берут в 2-5× больше токенов за счёт внутреннего размышления). Фактическая стоимость на проде — выше оценочной, точное значение зависит от reasoning-токенов. Требует отдельного замера на 100 генерациях.

Для продакшена RSpace это **приемлемо** как часть подписки, не выставляется юзеру отдельно.

## Known issues

- **Нет rate-limit на генерацию на уровне юзера** — если кто-то зациклит, можно наспамить OpenAI. TBD проверить/добавить.
- **Качество зависит от промпта** — shared admin prompt. Если он плох — все получают плохие описания. TBD A/B-testing.
- **Переменные без fallback**: если поле `repair_type` не заполнено, в описание попадёт «Ремонт: null». Нужны defaults. TBD проверить.
- **Генерация синхронная** — юзер ждёт ~10-20 сек. Это приемлемо, но на GPT-4 может тормозить. TBD — перенести в Job?
- **История генераций** не сохраняется (только последнее описание в `realty.description`). Если юзер хочет «верни предыдущий вариант» — нельзя.

## Связанные разделы

- [realty.md](./realty.md) — использует модуль для описаний.
- [../05-integrations/openai.md](../05-integrations/openai.md) — OpenAI клиент.
- `_sources/05-ai-descriptions.md` — ТЗ фичи.

## Ссылки GitLab

- [Realty/Prompts/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Realty/Prompts)
- [RealtyAiGenerationController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Realty/Prompts/Http/Controllers/RealtyAiGenerationController.php)
