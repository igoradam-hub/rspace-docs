# rspace-docs/ — локальный источник документации RSpace

Эта папка — единый источник правды для всей документации RSpace. Финальная цель — перенос в Notion (корень `Документация RSpace`, id `33702320-7e2e-8196-be9e-e6dda91d42c5`). До переноса всё оформляется локально в markdown.

> **Статус на 2026-04-23:** 5 волн верификации пройдено. Документация сверена с кодом `git.rs-app.ru/rspase/project/*@dev`. Все найденные расхождения и правки — в `CHANGELOG.md`. Машинно-прочитанные дампы (routes, migrations, tree, configs) — в `_verification/`. Оставшиеся TBD-ы — не код, а бизнес-данные (legal URLs, INN, контакты, страховые партнёры). Блокеров для переноса в Notion нет.

## Структура

```
rspace-docs/
├── external/            Внешняя документация (для риелторов-пользователей и саппорта)
├── internal/            Внутренняя документация (для команды разработки)
├── assets/
│   ├── screenshots/     Скриншоты UI — PNG, kebab-case имена
│   ├── diagrams/        Источники Mermaid (.mmd) + рендер (.svg/.png)
│   └── videos/          Локальные видео или .txt с ссылками на Loom
├── _sources/            Исходные материалы для справки (паспорт, ТЗ, CusDev, QA, ретро)
├── _templates/          Шаблоны страниц
├── README.md            Этот файл
└── NOTION_TRANSFER.md   Чек-лист финального переноса в Notion
```

## План работ (волны)

Документация пишется инкрементально, волнами. Между волнами — пауза на проверку пользователем.

| # | Волна | Содержит |
|---|---|---|
| 0 | Инфраструктура | README, шаблоны, выгрузки в `_sources/` |
| 1 | Core Overview | External 00-01, Internal 00-01 |
| 2 | Public API и ядро | Internal 02-03 (user), External 02-03 |
| 3 | Публикации и лиды | External 04-05, Internal 05 (Avito/ЦИАН/ДомКлик) |
| 4 | Деньги | External 09 + расчёты, Internal 05 (CloudPayments, AmoCRM) |
| 5 | Услуги и вертикали | External 06-08, Internal (Services/Scoring/OpenAI/Telegram/Dadata/Jivo) |
| 6 | Полировка внешней | External 10-17 (аналитика, уведомления, FAQ, troubleshooting, known issues, legal, контакты) |
| 7 | Админка | Internal 06 + Admin API |
| 8 | Frontend / Landing / DS / БД | Internal 07-09, Internal 04 |
| 9 | Инфра и процессы | Internal 10-15 |
| 10 | Cross-review | Проверка ссылок, цифр, TOC |
| 11 | Перенос в Notion | notion_push.py, заливка, финализация |

Полный план: `/Users/igoradam/.claude/plans/tranquil-churning-dongarra.md`.

## Правила именования

**Файлы:**
- kebab-case, с префиксом-номером раздела: `00-about.md`, `01-tariffs.md`, `05-leads.md`
- одна страница = один файл
- двойные номера для подразделов: `05a-lead-sources.md`, `05b-lead-scoring.md`

**Скриншоты:**
- `assets/screenshots/<surface>-<screen>-<state>.png`
- примеры: `lk-listings-list.png`, `admin-users-index.png`, `landing-hero-desktop.png`
- оптимизация: PNG ≤500 KB через `pngquant --quality=70-85`

**Диаграммы:**
- Mermaid-исходник: `assets/diagrams/<area>-<what>.mmd`
- рендер (если нужен для PR/Notion): рядом `.svg` или `.png`
- примеры: `billing-payment-flow.mmd`, `amocrm-event-dispatch.mmd`

## Voice и стилистика

### Внешняя документация
Аудитория: риелторы-пользователи + сотрудники поддержки/CS RSpace.

- Формальное «Вы» (никогда «ты»).
- Числа с разделителем-пробелом и NBSP перед `₽`: `15 000 ₽`, `1 200 000 ₽`.
- Минус для скидок: `−20%`, `−30%` (U+2212, не ASCII дефис).
- Бесконечность для «без лимита»: `∞`.
- Без эмодзи в продуктовой части (исключение — `🔒` на gated-фичах).
- Средняя точка `·` как разделитель в списках inline: `Авито · ЦИАН · ДомКлик`.
- ALL CAPS только для primary-CTA («ПОПРОБОВАТЬ 30 ДНЕЙ БЕСПЛАТНО»), в тексте — sentence case.
- Заголовок раздела — sentence case с заглавной: «Как подключить портал», «Стоимость подписки».
- Eyebrow/секционный флаг — caps-track: «КЛУБНЫЕ ЦЕНЫ НА УСЛУГИ · НОВОЕ».

### Внутренняя документация
Аудитория: backend, frontend, QA, DevOps.

- Технический русский. Термины кода — по-английски (`UserController`, `PaymentIntent`, `webhook`).
- Без канцелярита («осуществляется», «является», «в связи с»). Активный залог.
- Короткие абзацы (≤4 строк).
- Каждый API-endpoint — в code-блоке с глаголом: `POST /api/realties`.
- Пути к файлам — в backticks: `backend/app/Http/Controllers/Api/RealtyController.php`.
- Ссылки на GitLab — полные URL (будут работать в Notion).
- Диаграммы архитектуры / flow — Mermaid.

## Источники правды (Source-of-Truth)

| Факт | Источник |
|---|---|
| Бизнес-метрики (MRR, ARPU, churn, roadmap) | `_sources/00-product-passport.md` |
| Актуальная тарифная модель | **`_sources/01b-tariffs-actual-2026-04-23.xlsx`** + `_sources/01b-tariffs-actual.md` (от Игоря, 23.04.2026). `_sources/01-tariffs-tz.md` и `01a-tariffs-quickref.md` — **устаревшие**, не использовать как источник цен |
| Voice пользователя, боли | `_sources/02-cusdev-voice.md` |
| Known Issues / баги в проде | `_sources/03-qa-report.md` |
| Что чинили в прошлом спринте | `_sources/04-retro.md` |
| AI-описания (промпты, модель) | `_sources/05-ai-descriptions.md` |
| Удержание при выводе | `_sources/06-retention-tz.md` |
| Код (правда о текущей реализации) | GitLab API с `PRIVATE-TOKEN`: GET `/repository/files/:path/raw?ref=<dev/develop>` |
| Дизайн-токены, визуальные правила | `/Users/igoradam/Projects/rspace/RSpace Design System (2)/` |

## Принципы

- **Локально — пока.** Ничего не коммитится в git, ничего не пушится в Notion, пока не завершим волну 11.
- **GitLab read-only.** Никаких `git fetch`, commit, push. Только HTTP GET через curl.
- **Не додумываем.** Если факта нет в источниках — пишем `TBD — уточнить у <ответственный>`.
- **Credentials не в файлах.** Тестовые доступы (ЛК, админка) используются только в момент обхода UI. В текст документации они не попадают.
- **Архивы поддержки (JivoSite / Telegram) не трогаем.** По явному запросу пользователя.

## Статус

| Волна | Статус | Результат |
|---|---|---|
| 0. Инфраструктура | ✅ completed | README, шаблоны, 9 источников в `_sources/` |
| 1. Core Overview | ✅ completed | External 00-01, Internal 00-01 (4 файла, ~730 строк) |
| 2. Public API + ядро | ✅ completed | External 02-03, Internal 02-modules × 6 + API-reference × 5 (11 файлов) |
| 3. Публикации и лиды | ✅ completed | External 04-05, Internal publishings/leads, Avito/CIAN/ДомКлик (11 файлов) |
| 4. Деньги | ✅ completed | External 09, Internal CloudPayments/AmoCRM/billing/webhooks (5 файлов) |
| 5. Услуги и вертикали | ✅ completed | External 06-08, Internal services/scoring/widget/realty-prompts/telegram + 5 интеграций (15 файлов) |
| 6. Полировка внешней | ✅ completed | External 10-17 (8 файлов) — ВНЕШНЯЯ ДОКА ЗАКРЫТА |
| 7. Админка | ✅ completed | Internal 06-admin + 6 admin API-reference (UI-walkthrough отложен до скриншотов) |
| 8. Frontend/Landing/DS/БД | ✅ completed | Internal 04, 07, 08, 09 (4 файла) |
| 9. Инфра и процессы | ✅ completed | Internal 10-15: Jobs/Events/Infrastructure/Dev Process/Tech Debt/Roadmap (6 файлов) |
| 10. Cross-review | ✅ completed | Фикс 18 битых ссылок, 4 новых stub-файла, корневой TOC |
| 11. Перенос в Notion | **готов к старту** | Блокер снят 2026-04-23 по завершении 6 волн верификации + приведения external к xlsx-модели. См. `NOTION_TRANSFER.md`. |
| V1-V5. Верификация (2026-04-23) | ✅ completed | 5 волн: (1) API reference 20 файлов, (2) 12 модулей, (3) БД + 12 интеграций, (4) 11 internal-файлов 00/01/07-15, (5) 18 external-файлов. См. `CHANGELOG.md` и `_verification/`. |
| V6. UI-верификация (2026-04-23) | ✅ completed | 6 подволн (a-f): лендинг (13 блоков), ЛК (7 экранов с логином), админка (16 разделов). См. `_verification/landing-walkthrough-2026-04-23.md`, `lk-walkthrough-2026-04-23.md`, `admin-walkthrough-2026-04-23.md` + сводный `DISCREPANCY-REPORT-2026-04-23.md`. |
| V7. Приведение к xlsx (2026-04-23) | ✅ completed | Сверил `external/*` с авторитетной xlsx-моделью Игоря (`_sources/01b-tariffs-actual-*.xlsx`). Переписаны `01-tariffs.md`, `09-balance.md`, правки в `00-about.md`, `02-start.md`, `04-publishing.md`, `05-leads.md`, `07-legal.md`, `10-analytics.md`, `13-faq.md`, `16-legal.md`, `17-contacts.md`. Унифицирована терминология «баллы vs рубли». |

**Итого:** **~15 000 строк документации**, 78 MD-файлов.
- External — 18 файлов, ~3 100 строк.
- Internal — ~60 файлов, ~11 900 строк.
- `_sources/` — 9 файлов сырого материала, 1 692 строки.

## Полное содержание

### Внешняя документация (для риелторов + поддержки)
- [00. Что такое RSpace](./external/00-about.md)
- [01. Тарифы и подписки](./external/01-tariffs.md)
- [02. Начало работы](./external/02-start.md)
- [03. Объекты недвижимости](./external/03-listings.md)
- [04. Публикация на порталах](./external/04-publishing.md)
- [05. Лиды](./external/05-leads.md)
- [06. Ипотечный брокер](./external/06-mortgage.md)
- [07. Юридические услуги](./external/07-legal.md)
- [08. Страховка](./external/08-insurance.md)
- [09. Баланс и выплаты](./external/09-balance.md)
- [10. Аналитика в кабинете](./external/10-analytics.md)
- [11. Уведомления](./external/11-notifications.md)
- [12. Настройки](./external/12-settings.md)
- [13. FAQ](./external/13-faq.md)
- [14. Troubleshooting](./external/14-troubleshooting.md)
- [15. Known Issues](./external/15-known-issues.md)
- [16. Юридические документы](./external/16-legal.md)
- [17. Контакты и поддержка](./external/17-contacts.md)

### Внутренняя документация (для команды)
- [00. Обзор](./internal/00-overview.md) — продукт, метрики, команда, глоссарий
- [01. Архитектура системы](./internal/01-architecture.md)
- **02. Домены и модули** ([index](./internal/02-modules/README.md)): [Identity](./internal/02-modules/identity.md) · [Realty](./internal/02-modules/realty.md) · [Publishings](./internal/02-modules/publishings.md) · [Leads](./internal/02-modules/leads.md) · [Subscriptions](./internal/02-modules/subscriptions.md) · [Billing](./internal/02-modules/billing.md) · [Services](./internal/02-modules/services.md) · [Scoring](./internal/02-modules/scoring.md) · [Widget](./internal/02-modules/widget.md) · [Realty Prompts](./internal/02-modules/realty-prompts.md) · [Onboarding](./internal/02-modules/onboarding.md) · [Telegram](./internal/02-modules/telegram.md)
- **03. API Reference** ([index](./internal/03-api-reference/README.md)): [Auth](./internal/03-api-reference/auth.md) · [Profile](./internal/03-api-reference/profile.md) · [Realties](./internal/03-api-reference/realties.md) · [Publishings](./internal/03-api-reference/publishings.md) · [Leads](./internal/03-api-reference/leads.md) · [Feeds](./internal/03-api-reference/feeds.md) · [Subscription](./internal/03-api-reference/subscription.md) · [Billing](./internal/03-api-reference/billing.md) · [Services](./internal/03-api-reference/services.md) · [Scorings](./internal/03-api-reference/scorings.md) · [Settings](./internal/03-api-reference/settings.md) · [Onboarding](./internal/03-api-reference/onboarding.md) · [Suggestions](./internal/03-api-reference/suggestions.md) · [Webhooks](./internal/03-api-reference/webhooks.md)
- **Admin API** ([index](./internal/03-api-reference/admin/README.md)): [Auth & Admins](./internal/03-api-reference/admin/auth-and-admins.md) · [Users](./internal/03-api-reference/admin/users.md) · [Plans & Billing](./internal/03-api-reference/admin/plans-and-billing.md) · [Realties/Publishings/Feeds](./internal/03-api-reference/admin/realties-publishings.md) · [Services/Scorings/Leads/Monitoring](./internal/03-api-reference/admin/services-scorings.md)
- [04. База данных](./internal/04-database.md)
- **05. Интеграции** ([index](./internal/05-integrations/README.md)): [Avito](./internal/05-integrations/avito.md) · [CIAN](./internal/05-integrations/cian.md) · [ДомКлик](./internal/05-integrations/domclick.md) · [CloudPayments](./internal/05-integrations/cloudpayments.md) · [AmoCRM](./internal/05-integrations/amocrm.md) · [OpenAI](./internal/05-integrations/openai.md) · [Telegram](./internal/05-integrations/telegram.md) · [JivoSite](./internal/05-integrations/jivosite.md) · [Dadata](./internal/05-integrations/dadata.md) · [SMS (sms.ru)](./internal/05-integrations/sms.md) · [Yandex Metrika](./internal/05-integrations/yandex-metrika.md) · [PostHog](./internal/05-integrations/posthog.md)
- [06. Админка](./internal/06-admin.md)
- [07. Frontend (lk.rspace.pro)](./internal/07-frontend.md)
- [08. Landing (rspace.pro)](./internal/08-landing.md)
- [09. Дизайн-система](./internal/09-design-system.md)
- [10. Jobs и очереди](./internal/10-jobs-queues.md)
- [11. Events & Broadcasting](./internal/11-events.md)
- [12. Инфраструктура](./internal/12-infrastructure.md)
- [13. Процессы разработки](./internal/13-dev-process.md)
- [14. Технический долг](./internal/14-tech-debt.md) — **42 пункта с приоритетами**
- [15. Roadmap и стратегия](./internal/15-roadmap.md)
