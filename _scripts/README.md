# _scripts/ — вспомогательные скрипты

Каталог с автоматизациями вне markdown-докуменации.

## Файлы

| Файл | Для чего |
|---|---|
| `landing-screens.mjs` | Снимает 10 скриншотов лендинга `rspace.pro` через playwright (headless). |
| `screens-auth.mjs` | Снимает все авторизованные экраны ЛК и админки. **Требует ручного логина при первом запуске** (один раз). |
| `compress-screens.py` | Прогоняет все PNG через Pillow: ресайз до 1440px max + optimize. Запускать после съёмки. |

## Как снять ВСЕ скриншоты

### Предварительная установка

```bash
cd rspace-docs
npm i --no-save playwright
npx playwright install chromium
# (Pillow уже есть в стандартной сборке Python, если нет — `pip3 install pillow`)
```

### 1. Лендинг (полностью автоматически)

```bash
node _scripts/landing-screens.mjs
```

Сохранит 10 PNG в `assets/screenshots/landing/`. Логин не нужен, это публичный сайт.

### 2. ЛК + Админка (с одноразовым логином)

```bash
node _scripts/screens-auth.mjs
```

**Первый запуск:** откроется браузер, ты логинишься в `lk.rspace.pro` и `admin.rspace.pro`, нажимаешь Enter в терминале. Скрипт сохранит auth-state в `_scripts/.auth-state.json` и прогонит все экраны.

**Повторные запуски:** сразу использует сохранённую сессию, ничего не просит.

Результат: 8 экранов в `assets/screenshots/lk/` и 14 экранов в `assets/screenshots/admin/`.

### 3. Сжатие

```bash
python3 _scripts/compress-screens.py
```

Прогоняет всё что есть в `assets/screenshots/*/` через оптимизатор. Идёмпотентно (пропускает уже сжатые).

## Что НЕ автоматизировано

- **GIF-записи ключевых flow** (4 штуки в `SCREENSHOTS-PLAN.md`) — пока снимать руками через QuickTime / Kap или аналог.
- **Мобильные экраны** — планируется отдельным скриптом с mobile-вьюпортом.

## Почему не единый скрипт

`landing-screens.mjs` работает в headless без логина — запускается мгновенно в любом окружении (включая CI).
`screens-auth.mjs` требует headed-браузер для ручного логина. Разделены, чтобы лендинг можно было обновлять автоматически.

## Файл `.auth-state.json`

Содержит cookies сессии. **В git не коммитится** (см. `.gitignore`). Удали файл чтобы принудительно перелогиниться:

```bash
rm _scripts/.auth-state.json
```
