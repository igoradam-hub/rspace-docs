# Workflow — как работать с проектом

## Локально ↔ GitHub ↔ GitBook

### Схема синхронизации

```
┌──────────────────┐                 ┌─────────────────────┐
│  Local md files  │   git push      │  GitHub             │
│  /external/*.md  │────────────────→│  igoradam-hub/      │
│  /internal/*.md  │                 │  rspace-docs        │
└──────────────────┘                 └──────────┬──────────┘
                                                │  webhook
                                                ▼
                                     ┌─────────────────────┐
                                     │  GitBook Git Sync   │
                                     │  (auto, ~30-60s)    │
                                     └──────────┬──────────┘
                                                │
                                                ▼
                                     ┌─────────────────────┐
                                     │  Public URL         │
                                     │  rspace.gitbook.io  │
                                     └─────────────────────┘
```

**Двусторонне:** если юзер редактирует в GitBook UI — GitBook автоматически делает commit обратно в GitHub. Из-за этого при локальных правках **обязательно сначала pull**.

## Как пушить правки

### Из sandbox (где работает Claude)

❌ `git push` **не работает** — в sandbox нет credentials (нет доступа к Mac Keychain / gh CLI).

### С Mac пользователя

✅ **Двойной клик по `_scripts/deploy-to-github.command`** в Finder — один шаг.

Что делает скрипт:
1. `cd rspace-docs`
2. `git add -A`
3. `git commit -m "docs: update YYYY-MM-DD"` (если есть что коммитить)
4. `git push origin main`

Использует `gh` CLI (уже установлен и залогинен на Mac).

### Вручную через терминал

```bash
cd ~/Projects/rspace/rspace-docs
git add -A
git commit -m "docs: <краткое описание>"
git push origin main
```

## Как проверить что GitBook засинкался

### Вариант 1: curl на публичный URL

```bash
curl -s "https://rspace.gitbook.io/rspace-docs/<путь>" | grep "<что-ищем>"
```

Например:
```bash
curl -s "https://rspace.gitbook.io/rspace-docs/17-contacts" | grep "047-24-77"
```

### Вариант 2: проверить gitSync state через API

```bash
TOKEN="gb_api_…"   # см. .auth-creds.json или GitBook settings
SPACE="0BEM5MAobbkUU0Ee3MF6"  # external
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.gitbook.com/v1/spaces/$SPACE" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print('gitSync updatedAt:', d['gitSync']['updatedAt'])"
```

### Вариант 3: hard refresh в браузере

- **Mac:** Cmd+Shift+R
- **Windows:** Ctrl+F5
- **Или** инкогнито / приватная вкладка (там нет кэша).

## Типичные сценарии

### «Поправь в документации X»

1. Правь `external/*.md` или `internal/*.md` в sandbox.
2. Укажи user'у: «двойной клик по `deploy-to-github.command`».
3. Через 30-60 сек проверь публичный URL через curl.

### «Добавь новую страницу»

1. Создай `external/NN-name.md` (или `internal/`).
2. Обнови `external/README.md` — добавь ссылку в правильную секцию.
3. Push → GitBook автоматически подхватит.

### «Обнови скриншоты»

1. Запусти `_scripts/run-screenshots.command` (либо `run-extra.command` для доп.сценариев, либо `landing-screens.mjs` для лендинга).
2. Pillow сжимает автоматически.
3. `deploy-to-github.command` — push.
4. Если нужно вставить `![](…)` в markdown — правь md в sandbox, потом опять push.

### «Обнови цены / тарифы»

1. **Сначала правь `knowledge/data-points.md`** — это source of truth.
2. Потом пройдись по всем файлам где цифры встречаются: `external/01-tariffs.md`, `external/07-legal.md`, `external/00-about.md`, `external/13-faq.md`.
3. Используй grep:
   ```bash
   grep -rn "9 000" external/
   grep -rn "7 000" external/
   ```
4. Push.

## Скрипты в `_scripts/`

| Файл | Что делает | Когда запускать |
|---|---|---|
| `deploy-to-github.command` | Коммит + push | После любых правок |
| `landing-screens.mjs` | Снимает 10 скринов `rspace.pro` (playwright headless) | Редкое обновление лендинга |
| `run-screenshots.command` | Снимает 6 ЛК + 14 админки (с авто-логином) | Обновление UI |
| `run-extra.command` | Снимает object-edit + wallet-zoom + 4 публичных | После ключевых изменений ЛК |
| `compress-screens.py` | Сжимает PNG через Pillow | Автоматически в launcher'ах |
| `screens-auth.mjs` | Backend для `run-screenshots.command` | Через launcher |
| `screens-extra.mjs` | Backend для `run-extra.command` | Через launcher |

## Где креды

- **`_scripts/.auth-creds.json`** — LK + Admin логины/пароли для playwright. **Gitignored.**
- **`_scripts/.auth-state.json`** — сохранённая playwright-сессия. **Gitignored.**
- **GitHub auth** — через `gh` CLI на Mac пользователя. В sandbox не доступно.
- **GitBook API token** — `gb_api_fAaG5w62kIo9MDzBFg4Q7d2O4pKtjggW0T0bIbvp`. Не коммитить.

## Важные IDs GitBook

- **Organization:** `AXievlr1dm3uTPaIaeap` (Rspace)
- **Site:** `site_25wGw` (Rspace Docs, ultimate tier)
- **Space External:** `0BEM5MAobbkUU0Ee3MF6` («Документация для риелторов»)
- **Space Internal:** `2RzLw8hycrC3nCMygSg7` («Техническая документация (для команды)»)

## Git-репо

**GitHub:** https://github.com/igoradam-hub/rspace-docs (public, owned by `igoradam-hub`)

**GitLab RSpace (read-only, для reference):**

- Backend: `https://git.rs-app.ru/rspase/project/backend` (ветка `dev`)
- Frontend (lk.rspace.pro): `https://git.rs-app.ru/rspase/project/frontend` (ветка `develop`)
- Landing (rspace.pro): `https://git.rs-app.ru/rspase/landing/next` (ветка `dev`)

## Как починить если GitBook не синкается

1. **Подождать 2 минуты** — обычно webhook срабатывает сразу, но иногда задержка.
2. **Принудительно re-publish через API:**
   ```bash
   curl -X POST -H "Authorization: Bearer $TOKEN" \
     "https://api.gitbook.com/v1/orgs/$ORG/sites/$SITE/publish"
   ```
3. **Зайти в GitBook app → кликнуть "Synced" → увидеть список последних коммитов.** Если там пусто — пересоздать Git Sync через UI (редко, если GitHub App вышел из строя).
4. **Последнее средство:** отключить Git Sync через UI и подключить заново.

## Checklist перед релизом документации

- [ ] Все правки соответствуют `knowledge/voice.md`
- [ ] Все термины согласуются с `knowledge/terms.md`
- [ ] Цифры актуальны по `knowledge/data-points.md`
- [ ] Нет имён, метастрок, эмодзи в публичной документации
- [ ] Внутренние ссылки рабочие (`./*.md`)
- [ ] Скриншоты подгружаются (`../assets/screenshots/...`)
- [ ] `CHANGELOG.md` обновлён
- [ ] Push сделан
- [ ] GitBook засинкал (curl verify)
