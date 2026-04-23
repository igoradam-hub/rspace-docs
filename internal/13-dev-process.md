# 13. Процессы разработки

> **Аудитория:** новый разработчик, команда, DevOps, менеджер проекта.
> **Последнее обновление:** 2026-04-23

Как команда RSpace пишет и деплоит код. Git-workflow, code review, релизы, QA, инциденты.

## Git-workflow

### Ветки по репо

| Репо | Default branch | Prod-деплой | Разработка |
|---|---|---|---|
| `rspase/landing/next` | `dev` ✅ | `dev` → `premaster` (manual) | `dev` |
| `rspase/project/frontend` | **`main`** ❌ заморожен с апреля 2025 | `develop` (нет prod-stage в CI) | `develop` |
| `rspase/project/backend` | **`master`** ❌ заморожен с апреля 2025 | `dev` (есть CI deploy) | `dev` |

⚠️ **Ключевое для новичков:** `main` / `master` в frontend и backend **НЕ используются**. При клонировании:
```bash
git clone ...
git checkout dev        # или develop для frontend
```

Иначе будете работать на устаревшем коде. Это **tech debt** — должно быть исправлено.

## Feature development

### 1. Взять задачу
Через GitLab Issues или в другом tracker'е (TBD — где точно ставятся задачи: GitLab Issues? Yatrack? Trello?).

### 2. Ветка
```bash
git checkout dev
git pull
git checkout -b feature/RSPASE-xxx-short-description
# или
git checkout -b task/RSPASE-varioqub@landing-hero-test
```

**Naming convention:** `feature/`, `bugfix/`, `hotfix/`, `task/` + `RSPASE-NNN` + короткое описание.

### 3. Коммиты

Из истории — **commits в свободной форме на русском**:
- «Activity feed» (на английском, но не всегда)
- «Фикс undefined на услугах»
- «Updated amo events»

**Tech debt:** нет строгого conventional-commits. Рекомендация на будущее — договориться о формате (`feat:`, `fix:`, `chore:`).

### 4. Push и MR

```bash
git push -u origin feature/RSPASE-xxx
# Открыть GitLab → создать MR в dev (backend/landing) или develop (frontend)
```

### MR description template
Хороший MR содержит:
- **What** — что изменилось.
- **Why** — зачем.
- **How to test** — шаги для ревьюера.
- **Screenshots** — для UI-изменений.

В коде RSpace **нет** `.gitlab/merge_request_templates/` — template вводится вручную. Tech debt.

## Code Review

### Кто ревьюит
- Lead dev (`a.lyah` — Артём Ляхов, основной контрибьютор).
- Другой разработчик (`maxzinovev`, `igor.adam`).

### Правила (рекомендуемые)
- Минимум 1 approval перед merge.
- Без approval — не merge'им.
- Обсуждение в comments, не устно.
- После исправлений — повторный ревью.

### Merge strategy
Из GitLab по умолчанию — `merge commit` (не squash / rebase). **TBD:** есть ли enforcement через protected branches.

## Pipeline / CI

Подробно — [12-infrastructure.md](./12-infrastructure.md#gitlab-cicd).

**Важное:**
- Dev-деплой — автоматически при merge в `dev` / `develop`.
- **Prod-деплой — автоматически при merge в `premaster`** для всех трёх репозиториев (backend, frontend, landing). Не manual. Проверено в `.gitlab-ci.yml@dev` каждого репо на 2026-04-23. Runner prod: `rs_prod`, secrets из `rspase/secrets/prod.git`.
- **Тесты в CI не запускаются** — ручная ответственность разработчика.

## Релизный процесс

Текущий (неформальный):
1. Feature ready → merge в `dev` / `develop`.
2. Dev-деплой автоматический.
3. Тест на dev.
4. Merge `dev`/`develop` → `premaster` — **автоматически триггерит prod-деплой** в landing, backend, frontend (runner `rs_prod`).

**Tech debt:** нет чёткого release-cadence (weekly / sprint-based).

**Из ретро** (`_sources/04-retro.md`): весной 2026 был тяжёлый релиз подписочной модели 24.03 — **5 багов ушли в прод** (всё отражено в QA-отчёте). Причина — отсутствие чёткого QA-процесса.

## QA-процесс

### Текущий
QA делается **ручным прохождением** основных сценариев перед merge. Из QA-отчёта 2026-04-20 видно, что:
- Чеклисты не формализованы.
- Автотестов нет на UI.
- PHPUnit есть в backend — но насколько покрытие — TBD.

### Формализованная система QA — **tech debt**
Что должно быть:
- **Regression checklist** — список сценариев для проверки перед каждым релизом.
- **Smoke tests** после deploy в dev → автоматические.
- **E2E-тесты** (Playwright?) — отсутствуют.
- **Post-release checklist** — проверка метрик после деплоя.

## Шаблон Post-release checklist (предлагаемый)

После каждого prod-деплоя — **в течение 30 минут**:

- [ ] Сайт открывается (`rspace.pro`, `lk.rspace.pro`, `admin.rspace.pro`).
- [ ] Регистрация новым номером работает (SMS приходит).
- [ ] Вход существующим юзером работает.
- [ ] CloudPayments: тестовый платёж проходит.
- [ ] `/admin/balances` — все external балансы ок.
- [ ] Нет всплеска `failed_jobs`.
- [ ] Логи `storage/logs/laravel.log` — нет критичных `[ALERT]` / `[CRITICAL]`.
- [ ] Основные дашборды (PostHog / Yandex Metrika) — трафик идёт.

## Инциденты

### Что считается инцидентом
- Сайт недоступен > 5 минут.
- Платежи не проходят.
- Критичный баг в прод, блокирующий основной user flow.
- Утечка данных / security-инцидент.

### Процесс (рекомендуемый)
1. **Обнаружить** — через alert / сообщение юзера.
2. **Assess** — severity (P0 / P1 / P2).
3. **Communicate** — сообщить в команду (Telegram `@rspace_support` — у них доступ к статусам).
4. **Fix** — быстрый rollback (предыдущий docker-образ) или forward fix.
5. **Post-mortem** — что пошло не так, как не повторить.

**Инцидент-трекер:** TBD (есть ли?).

**Tech debt:** формализованного playbook'а нет. Ретро упоминает, что «5 багов на подписках» — это инцидент-уровня, но системно не разобрано.

## Monitoring & Alerts (Ожидаемые)

Что должно быть, но **TBD**:
- Sentry — ловить errors automatically.
- Prometheus + Alertmanager — метрики.
- Uptime-мониторинг (Pingdom / UptimeRobot).
- Alert в Telegram при `failed_jobs > 10`.
- Alert при sms.ru balance < 500 ₽.
- Alert при OpenAI balance < $10.

Сейчас: логи + ручные проверки + Telegram группа для экстренных случаев.

## Команда

Из паспорта продукта RACI + GitLab активности:

### Разработка (активные commits за 30 дней)
- **Артём Ляхов** (`a.lyah`) — Lead dev. Основные commits по всем трём репо.
- **Максим Зиновьев** (`maxzinovev`) — Developer (в основном landing).
- **Игорь Адам** (`igor.adam`) — PM + часть кода (landing, frontend).

### Операции
- **Света** — биллинг, платежи, подписки.
- **Юля** — ипотечный брокер, онбординг, поддержка.
- **Маша** — продажи, поддержка, саппорт.
- **Даниил** — маркетинг, контент.
- **Никита** — спринт-планирование, связь с разработкой.

### Руководство
- **Алексей Козлов** — CEO.
- **Игорь Адам** — CPO.

**Bus factor:** на `a.lyah` → критично для backend/frontend. На Юле → критично для ипотечного брокерства. Из паспорта — задача передачи обязанностей в планах.

## Sprint planning

Никита отвечает за спринт-планирование. **Ритм:** TBD (2-недельные? месячные?).

Из `_sources/04-retro.md` видно формат **спринтовых ретро** — значит есть спринты. Каждый спринт — с ретроспективой (что хорошо, что плохо, что улучшить).

## Комуникационные каналы

| Канал | Назначение |
|---|---|
| **Telegram группа команды** | Оперативная коммуникация |
| **GitLab MRs** | Code review |
| **GitLab Issues** (TBD) | Баги, фичи |
| **AmoCRM** | Voronка клиентов |
| **JivoSite** | Чат поддержки |

## Обучение нового разработчика

### Shadow list (1-я неделя)

1. **Документация:**
   - README каждого репо.
   - Эта `rspace-docs/` (когда будет перенесена в Notion).
   - Дизайн-система `_sources/`.

2. **Код:**
   - Клонировать все три репо.
   - Запустить локально (docker-compose).
   - Пройти регистрацию на dev-контуре.

3. **Архитектура:**
   - `internal/01-architecture.md` — общая картина.
   - `internal/02-modules/` — доменные модули.
   - `internal/05-integrations/` — внешние API.

4. **Настройка:**
   - Git push access.
   - VPN если нужен доступ к dev-серверам.
   - Sentry / мониторинг логины (когда будут).

### Первая задача
Рекомендуется — **bugfix из QA-отчёта** (простые P3-баги, см. [14-tech-debt.md](./14-tech-debt.md)):
- «undefined» fix в Subscription.tsx.
- Обрезанные карточки тарифов.
- «Бесплатно» label для услуг без цены.

Быстро знакомят с кодом, без риска что-то сломать.

## Hotfix процесс

Критичный баг на проде:

1. `git checkout dev` (или `develop` для frontend, или `premaster` для landing).
2. `git checkout -b hotfix/RSPASE-NNN-what-broke`.
3. Fix → commit → push.
4. **MR с пометкой `[HOTFIX]`** → ускоренный review (1 approver).
5. Merge → deploy.
6. Post-mortem в ближайшие 24 часа.

## Форматирование и стиль

### Backend (PHP)
- **Laravel Pint** для форматирования (`./vendor/bin/pint`). Запускается локально, не в CI (tech debt).
- **PHPStan Level 5** через `phpstan.neon`.
- **Соглашение:** `final class` везде, strict types (`declare(strict_types=1)`).

### Frontend (TS)
- **Prettier** — есть `.prettierrc.json`.
- **ESLint** — `eslint.config.*` или `.eslintrc`.
- **TypeScript strict mode** — включён.

### Landing (TS)
- Prettier + ESLint 9.
- `@ianvs/prettier-plugin-sort-imports` — автосортировка импортов.
- `tailwind-merge` для дедупликации Tailwind-классов.

## Known issues (процессов)

Всё, что нужно улучшить в процессах — в [14-tech-debt.md](./14-tech-debt.md).

## Связанные разделы

- [12. Инфраструктура](./12-infrastructure.md)
- [14. Tech Debt](./14-tech-debt.md)
- [15. Roadmap](./15-roadmap.md)
- [_sources/04-retro.md](../_sources/04-retro.md) — ретроспектива спринта март-апрель 2026.

## Ссылки GitLab

- [Backend repo](https://git.rs-app.ru/rspase/project/backend)
- [Frontend repo](https://git.rs-app.ru/rspase/project/frontend)
- [Landing repo](https://git.rs-app.ru/rspase/landing/next)
