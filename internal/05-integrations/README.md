# 05. Интеграции

Каждая внешняя система, с которой работает RSpace, описана отдельным файлом. Источник истины: `app/<Domain>/` + `config/services.php` + `.env.example` в `rspase/project/backend` (ветка `dev`).

## Карта интеграций

| Интеграция | Тип | Направление | Файл | Волна |
|---|---|---|---|---|
| **Avito API** | классифайд | bidirectional | [avito.md](./avito.md) | 3 ✅ |
| **CIAN API** | классифайд | bidirectional | [cian.md](./cian.md) | 3 ✅ |
| **ДомКлик** | классифайд | outbound (feed) | [domclick.md](./domclick.md) | 3 ✅ |
| **CloudPayments** | платежи | bi (out + webhook in) | [cloudpayments.md](./cloudpayments.md) | 4 |
| **AmoCRM** | CRM | outbound | [amocrm.md](./amocrm.md) | 4 |
| **OpenAI** | AI | outbound | [openai.md](./openai.md) | 5 |
| **Telegram Bot** | мессенджер | bi | [telegram.md](./telegram.md) | 5 |
| **JivoSite** | чаты | webhook in | [jivosite.md](./jivosite.md) | 5 |
| **Dadata** | suggestions | outbound | [dadata.md](./dadata.md) | 5 |
| **Yandex Metrika** | аналитика | outbound | [yandex-metrika.md](./yandex-metrika.md) | 9 |
| **Yandex.Disk + Google Sheets** | импорт лидов | pull-источник | [yandex-disk-leads.md](./yandex-disk-leads.md) | 9 |
| **PostHog** | аналитика | outbound | [posthog.md](./posthog.md) | 9 |
| **SMS** | уведомления | outbound | [sms.md](./sms.md) | 5 |

## Общие принципы

- **Все ключи** — в `.env` (не коммитим). `.env.example` — шаблон со списком переменных без значений.
- **Секреты** в проде — в отдельном репо `rspase/secrets/dev/*` (автоматически монтируются CI при деплое).
- **Webhook-секреты** — HMAC-подписи для CloudPayments; токены в URL для JivoSite и Telegram.
- **Retry-логика** — там, где возможна временная недоступность провайдера (AmoCRM, SMS, Avito/CIAN). См. Волну 4 (AmoCRM — exponential backoff 5 попыток: 60с, 60с, 300с, 3600с, 43200с).
- **Rate limits** — у Avito и CIAN жёсткие (не публичные; мониторится через логи). У OpenAI — по минутам/токенам. У CloudPayments — нет на наш объём.
- **Fallback** — где интеграция критична (например публикация на Avito), падение логируется и попадает в админку; юзер видит ошибку в карточке объекта.

## Как читать страницы интеграций

Каждая страница содержит:
- Назначение + поставщик + контакты (если есть).
- Env-переменные и конфигурация.
- Клиент (класс, методы).
- Сценарии (flow) с Mermaid-диаграммами.
- Webhooks (если входящие).
- Обработка ошибок и retry.
- Лимиты и квоты.
- Known issues.
- Инструкции по тестированию локально.

Шаблон — `_templates/internal-integration.md`.

## Ссылки

- [../02-modules/](../02-modules/) — бизнес-доменные модули, использующие интеграции.
- [config/services.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/config/services.php) — регистрация провайдеров.
