# CLAUDE.md — инструкции для AI-сессий над rspace-docs

> **Читай это первым делом в любой новой сессии над этим репо.**
> Если правишь что-то важное (tone, термины, workflow) — обнови этот файл.

## Что это за проект

**Репозиторий документации RSpace** — платформы для независимых риелторов. Source of truth для публичного help-центра (`rspace.gitbook.io/rspace-docs`) и внутреннего технического knowledge base.

## Структура

```
rspace-docs/
├── external/          ← ПУБЛИЧНАЯ документация для РИЕЛТОРОВ (~18 md)
│                       публикуется как "Документация для риелторов" space в GitBook
├── internal/          ← ВНУТРЕННЯЯ техническая документация для КОМАНДЫ (~15 md)
│                       публикуется как "Техническая документация (для команды)" space в GitBook
├── assets/
│   └── screenshots/
│       ├── landing/   ← скрины rspace.pro (10 PNG)
│       ├── lk/        ← скрины lk.rspace.pro (12 PNG)
│       └── admin/     ← скрины admin.rspace.pro (14 PNG)
├── _sources/          ← авторитетные источники (xlsx, check-types)
├── _verification/     ← аудиты, discrepancy reports, bug lists
├── _scripts/          ← автоматизация (screenshots, deploy)
├── knowledge/         ← ЭТА ПАПКА + tone/terms/data-points/workflow
├── CHANGELOG.md       ← история всех правок документации
└── CLAUDE.md          ← этот файл
```

## Критически важные правила

### Для external/* (пользовательская):

1. **Никаких имён сотрудников.** Не «Света», «Юля», «Маша», «Никита», а «Биллинг», «Ипотечный брокер», «Поддержка». См. `knowledge/voice.md`.
2. **Никаких метастрок** «Для кого / Сложность / Последнее обновление» в начале файлов. Раньше были — больше не пишем.
3. **«На двух площадках»** (Авито + ЦИАН в ЛК), НЕ «на трёх» и НЕ «на четырёх». ДомКлик и Яндекс.Недвижимость готовы технически, но в ЛК ещё не подключены — это **не** надо упоминать в маркетинговых местах; только там, где речь об интеграциях в процессе.
4. **Нет термина «кэшбек».** Это **агентская комиссия риелтору** за привлечение заёмщика в банк или клиента в страховую. См. `knowledge/terms.md`.
5. **Service Fee = агентская комиссия риелтору** (процент, который банк/страховая платит за привлечение), НЕ «комиссия платформы». Формула и точные % ещё уточняются у команды.
6. **Не писать про AmoCRM** как готовую интеграцию в публичной документации — упоминание убрано; если команда активирует, вернём.
7. **AI-юрист Грут** — только с Премиума (Премиум / Ультима / Энтерпрайс). На Триале и Профи его нет.
8. **5 тарифов:** Триал / **Профи** / **Премиум** / **Ультима** / **Энтерпрайс**. Цены см. `knowledge/data-points.md`.
9. **Не писать «Известные проблемы / bugs»** в публичной — перенесено в `internal/15-known-issues-external-archive.md`.

### Для internal/* (техническая):

- Здесь **можно** писать имена, архитектуру, bus factor, tech-debt, bug list, внутренние процессы, секреты (но не пароли!).
- Ссылайся на GitLab (`git.rs-app.ru/rspase/project/backend`, `.../frontend`, `.../landing/next`) — это источник истины.
- Используй actual код: роуты (`_verification/routes-*.json`), миграции (`_verification/migrations-*.json`).

## Публикация (workflow)

Документация **автоматически** синхронизируется с публичным сайтом через Git Sync:

```
Локальная правка md  →  git push  →  GitHub (igoradam-hub/rspace-docs)  →  GitBook sync (~30-60 сек)  →  rspace.gitbook.io/rspace-docs
```

**Как пушить:**

- **Из sandbox** (этого окружения) `git push` **НЕ работает** — нет credentials.
- **Правильный способ:** двойной клик по `_scripts/deploy-to-github.command` на Mac пользователя. Скрипт использует `gh` CLI (уже залогинен), коммитит изменения и пушит.
- **Обратная сторона:** если юзер редактирует в GitBook UI, GitBook автоматически делает commit в GitHub. Перед правками локально — сделай `git pull` в Finder'е (или запусти `deploy-to-github.command` — он сначала пулит).

**Публичный URL сайта:** https://rspace.gitbook.io/rspace-docs/ — **только external space**, internal НЕ публикуется.
**Internal space (только через auth):** https://app.gitbook.com/o/AXievlr1dm3uTPaIaeap/s/2RzLw8hycrC3nCMygSg7/
**Админка GitBook:** https://app.gitbook.com/o/AXievlr1dm3uTPaIaeap/sites/site_25wGw
**GitHub репо:** https://github.com/igoradam-hub/rspace-docs

### ⚠️ Публичный сайт vs Internal

- **Публичный сайт** (`rspace.gitbook.io/rspace-docs/`) показывает **только** external space. Internal НЕ подключен к публичному сайту — пользователи не могут туда попасть через dropdown или ссылки.
- **Internal space** живёт отдельно в GitBook organization Rspace. Доступ — только у членов workspace (нужна авторизация в GitBook).
- **Не** вставляй ссылки из external/ на internal/ файлы — это нарушит разделение. Если нужна ссылка, описывай контент прямо в external.

## Скриншоты

Лежат в `assets/screenshots/{landing,lk,admin}/`. Сейчас 36 штук.

**Как снимать новые:**

1. **Лендинг** (не нужен логин) — `_scripts/landing-screens.mjs` через playwright в любой среде.
2. **ЛК + Админка** (требуется auth) — `_scripts/run-screenshots.command` (двойной клик). Креды в `_scripts/.auth-creds.json` (gitignored).
3. **Дополнительные** (например login, registration, object-edit) — `_scripts/run-extra.command`.
4. **Сжатие** — `_scripts/compress-screens.py` (Pillow, идемпотентно).

**Naming convention:** `<surface>-<screen>-<state>.png` (kebab-case).
- `landing-hero-desktop.png`
- `lk-dashboard.png`, `lk-dashboard-wallet.png` (зум)
- `admin-users-list.png`

**Что добавлять новые:** если документация растёт или UI меняется — добавь/пересними, запусти `compress-screens.py`, закомить.

## Типичные задачи (что делать когда)

| Если пользователь говорит… | Что сделать |
|---|---|
| «Обнови/добавь страницу в документации» | Правь `external/*.md` или `internal/*.md`, потом `deploy-to-github.command` |
| «Поправь цифру в тарифах» | `knowledge/data-points.md` — проверь там + правь во всех файлах |
| «Обнови контакты» | `external/17-contacts.md` — сверься с `knowledge/data-points.md` |
| «Сними скриншот» | Запусти соответствующий `_scripts/*.command` |
| «Опубликуй» | Просто `deploy-to-github.command` — GitBook сам синкнет |
| «Почему странное слово в публичной документации?» | Проверь `knowledge/voice.md` и `knowledge/terms.md` |

## Источники правды (в порядке приоритета)

1. **`_sources/01b-tariffs-actual-2026-04-23.xlsx`** — финансовая модель от Игоря (цены, Service Fee, структура услуг).
2. **`_sources/check-types-breakdown.md`** — состав проверок (3/8/11 пунктов).
3. **Лендинг `rspace.pro`** — маркетинговое описание, цены (сверяй дважды).
4. **Prod БД** через админку — реальное состояние (может расходиться с xlsx).
5. **Код на GitLab** (`git.rs-app.ru/rspase/*`) — последняя инстанция технической истины.
6. **Старое ТЗ** (`_sources/01-tariffs-tz.md`, `01a-tariffs-quickref.md`) — **устаревшее**, только для истории.

## Открытые вопросы к команде

Всегда проверяй `_verification/DISCREPANCY-DECISIONS-2026-04-23.md` → раздел «Вопросы команде RSpace». Пока не получен ответ — **не меняй связанные места в документации**.

По состоянию на 2026-04-23 открытые вопросы:
1. Service Fee — по какой базе считается (30/25/19/15%)?
2. Проверка задатка / аванса — существуют как услуги?
3. `scorings` vs `services` в БД — какую удалить?
4. Страховка 10K/15K — точные числа или «до»?
5. 111 заявок без назначения — prod или test?
6. BUG-LK-005 «4 vs 3 размещения» — где конкретно в UI.

## Баги — куда смотреть

**Не правим из документации.** Файл `_verification/BUGS-PENDING-2026-04-23.md` — сводный список (4 лендинга + 5 ЛК + 1 операционный в админке). Передаётся разработке.

## Ключевые ссылки

- **Git-репо:** https://github.com/igoradam-hub/rspace-docs
- **GitLab RSpace (read-only):** `git.rs-app.ru/rspase/project/backend` (`/frontend`, `/landing/next`)
- **Публичный сайт docs:** https://rspace.gitbook.io/rspace-docs/
- **GitBook админка:** https://app.gitbook.com/o/AXievlr1dm3uTPaIaeap/sites/site_25wGw
- **ЛК:** https://lk.rspace.pro
- **Админка:** https://admin.rspace.pro
- **Лендинг:** https://rspace.pro

## История волн работы

Все крупные правки документированы в `CHANGELOG.md` по датам. Сейчас прошли волны 1-12 (верификация → правки → скрины → GitBook-публикация → зачистка user-facing).

---

_Последнее обновление: 2026-04-23. Поддерживаем ручной правкой при крупных изменениях процесса/стиля/структуры._
