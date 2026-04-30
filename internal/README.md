# Внутренняя документация RSpace (Engineering Handbook)

Техническая база для команды разработки, QA, DevOps, продукта.

**Всего файлов:** ~60.
**Язык:** русский + технический английский (термины кода — как в коде).
**Источник правды:** GitLab ветки `dev` (backend + landing), `develop` (frontend). **НЕ `main`/`master`** — они заморожены.

## Оглавление

### Обзорные
- [00. Обзор](./00-overview.md) — продукт, метрики (MRR 105K, 14 paying), команда, глоссарий, навигация
- [01. Архитектура системы](./01-architecture.md) — high-level карта, 3 репо, версии стеков (Laravel 13, React Router 7.11, Next 15.4.8)

### Backend — Доменные модули
→ [02. Индекс модулей](./02-modules/README.md)

| Модуль | Файл | О чём |
|---|---|---|
| Identity | [identity.md](./02-modules/identity.md) | User, SMS-регистрация, Sanctum-токены, Telegram-привязка |
| Realty | [realty.md](./02-modules/realty.md) | Квартиры/дома/участки, 40+ моделей, фото, ДДУ |
| Publishings | [publishings.md](./02-modules/publishings.md) | Avito/ЦИАН/ДомКлик, промо, звонки, lifecycle |
| Leads | [leads.md](./02-modules/leads.md) | Лиды из Avito/CIAN/Jivo, `Lead` модель |
| Subscriptions | [subscriptions.md](./02-modules/subscriptions.md) | Plans, PlanLevelSettings (админ-матрица скидок), Subscription lifecycle |
| Billing | [billing.md](./02-modules/billing.md) | Balance, Compensation, Invoice, CloudPayments, промокоды |
| Services | [services.md](./02-modules/services.md) | ServiceRequest, Charges, лимиты по тарифу |
| Scoring | [scoring.md](./02-modules/scoring.md) | State pattern, 3 типа проверок, PDF-отчёты |
| Widget | [widget.md](./02-modules/widget.md) | Встраиваемый блок услуг на объектах |
| Realty Prompts | [realty-prompts.md](./02-modules/realty-prompts.md) | AI-генерация описаний, 20+ переменных |
| Onboarding | [onboarding.md](./02-modules/onboarding.md) | Чек-лист (кратко) |
| Telegram | [telegram.md](./02-modules/telegram.md) | Обзор (детали — в интеграциях) |

### API Reference
→ [03. Индекс API](./03-api-reference/README.md)

**Публичные (auth:user):**
- [Auth](./03-api-reference/auth.md) · [Profile](./03-api-reference/profile.md) · [Realties](./03-api-reference/realties.md) · [Publishings](./03-api-reference/publishings.md) · [Leads](./03-api-reference/leads.md) · [Feeds](./03-api-reference/feeds.md)
- [Subscription](./03-api-reference/subscription.md) · [Billing](./03-api-reference/billing.md) · [Services](./03-api-reference/services.md) · [Scorings](./03-api-reference/scorings.md)
- [Settings](./03-api-reference/settings.md) · [Onboarding](./03-api-reference/onboarding.md) · [Suggestions](./03-api-reference/suggestions.md)

**Inbound (без auth):**
- [Webhooks](./03-api-reference/webhooks.md) — CloudPayments (check/pay/fail), Jivo, Telegram

**Admin (auth:admin):** → [admin/README.md](./03-api-reference/admin/README.md)
- [Auth & Admins](./03-api-reference/admin/auth-and-admins.md) · [Users](./03-api-reference/admin/users.md) · [Plans & Billing](./03-api-reference/admin/plans-and-billing.md)
- [Realties / Publishings / Feeds / AI-Prompts](./03-api-reference/admin/realties-publishings.md)
- [Services / Scorings / Leads / Monitoring](./03-api-reference/admin/services-scorings.md)

### Data & Integrations
- [04. База данных](./04-database.md) — PostgreSQL 17 + PostGIS, ~160 миграций, доменные кластеры таблиц
- [05. Интеграции](./05-integrations/README.md):
  - [Avito](./05-integrations/avito.md) · [CIAN](./05-integrations/cian.md) · [ДомКлик](./05-integrations/domclick.md) — классифайды
  - [CloudPayments](./05-integrations/cloudpayments.md) · [AmoCRM](./05-integrations/amocrm.md) — платежи + CRM
  - [OpenAI](./05-integrations/openai.md) · [Telegram](./05-integrations/telegram.md) · [JivoSite](./05-integrations/jivosite.md)
  - [Dadata](./05-integrations/dadata.md) · [SMS (sms.ru)](./05-integrations/sms.md)
  - [Yandex Metrika](./05-integrations/yandex-metrika.md) · [PostHog](./05-integrations/posthog.md)

### Frontend-surfaces
- [06. Админка](./06-admin.md) — admin.rspace.pro, 130 endpoints, UI-walkthrough с TBD скриншотами
- [07. Frontend (lk)](./07-frontend.md) — React Router 7.11 + Chakra UI v3
- [08. Landing (rspace.pro)](./08-landing.md) — Next.js 15, A/B/C/D варианты
- [09. Дизайн-система](./09-design-system.md) — NT Somic, lime/magenta, 40+ SVG, 6 email-шаблонов

### Runtime & Process
- [10. Jobs и очереди](./10-jobs-queues.md) — database queue, 25 console-команд, retry-стратегии
- [11. Events & Broadcasting](./11-events.md) — 20+ events, listeners, Idempotent pattern
- [12. Инфраструктура](./12-infrastructure.md) — Docker, GitLab CI, runners, секреты, TBD-список для DevOps
- [13. Процессы разработки](./13-dev-process.md) — git-workflow, MR, релизы, hotfixes, onboarding разработчика

### Планирование
- [14. Технический долг](./14-tech-debt.md) — **42 пункта P0-P3**
- [15. Roadmap и стратегия](./15-roadmap.md) — план до 1M MRR к июню

## Топ-5 для нового разработчика

1. [01. Архитектура](./01-architecture.md) — поймёшь, как всё связано.
2. [00. Обзор](./00-overview.md) — глоссарий + команда.
3. [13. Процессы разработки](./13-dev-process.md) — как работать (ВАЖНО: default-ветки заморожены!).
4. Модуль, по которому задача (из 02-modules).
5. [14. Технический долг](./14-tech-debt.md) — взять быструю задачу.

## Critical Reminders

- **Ветки** `main` / `master` — ЗАМОРОЖЕНЫ. Разработка — в `dev` / `develop`.
- **Секреты** — в GitLab репо `rspase/secrets/dev.git`, не в коде.
- **GitLab API** — read-only в рамках документации. Никаких push.
- **Admin UI репозиторий** — вне GitLab группы `rspase`. TBD где.
