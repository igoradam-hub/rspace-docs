# Интеграция: CIAN API

> **Тип:** классифайд (публикация объектов)
> **Направление:** bidirectional
> **Статус:** production

## Назначение

Публикация объектов на ЦИАН, получение статистики и звонков. Зеркальна Avito по смыслу, но имеет отличия в API и workflow.

## Поставщик

- **ЦИАН** (https://www.cian.ru) — лидер по объявлениям недвижимости в РФ, особенно по Москве и СПб.
- **API:** партнёрский, через CIAN Business Account.
- **Отличия от Avito:**
  - Более строгая модерация.
  - Платные «услуги продвижения» заказываются только через заявку (не онлайн).
  - Звонки — часть без записей (нужен платный тариф площадки).

## Конфигурация

Конфиг в `config/integration.php` (вместе с Avito):

```php
'cian' => [
    'enabled' => env('CIAN_INTEGRATION_ENABLED', false),
    'credentials' => [
        'access_token' => env('CIAN_ACCESS_TOKEN'),
    ],
],
```

Env-переменные из `.env.example`:
```
CIAN_INTEGRATION_ENABLED=false
CIAN_ACCESS_TOKEN=
```

**Всего один токен** (не partner_id + api_key, как предполагала старая версия доки). URL и partner_id — хардкодятся в клиенте или определяются CIAN-токеном.

## Код

| Компонент | Путь |
|---|---|
| Выделенного `CianPublishingService` **нет** — логика размещается в контроллере напрямую | — |
| Контроллер публикации | `app/Publishings/Http/Controllers/CianPublishingController.php` |
| NewObject (каталог новостроек) | `app/Services/Cian/NewObject/CianNewObjectService.php` + `CianNewObjectReader.php` + `CianXmlNewObject*.php` |
| Promo-service (общий с Avito) | `app/Services/Publishings/PromotionService.php` |
| Модели | `app/Models/Cian/*` + `app/Models/Publishings/Cian/*` |
| Events | `app/Events/Publishings/Cian/CianPublishingPublished.php`, `CianPublishingStatusChanged.php`, `CianPublishingFeedErrorOccurred.php`, `app/Events/Publishings/Promotion/CianPromotionRequested.php` |

**Tech-debt**: асимметрия с Avito — у Avito есть выделенный `AvitoPublishingService` + `DefaultAvitoPublishingService`, у CIAN только контроллер. Вынесение логики в service-класс облегчит тесты и изоляцию.

## Сценарии

### Публикация

Аналогична Avito (см. [avito.md#1-публикация-объекта-на-avito](./avito.md#1-публикация-объекта-на-avito)), но отличия:

- **Модерация строже**: типичные причины отклонения — недостаточно фото (минимум 3), отсутствие ссылки на ДДУ для новостроек, нечёткое указание юридического статуса.
- **Ответ API**: внешний id — `cian_id`, сохраняется в `CianPublishing.external_id`.

### Получение звонков

```
Cron → SyncLeadsCommand → CianApi::getCalls(sinceTime)
  → для каждого звонка:
    → upsert CianPublishingCall
    → LeadService::createFromExternal(source='cian', phone)
```

**Записи звонков**: у ЦИАН в базовом тарифе их нет. Если у аккаунта подключена услуга «Звонки с записью» (платно), — в `CianPublishingCall.recording_url` будет ссылка. Иначе — только телефон и длительность.

### Запрос на промо (только через админа)

ЦИАН не предоставляет онлайн-оплату продвижения через API. Поэтому:

```
User → POST /publishings/{id}/cian/promotions/request {type, comment}
Backend → CianPromotionRequest (status=pending_admin)
Admin → обрабатывает вручную в ЦИАН-аккаунте RSpace → помечает завершённой в админке
```

В отличие от Avito, **онлайн-заказа (`/promotions/order`) в ЦИАН нет** — только `request`.

## Webhooks (inbound)

Не реализованы — всё через pull.

## Обработка ошибок

Аналогично Avito. Основные ошибки:
- `401` — протух API-ключ. Вручную обновляется в `.env`, автообновления нет (ключ постоянный, не OAuth).
- `429` — rate limit, backoff.
- `400` — невалидные поля (модерация), пометить rejected.
- `503` — недоступность, retry.

## Лимиты и квоты

- **RPS**: точные лимиты у ЦИАН API — **TBD, запросить у саппорта ЦИАН**.
- **Итемов**: зависит от бизнес-тарифа ЦИАН, обычно 200-500.
- **Статистика**: обновляется раз в сутки.

**Стоимость публикации** — из `_sources/01-tariffs-tz.md` (блок Стоимость размещений): **«запросить актуальные данные у Лены Шитовой»**, пока цифр нет в RSpace. Это **open task**.

## Known issues

- **Нет онлайн-оплаты продвижения** — пользователь видит кнопку «Заказать» и ждёт подтверждения админа. UX неидеальный.
- **Звонки без записей** на базовом тарифе — нужно пояснять пользователю.
- **CIAN не высылает webhook'и** — все статусы узнаём через pull, задержка до часа.
- **API-ключ без автообновления** — при его протухании пропадёт функционал, нужен мониторинг.
- **Стоимость размещения CIAN** — не зафиксирована в коде/документации, только «TBD» в ТЗ пересборки. Запрос у Лены Шитовой открыт.

## Связанные разделы

- [avito.md](./avito.md) — зеркальная интеграция.
- [../02-modules/publishings.md](../02-modules/publishings.md).
- [domclick.md](./domclick.md) — третий классифайд (без API, через feed).
- [../03-api-reference/publishings.md](../03-api-reference/publishings.md).

## Ссылки GitLab

- [Models/Publishings/Cian/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Models/Publishings/Cian)
- [CianPublishingController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Publishings/Http/Controllers/CianPublishingController.php)
