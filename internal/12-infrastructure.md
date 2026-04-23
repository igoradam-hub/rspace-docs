# 12. Инфраструктура

> **Аудитория:** DevOps, backend-лид, новый разработчик.
> **Последнее обновление:** 2026-04-23

Окружения, развёртывание, секреты, БД, мониторинг. Много TBD — инфра-знания **распределены**, бэкапы и точные настройки хостинга нужны от DevOps.

## Окружения

### Production
- **API backend:** `api.rspace.pro` (точный URL TBD — подтвердить).
- **Кабинет:** `lk.rspace.pro`.
- **Админка:** `admin.rspace.pro`.
- **Лендинг:** `rspace.pro`.
- **A/B варианты:** `a.rspace.pro`, `b.rspace.pro`, `c.rspace.pro`, `d.rspace.pro`.

### Development
- **URL:** TBD (возможно `*.dev.rspace.pro` или IP-based).
- Автоматический деплой из:
  - landing — `dev` ветка.
  - frontend — `develop` ветка.
  - backend — `dev` ветка.

### Production deploy
- landing — `premaster` ветка (manual trigger в GitLab CI).
- frontend — prod-stage **не настроена** (деплой вручную, tech debt).
- backend — prod-stage в `.gitlab-ci.yml` есть (ветка `dev` для auto-deploy).

## GitLab Runners

Используются три тэга runner'ов:
- **`gitlab-docker`** — Docker-in-Docker build-runner (собирает образы).
- **`rspace_dev`** — deploy на dev-серверы.
- **`rs_prod`** — deploy на prod.

## Docker

Все три сервиса (backend, frontend, landing) — контейнеризованы. `Dockerfile` в каждом репо.

### Структура образов

**Backend (Laravel 12 + PHP 8.4):**
- Base: `php:8.4-fpm` (Debian-based, **не Alpine** — проверено в `Dockerfile-backend@dev`).
- Composer install + artisan optimize + key:generate.
- Output: `rspace_back` контейнер.
- **Nginx установлен внутри backend-контейнера** (`apt-get install nginx` в Dockerfile) — отдельного контейнера для веб-сервера нет.

**Frontend (React Router 7 SSR):**
- Base: `node:20-alpine` (TBD).
- npm build → react-router-serve.
- Output: SSR-сервер на `:3000`.

**Landing (Next.js 15 standalone):**
- Base: `node:22.14-alpine` (подтверждено через brain wiki).
- `next build` с `output: standalone`.
- Output: `node server.js` на порт.

### docker-compose.yml

В каждом репо свой `docker-compose.yml` для локального dev. Для прод — отдельная композиция (TBD, возможно общая).

### Локальный стек

В `backend/docker-compose.yml` (из `.env.example` можно вывести):
- `postgres` — PostgreSQL 17.
- `redis` — Redis (опциональный кеш/queue).
- `minio` — S3-совместимое хранилище локально.
- `mailpit` — SMTP-фейк для dev.
- `backend` — Laravel app.

## GitLab CI/CD

### Backend (`rspase/project/backend/.gitlab-ci.yml`)

**Stages:** `deploy_dev`, `deploy_prod`.

**`deploy_dev` (on: `dev` branch):**
1. **`build_back_dev`** (Docker-in-Docker):
   - `git clone` секреты из `rspase/secrets/dev.git` → `.env.back` → `.env`.
   - `docker pull` cache-образа.
   - `docker build -f Dockerfile-backend`.
   - `docker push $CI_REGISTRY/rspase/project/backend:dev`.
   - Runner: `gitlab-docker`.

2. **`push_dev`** (deploy на rspace_dev runner):
   - `docker compose pull && up -d --build`.
   - Зависит от: `build_back_dev`.

3. **`app_install_dev`** (инициализация Laravel):
   - `composer install`.
   - `php artisan key:generate --force`.
   - `php artisan config:clear`.
   - `php artisan migrate --force` ← **миграции автоматические!**
   - `php artisan storage:link --force`.
   - `php artisan optimize`.
   - Runner: `rspace_dev`.

4. **`clean_up_dev`** — очистка неиспользуемых docker-образов.

**`deploy_prod` (on: `premaster` branch — автоматически, не manual!):**

1. **`build_back_prod`** — тянет `rspase/secrets/prod.git` (deploy-token 62), билдит образ, пушит в registry.
2. **`push_prod`** — `docker compose down && pull && up -d --build` на runner `rs_prod`.
3. **`app_install_prod`** — `composer install`, `key:generate`, `config:clear`, `migrate --force`, `storage:link`, `optimize`.
4. **`clean_up_prod`** — `docker image prune --force`.

**Важно:** миграции на проде запускаются **автоматически** (`php artisan migrate --force`) при каждом push в `premaster`. Пропущенных или конфликтующих миграций — не выловить до деплоя, если не отладили в dev.

Триггер prod — **merge в `premaster`**, не в `master`. `master` остался пустым шаблоном Laravel с апреля 2025.

### Frontend (`rspase/project/frontend/.gitlab-ci.yml`)

```
stages: [deploy_dev, deploy_prod]

deploy_dev (on: develop):
  - git clone rspase/secrets/dev/.env.front → .env
  - docker build + push
  - docker compose pull && up

deploy_prod: EMPTY (не настроена) ⚠️
```

### Landing (`rspase/landing/next/.gitlab-ci.yml`)

```
stages: [deploy_dev, deploy_prod]

deploy_dev (on: dev):
  - docker build --build-arg BASE_URL=$BASE_URL
  - push в $CI_REGISTRY
  - docker compose pull && up
  - clean_up_dev

deploy_prod (on: premaster, manual):
  - docker build --build-arg BASE_URL=$BASE_URL_PROD NODE_ENV=$NODE_ENV_PROD
  - docker compose pull && up
  - runner: rs_prod
  - clean_up_prod
```

## Секреты

### Место хранения
Отдельный приватный **GitLab-репо**: `rspase/secrets/dev` (и вероятно `rspase/secrets/prod`).

Внутри:
- `.env.back` — backend .env.
- `.env.front` — frontend .env.
- (возможно другие `.env.*` для каждого сервиса).

### Доступ в CI
Через `secrets_dev` GitLab-variable (deploy token):
```yaml
- git clone --no-checkout --depth 1 https://rspace+deploy-token:$secrets_dev@git.rs-app.ru/rspase/secrets/dev.git
- cd dev && git show HEAD:.env.back > ../.env
```

Клонируется только метаданные, файл извлекается через `git show HEAD:...` — не попадает в файловую систему runner'а как commit.

### Ротация
**TBD:** как часто меняются секреты, кто их обновляет.

## База данных

### Production
- **PostgreSQL 17** (ожидаемо).
- **PostGIS** — для геолокации.
- **Host:** TBD (managed RDS / self-hosted?).
- **Replicas:** TBD (есть ли read-replica для аналитики?).
- **Connection pool:** TBD (PgBouncer?).

### Миграции
Автоматические в CI: `php artisan migrate --force` на каждом deploy dev.

**На проде:** TBD процесс — запускается ли автоматически или руками.

### Backup
**TBD от DevOps:**
- Частота: daily / hourly?
- Retention: 7 / 30 / 90 дней?
- Инструмент: pg_basebackup / WAL-G / managed-backup?
- Тестирование восстановления: регулярно ли?
- Off-site хранение: S3 / другой облако?

### Disaster Recovery
- **RTO** (Recovery Time Objective): сколько времени на восстановление — TBD.
- **RPO** (Recovery Point Objective): максимум потерь данных — TBD.

## File storage

### S3

**Provider:** AWS S3 или Minio (на dev — локальный Minio).

**Buckets** (из `.env.example`):
- `S3_BUCKET_PRIVATE` — приватные (документы собственников, ДДУ, PDF отчёты скоринга).
- `S3_BUCKET_PUBLIC` — публичные (фото объектов для площадок, аватары).

**URL формат:**
- Приватные файлы отдаются через `$APP_URL/api/file/{path}` — backend-proxy с авторизацией.
- Публичные — напрямую через S3-URL.

**Интеграция:** Spatie Media Library 11 + Flysystem AWS S3 v3 3.29.

### Локально
Minio на `localhost:9000` (из `.env.example`), admin creds `minioAdmin` / `minioAdmin`.

## Redis

В `.env.example` есть конфиг Redis (`REDIS_CLIENT=phpredis`, `REDIS_HOST=redis`, `REDIS_PORT=6379`).

Но **`QUEUE_CONNECTION=database`** и **`CACHE_STORE=database`** — то есть Redis **не используется активно** (возможно только для сессий? но `SESSION_DRIVER=database`). Видимо — планируется переход или используется частично.

**Это tech debt:** Redis пропадает впустую / используется неэффективно.

## Email

**`MAIL_MAILER=smtp`** из `.env.example`. В `config/services.php` определены **три** потенциальных транспорта с env-ключами:

- `postmark.token` → `POSTMARK_TOKEN`
- `ses.key / secret / region` → AWS SES
- `resend.key` → `RESEND_KEY`

Какой провайдер реально подключён на проде — определяется переменной `MAIL_MAILER` в prod-`.env` и требует подтверждения у DevOps. В `.env.example` стоит только `MAIL_MAILER=smtp` + параметры mailpit для локалки. В backend-коде транзакционных email notification-классов не найдено — не исключено, что email-канал на 2026-04-23 **не используется** вовсе, а все уведомления идут через SMS/Telegram.

## SMS

`sms.ru` через драйвер `SmsRuDriver`. Подробности — [05-integrations/sms.md](./05-integrations/sms.md).

- Client: `app/Sms/Clients/SmsRuClient.php`.
- Driver: `SmsRuDriver` для prod, `LogsSmsDriver` для dev/CI.
- Env (фактические имена из `.env.example`):
  - `SMS_PROVIDER` (default `logs`)
  - `SMS_RU_API_ID`
  - `SMS_RU_TEST` (sandbox sms.ru)

## Интеграции (прод)

Фактические имена переменных сверены с `.env.example` и `config/*.php` на 2026-04-23:

| Интеграция | Конфиг / env |
|---|---|
| **CloudPayments** | `CLOUD_PAYMENTS_PUBLIC_ID`, `CLOUD_PAYMENTS_SECRET` — всего 2 переменные |
| **AmoCRM** | `AMO_CRM_HOOKS_ENABLED` (toggle). 3 URL'а `hooks.tglk.ru/in/...` **захардкожены** в `config/amo_crm.php`, не в env |
| **Avito API** | `AVITO_INTEGRATION_ENABLED`, `AVITO_CLIENT_ID`, `AVITO_CLIENT_SECRET`, `AVITO_USER_ID` |
| **CIAN API** | `CIAN_INTEGRATION_ENABLED`, `CIAN_ACCESS_TOKEN` |
| **OpenAI** | `OPEN_AI_API_KEY`, `OPEN_AI_FAKE_MODE` (default `true`) |
| **Telegram Bot (public)** | `TELEGRAM_PUBLIC_BOT_TOKEN`, `TELEGRAM_PUBLIC_BOT_NAME`, `TELEGRAM_PUBLIC_BOT_WEBHOOK_URL` |
| **Telegram Bot (errors)** | `TELEGRAM_ERRORS_BOT_TOKEN`, `TELEGRAM_ERRORS_BOT_NAME` |
| **Telegram report-каналы** | `TELEGRAM_REPORT_ENABLED`, + 4 chat_id (`EXPIRING_PUBLISHINGS`, `PUBLISHING_ERRORS`, `NEW_USERS`, `REQUESTS`) |
| **Dadata** | `DADATA_API_KEY`, `DADATA_SECRET` |
| **PostHog** | `POSTHOG_API_KEY`, `POSTHOG_HOST`. В backend-коде клиент не используется (только JS-интеграция) |
| **Yandex Metrika** | Счётчики на клиенте (landing): 104015550 prod / 104317883 test |
| **Leads sync** | `LEADS_SYNC_ENABLED`, `LEADS_YANDEX_DISK_URL`, `LEADS_GOOGLE_SPREADSHEETS_ID` |
| **Verification codes** | `VERIFICATION_CODE_GENERATOR` (`fixed`/`random`), `VERIFICATION_CODE_FIXED=1234` (default для dev) |
| **Slack** | `SLACK_BOT_USER_OAUTH_TOKEN`, `SLACK_BOT_USER_DEFAULT_CHANNEL` — настроен в `config/services.php`, реально не замечен в коде (notification-channel) |
| **Proxy для OpenAI/Telegram** | `PROXY_URL` (для обхода блокировок в РФ) |

## Мониторинг

### Логи
Laravel `daily` log channel — ротация ежедневная. Файлы в `storage/logs/*.log`.

**Prefixes:**
- `[CLOUD_PAYMENTS]` — платежи.
- `[AMO_CRM]` — синхронизация с CRM.
- `[TELEGRAM]` — бот.
- `[SMS]` — отправка SMS.
- `[JIVO]` — webhook из чатов.

**TBD:** централизованный log aggregator (ELK / Loki / Datadog)? Или только файлы на сервере?

### Sentry / Error tracking
**Не настроен** (нет `sentry/sentry-laravel` в composer.json). Ошибки попадают в логи, но нет alerting.

**Tech debt** — добавить Sentry для критичных ошибок.

### Health checks
Некоторые контроллеры имеют health-endpoints (TBD):
- `/admin/balances` — работает как health-check external services (sms.ru / Avito / CIAN / OpenAI).
- `/health` — TBD стандартный Laravel health endpoint.

### Metrics (Prometheus / Grafana)
TBD — используется ли метрики / dashboards.

## CI Tools

- **Clockwork** (`itsgoingd/clockwork`) — profiling requests в dev.
- **PHPStan Level 5** + **Larastan** — static analysis. Запускается ли в CI? TBD.
- **PHPUnit 11** — unit/integration тесты. Запускаются ли в CI? **Tech debt** — в QA-отчёте отмечено, что тест-стадии в CI нет.
- **Prettier / ESLint** — frontend lint в CI? TBD.

## Аналитика инфры (internal)

### rspace-analytics (отдельный проект)
На GitHub `igoradam-hub/rspace-analytics` — standalone FastAPI dashboard.
- Читает Google Sheets + CloudPayments API.
- Деплой на Railway.
- Секретный URL `/healthz/<token>` для auth.

**Это НЕ часть основного RSpace-стека** — отдельная аналитика для команды.

## A/B тестирование

### Варианты лендинга
4 варианта (a/b/c/d) на отдельных поддоменах. Branch-based деплой:
- `test/variant-a` → `a.rspace.pro`
- `test/variant-b` → `b.rspace.pro`
- и т.д.

Разделение — через `NEXT_PUBLIC_VARIANT` env-переменную.

### Varioqub (Яндекс.Эксперименты)
Для бэк-тестинга в рамках одной версии лендинга — интеграция `src/lib/varioqub.ts`. Конкретные эксперименты настраиваются через Яндекс-кабинет.

## Docker Registry

GitLab Container Registry — `$CI_REGISTRY` (обычно `registry.rs-app.ru`).

**Именование образов:**
- `rspase/project/backend:{BRANCH}` → `registry.rs-app.ru/rspase/project/backend:dev`
- `rspase/project/frontend:{BRANCH}-{SHA}`
- `rspase/landing/next:{BRANCH}-{SHA}`

## Известные пробелы

- **Автоматические тесты в CI** — настроены локально, **не запускаются** в pipeline. Все миграции и деплои идут без unit-test gate.
- **Prod-stage CI для frontend** — пустая (ручной деплой).
- **Sentry / error monitoring** — нет.
- **Prometheus metrics** — TBD.
- **Redis используется неэффективно** — database-queue, database-cache.
- **Horizon / UI для queue** — нет.
- **Backup/DR процедуры** — документированы?
- **Secret rotation policy** — не формализована.
- **Default-ветки `main`/`master` заморожены** — разработчики должны помнить переключиться на `develop`/`dev`.
- **ДомКлик feed endpoint** не найден в коде (см. [05-integrations/domclick.md](./05-integrations/domclick.md)).

## Диагностика проблем

### Упал сайт
1. Проверить прод-деплой в GitLab Pipelines — красный?
2. `docker ps` на проде — все контейнеры up?
3. `storage/logs/laravel.log` на backend — последние ошибки.
4. Проверить БД — подключается?
5. External balances в админке — не кончились ли квоты (sms.ru, OpenAI).

### Платежи не проходят
1. CloudPayments dashboard — есть ошибки в кабинете?
2. Логи `[CLOUD_PAYMENTS]` на backend.
3. `CPInvoicePayment` статусы в БД — много `failed`?
4. HMAC подпись webhook — валидна?

### Лиды не приходят
1. `SyncLeadsCommand` отрабатывает? `storage/logs/` grep `leads:sync`.
2. Avito / CIAN API — токены не протухли?
3. `leads` таблица — новые записи появляются?

## Что нужно сделать от DevOps (TBD-список)

Это чек-лист для DevOps, чтоб эта страница стала исчерпывающей:

- [ ] Подтвердить URL API (`api.rspace.pro` или другой).
- [ ] Зафиксировать, где хостятся все сервисы (провайдер облака, регион).
- [ ] Детали PostgreSQL: версия точная, managed/self, replicas.
- [ ] Backup-процедуры: инструмент, retention, off-site, тестирование DR.
- [ ] Настройки queue worker'ов на проде (supervisor, N процессов).
- [ ] Cron-сервер: где запускается `schedule:run`.
- [ ] Логи: куда агрегируются.
- [ ] Monitoring: какие дашборды, alerting rules.
- [ ] Secrets rotation policy.
- [ ] Disaster recovery playbook.
- [ ] Rate limiting на внешнем уровне (nginx / CDN).
- [ ] CDN для статики (если используется).
- [ ] TLS сертификаты: провайдер (Let's Encrypt?), auto-renew.

## Связанные разделы

- [13. Процессы разработки](./13-dev-process.md) — git-workflow, деплой вручную.
- [14. Tech Debt](./14-tech-debt.md) — пропуски в инфре.
- [10. Jobs & Queues](./10-jobs-queues.md) — воркеры.
- [04. База данных](./04-database.md) — схема и миграции.

## Ссылки GitLab

- [Backend .gitlab-ci.yml](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/.gitlab-ci.yml)
- [Frontend .gitlab-ci.yml](https://git.rs-app.ru/rspase/project/frontend/-/blob/develop/.gitlab-ci.yml)
- [Landing .gitlab-ci.yml](https://git.rs-app.ru/rspase/landing/next/-/blob/dev/.gitlab-ci.yml)
- [Backend .env.example](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/.env.example)
