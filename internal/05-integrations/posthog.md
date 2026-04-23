# Интеграция: PostHog

> **Тип:** аналитика продукта (product analytics)
> **Направление:** outbound
> **Статус:** ⚠️ настроен, **не активирован** на lk.rspace.pro; активен на лендинге

## Назначение

Продуктовая аналитика — что делают пользователи в кабинете (события, воронки, cohort'ы), session replay, feature flags.

В отличие от Яндекс.Метрики (заточена под лендинг) — PostHog планировался для **поведения в кабинете**: какие фичи используют, где отваливаются, как часто заходят.

## Состояние

| Компонент | Статус |
|---|---|
| **Landing** (rspace.pro) | ✅ работает через reverse proxy `/api/ingest` → `eu.posthog.com` |
| **Frontend (lk)** | ⚠️ провайдер импортирован в `root.tsx`, **не обёрнут** в Layout → не активен |
| **Backend** | ⚠️ `posthog/posthog-php: ^4.0` стоит в composer.json, `POSTHOG_API_KEY` и `POSTHOG_HOST` заведены в `config/services.php`, **но в `app/` на 2026-04-23 нет ни одного файла, упоминающего PostHog-клиент**. Серверных событий не отправляется. Провайдер установлен «на будущее» |

## Конфигурация

### Env-переменные

```
POSTHOG_API_KEY=phc_ceBRTYsii5vExxrQeborWpMoTwGVBw9fVSSFT8OVOGN
POSTHOG_HOST=https://eu.posthog.com      # EU region (РФ-хостинг)
```

**Project ID:** `132162` (EU).

### Reverse proxy на лендинге

Landing `next.config.ts` настроен так, что запросы на `/api/ingest/*` проксируются на `https://eu.posthog.com/*`. Это:
- Обходит блокировщики рекламы (у многих стоит `posthog.com` в blocklist).
- Скрывает что используется PostHog (антитрекер-защита).
- Cookies идут с основного домена (нет CORS/SameSite проблем).

## Код

### Landing
- `src/components/posthog-provider.tsx` (TBD точное имя)
- Хук для трекинга событий внутри компонентов.

### Frontend (lk)
`app/providers/posthog.tsx` (или аналогично) — провайдер. **Не обёрнут** в Layout → события не идут.

**Фикс:** в `root.tsx` обернуть приложение:
```tsx
<PostHogProvider client={posthog}>
  <Layout>...</Layout>
</PostHogProvider>
```

### Backend (`posthog-php`)
Сервер-сайд события через SDK:
```php
use PostHog\PostHog;
PostHog::init('phc_xxx', ['host' => 'https://eu.posthog.com']);
PostHog::capture(['distinctId' => $user->id, 'event' => 'subscription_paid']);
```

**TBD:** проверить, для каких событий backend шлёт в PostHog.

## Типы событий

### Auto-tracked (автоматически)
- `$pageview` — просмотр страницы.
- `$pageleave` — уход со страницы.
- `$autocapture` — клики на кнопки, формы, ссылки.

### Custom events (ручные)
- `signup_completed` — регистрация.
- `realty_created` — создан объект.
- `realty_published` — опубликован на площадках.
- `subscription_subscribed` — оформлена подписка.
- `payment_failed` — ошибка платежа.
- `lead_received` — пришёл лид.

**Точные имена events** и их параметры — в коде `frontend/app/hooks/use-posthog.ts` (TBD).

## Feature Flags (в планах)

PostHog поддерживает feature flags — можно включать/выключать фичи для конкретных юзеров без деплоя.

**Use case для RSpace:**
- Beta-пользователи видят AI-юриста на Профи.
- A/B пробного периода 30 vs 60 дней.
- Новый UI сначала для 10% юзеров.

Сейчас **не используется** — все фичи статичны.

## Session Replay

PostHog может записывать сессии (записать, как юзер кликал). **Не активирован** сейчас. В planned — для QA / support (разобрать обращение «у меня всё сломалось»).

## GDPR и PII

PostHog EU-регион = хранение в Европе (ок с 152-ФЗ нет обязательных вопросов, т.к. агенты-риелторы РФ, но для безопасности — ок).

Не отправляем:
- Пароли, карты, паспорта.
- Контакты клиентов объектов.

Отправляем:
- User ID (`users.id` или `external_key`).
- UTM-метки.
- Действия в UI.

## Known issues

- **Frontend провайдер не обёрнут** — главный блокер (P0 по паспорту: «PostHog blind spot»).
- **Server-side events** — в backend есть SDK, но не все критичные события шлются.
- **Feature flags не используются** — продукт с ними мог бы гибче A/B-тестировать.
- **Session replay выключен** — упускаем потенциал для поддержки.
- **Cost monitoring** — TBD, кто следит за usage на PostHog (платный план по events).

## Связанные разделы

- [07. Frontend](../07-frontend.md) — где обернуть провайдер.
- [08. Landing](../08-landing.md) — где работает.
- [yandex-metrika.md](./yandex-metrika.md) — вторая аналитика.
- [14. Tech Debt](../14-tech-debt.md) — P0 пункт.

## Ссылки

- [PostHog docs](https://posthog.com/docs)
- [Landing repo](https://git.rs-app.ru/rspase/landing/next)
- [Frontend repo](https://git.rs-app.ru/rspase/project/frontend)
