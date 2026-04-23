# 02. Домены и модули

Backend RSpace организован по **доменам** — каждый домен живёт в отдельной папке `app/<Domain>/` с собственными моделями, сервисами, контроллерами и эндпоинтами. Структура близка к DDD: границы доменов явные, пересечения минимальные.

Это index-страница. Каждый крупный домен — отдельный файл ниже.

## Текущие домены (по GitLab `dev`)

```
backend/app/
├── Identity/           → identity.md        — регистрация, SMS, токены, профиль
├── Realty/             → realty.md          — квартиры/дома/участки, фото, документы
├── Publishings/        → publishings.md     — Avito/CIAN/DomClick
├── Leads/              → leads.md           — входящие лиды
├── Subscriptions/      → subscriptions.md   — тарифы, планы, подписки
│
├── (в Http/Controllers/Billing/)  → billing.md         — баланс, платежи, CP, промокоды
├── (в Http/Controllers/Services/) → services.md        — заявки на услуги
├── Scoring/            → scoring.md         — проверки (собственник/объект)
├── Realty/Widget/      → widget.md          — встраиваемый блок услуг
├── Realty/Prompts/     → realty-prompts.md  — AI-генерация описаний
├── Onboarding/         → onboarding.md      — прогресс пользователя
├── Telegram/           → telegram.md        — бот-интеграция
├── AmoCrm/             → amocrm.md          — sync лидов в CRM
├── Jivo/               → jivo.md            — webhook от чатов
├── OpenAi/             → openai.md          — клиент GPT
├── Monitoring/         → monitoring.md      — внешние балансы, алерты
│
├── Core/               — общие утилиты, базовые классы
├── Entities/           — DB-сущности (частично старые)
├── Models/             — Eloquent-модели
├── Events/             — Laravel-события
├── Listeners/          — обработчики событий
├── Jobs/               — фоновые задачи
├── Notifications/      — Laravel-нотификации
├── Policies/           — авторизация (Gate)
├── QueryBuilders/      — кастомные Eloquent-билдеры
├── Rules/              — кастомные валидаторы
├── Services/           — общие сервисы (не доменные)
├── Sms/                — SMS-провайдер (sms.ru + logs-driver для локалки)
├── Reporting/          — отчёты (админка, xlsx-экспорт)
├── OpenApi/            — OpenAPI-аннотации (Scribe/Swagger-PHP)
├── Console/            — Artisan-команды
├── Http/               — контроллеры, middleware, requests, resources
├── Providers/          — Laravel service providers
└── Contracts/          — интерфейсы
```

## Покрытие документации (Волна 2)

Эта волна покрывает **5 core-модулей**: Identity, Realty, Publishings, Subscriptions, Billing. Остальные — в следующих волнах:

| Модуль | Волна | Статус |
|---|---|---|
| Identity | 2 | ✅ этот раунд |
| Realty | 2 | ✅ |
| Publishings | 3 | pending |
| Leads | 3 | pending |
| Subscriptions | 2 | ✅ |
| Billing | 4 | pending (core-часть здесь) |
| Services | 5 | pending |
| Scoring | 5 | pending |
| Realty/Widget | 5 | pending |
| Realty/Prompts | 5 | pending |
| Onboarding | 2 | ✅ (кратко) |
| Telegram | 5 | pending |
| AmoCrm | 4 | pending |
| Jivo | 5 | pending |
| OpenAi | 5 | pending |

## Как читать карточки модулей

Каждая страница модуля содержит:

- **Назначение** — 1-3 предложения.
- **Ключевые сущности** — таблица моделей.
- **API-эндпоинты** — публичные и (если есть) admin.
- **Сервисы и бизнес-логика** — классы Service, что они делают.
- **События и очереди** — Laravel-события, Jobs, cron.
- **Интеграции** — внешние системы, с которыми работает модуль.
- **Frontend-привязка** — страницы кабинета, использующие модуль.
- **Known issues** — что известно о проблемах/техдолге.

## Смежные разделы

- [01. Архитектура](../01-architecture.md) — общая картина.
- [03. API Reference](../03-api-reference/) — эндпоинты с подробностями.
- [04. База данных](../04-database.md) — PostgreSQL-схема (Волна 8).
- [05. Интеграции](../05-integrations/) — CloudPayments, AmoCRM, Avito, CIAN и пр.
