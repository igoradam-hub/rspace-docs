# API: Feeds

Outbound feeds для классифайдов. Префикс: `/feed`. **Без `auth`** — доступны для pull со стороны площадок.

## Эндпоинты

### `GET /feed/avito`

XML-feed с активными объектами в формате, совместимом с Avito. Controller: `app/Http/Controllers/Feeds/FeedController.php::getAvitoFeed`.

**Route name:** `Api::AVITO_FEED`.

Используется:
- Как резерв, если API-публикация на Avito не прошла.
- Партнёрские пуллы (TBD кем).

### `GET /feed/cian`

XML-feed для ЦИАН. `FeedController::getCianFeed`.

**Route name:** `Api::CIAN_FEED`.

Используется:
- Как резерв.
- Возможно, ЦИАН пуллит feed (уточнить).

## Формат

Стандартный Avito/CIAN YML/XML — точная структура зависит от `FeedType` (`app/Models/Feeds/FeedType.php`). Обычно содержит:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Ads formatVersion="3" target="Avito.ru">
    <Ad>
        <Id>123</Id>
        <Category>Квартиры</Category>
        <OperationType>Продам</OperationType>
        <Address>...</Address>
        <Price>18900000</Price>
        <Images>
            <Image url="..." />
        </Images>
        <Description>...</Description>
        <!-- ... -->
    </Ad>
</Ads>
```

## ДомКлик

Отдельного endpoint `/feed/domclick` **в коде не обнаружено**. Подробнее о механизме интеграции с ДомКлик — [../05-integrations/domclick.md](../05-integrations/domclick.md). Возможно, используется один из существующих feed'ов или feed-ы не нужны (интеграция через партнёрский кабинет).

## Безопасность

Feeds публично доступны — данные объектов уже публичные (цена, адрес, описание). Персональные данные (паспорт собственника, внутренние заметки) в feed не попадают.

## Кеширование

Вероятно, feeds кешируются на уровне ответа (ETag / Cache-Control) — точные настройки TBD, в коде `FeedController` нужно проверить.

## Ссылки

- [FeedController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Feeds/FeedController.php)
- [routes/api.php — /feed/*](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/routes/api.php)
- [../05-integrations/domclick.md](../05-integrations/domclick.md)
