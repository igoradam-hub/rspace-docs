# API: Settings (Public Offer)

Настройки публичной страницы объекта. Префикс: `/settings/offer`. Middleware: **без явной `auth:user` в группе** — но контроллер проверяет авторизацию.

Controller: `app/Http/Controllers/Settings/OfferSettingsController.php`.

## `GET /settings/offer`

Получить текущие настройки public-offer юзера.

**Ответ:**
```json
{
  "data": {
    "logo_url": "https://s3.../logo.png",
    "brand_color": "#cdf757",
    "bio_text": "Опытный риелтор...",
    "custom_phone": "+79001234567"
  }
}
```

## `PUT /settings/offer`

Обновить настройки.

**Request body:**
```json
{
  "brand_color": "#f331ab",
  "bio_text": "..."
}
```

## `POST /settings/offer/logo`

Загрузить логотип. `multipart/form-data`, `file` (PNG/SVG, до 2 МБ).

**Ответ:**
```json
{ "data": { "logo_url": "https://s3..." } }
```

## `DELETE /settings/offer/logo`

Удалить логотип.

**Ответ:** `204`.

---

## Что это настраивает

**Public offer** — публичная страница объекта, которую агент шлёт клиенту:
`https://rspace.pro/offer/{realty_id}` (или через `lk.rspace.pro/offer/{id}`).

С этими настройками — страница рендерится с:
- Лого и брендом агента.
- Его текстом.
- Его публичным телефоном.

Детали — [External: Настройки](../../external/12-settings.md) и [Realty модуль](../02-modules/realty.md).

## Ссылки

- [OfferSettingsController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Settings/OfferSettingsController.php)
