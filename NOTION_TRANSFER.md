# Перенос в Notion — чек-лист (Волна 11)

Этот документ описывает финальную задачу: перенести всю локальную документацию из `rspace-docs/` в Notion.

## Предусловия

- [ ] Все волны 1-10 завершены, контент проверен пользователем.
- [ ] Скриншоты в `assets/screenshots/` готовы и оптимизированы (`pngquant`, ≤500KB).
- [ ] Mermaid-диаграммы в `assets/diagrams/` отрендерены (или остаются как mermaid-код-блоки для нативного рендера в Notion).
- [ ] Пользователь подтвердил Notion-токен всё ещё валиден.

## Доступы

- Notion API token: в `~/.rspace-docs.env` как `NOTION_TOKEN`.
- Root page id: `33702320-7e2e-8196-be9e-e6dda91d42c5` («Документация RSpace»).
- Parent root id: `33702320-7e2e-80d0-89a1-ff44894841d7`.

## Шаги

### 1. Подготовка скриптов
- [ ] `scripts/notion_push.py` — uploader markdown → Notion blocks. Idempotent по `manifest.json`.
- [ ] `scripts/md_to_blocks.py` — конвертер CommonMark → Notion blocks. Поддержка: heading_1/2/3, paragraph, bulleted/numbered list, code, quote, table, divider, toggle, callout (без icon-поля), image (external URL), embed (для Loom/YouTube).
- [ ] `scripts/notion_archive.py` — одноразовая утилита массовой архивации старых страниц под root (18 известных).
- [ ] `scripts/upload_asset.py` — заливка PNG/SVG. Проверить наличие Notion File Upload API на workspace (`POST /v1/file_uploads`); fallback — приватный GitHub `rspace-docs-assets` + `raw.githubusercontent.com` URLs.

### 2. Зачистка старого контента
- [ ] Unarchive root: `PATCH /pages/{id}` с `archived: false`.
- [ ] Пройти `POST /search` с текущим токеном, получить список всех видимых интеграции страниц.
- [ ] Архивировать все, не являющиеся root: `PATCH /pages/{id}` с `archived: true`. Записать список в `manifest.json` → `archived-registry` на случай отката.

### 3. Создание новой иерархии
- [ ] Создать sub-page «Помощь риелтору» под root. Сохранить page-id в `manifest.json → roots.external`.
- [ ] Создать sub-page «Engineering Handbook» под root. Сохранить в `manifest.json → roots.internal`.
- [ ] Задать иконки (emoji или image — через `icon` property, не null).

### 4. Заливка контента волнами
Для каждой волны:
- [ ] Собрать список md-файлов, принадлежащих волне.
- [ ] Пушить скриптом: `python3 scripts/notion_push.py --wave 1` (или по путям).
- [ ] Скрипт для каждого файла: create/update page через `POST/PATCH /pages`, потом batch push блоков (по 100 блоков max на запрос) через `PATCH /blocks/{id}/children`.
- [ ] Заливать ассеты: каждый `![...](assets/screenshots/x.png)` → загрузка/link → image block с external URL.
- [ ] Записать page-id в `manifest.json`.
- [ ] Визуальная проверка в Notion UI: таблицы, код, списки, embed-видео, mermaid (через code-block language=mermaid).

### 5. Cross-references
- [ ] Обработать внутренние ссылки: заменить `./other-page.md` на `https://www.notion.so/<page-id>` в ссылках, пройтись вторым проходом после полной заливки.
- [ ] Создать в корне каждой sub-page оглавление (TOC) со ссылками на все разделы.

### 6. Финализация
- [ ] Задать видимость sub-pages (public sharing через UI, не API).
- [ ] Добавить в начало «Помощь риелтору» краткий intro с ключевыми разделами.
- [ ] В «Engineering Handbook» — quick-start для новых разработчиков.
- [ ] Проверить мобильный вид (саппорт может читать с телефона).

### 7. Verification
- [ ] Обойти все страницы, проверить что рендер корректен (нет пустых блоков, таблицы не разъехались, код в code-блоках).
- [ ] Проверить что все assets отображаются.
- [ ] Проверить навигацию: из любой страницы можно вернуться в оглавление.

## Технические ограничения Notion API (памятка)

- `{"icon": null}` — API отклоняет. Удаление иконки = не передавать поле вообще.
- Callout blocks: `icon` — omit, не передавать null.
- `PATCH /blocks/{id}/children` — max 100 блоков за запрос. Для длинных страниц — батчить.
- Public sharing через API невозможно — только в UI.
- File Upload API (`POST /v1/file_uploads`) доступен только на paid workspace. Проверить тир перед использованием.
- Mermaid: Notion рендерит нативно из code-block с `language=mermaid`.

## Rollback-стратегия

Если что-то пошло не так при заливке:
1. Из `manifest.json → archived-registry` можно восстановить старые страницы (`PATCH /pages/{id}` с `archived: false`).
2. Новые страницы волны архивируем через `PATCH /pages/{id}` с `archived: true`.
3. `manifest.json` под git'ом (если решим подключить) — можно откатить состояние.
