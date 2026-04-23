# _verification/ — инструменты проверки доки против GitLab

## Файлы

- `parse_routes.py` — парсит `routes/api.php` (скачанный в `/tmp/api.php`), выдаёт JSON-массив роутов.
  - Поддерживает мульти-строчные `Route::verb(...)`, вложенные `prefix()`/`middleware()`, `->group()`.
  - Результат: `/tmp/routes.json`.
- `verify_api_ref.py <md_file> [prefix]` — сверяет endpoint-упоминания в markdown с routes.json. Требует `/tmp/routes.json`.
  - Паттерны: `` `VERB /path` ``, `### VERB /path`, в таблицах.
  - Флаг fuzzy-match: `{any_name}` в доке ~ `{actual_param}` в коде.
- `routes-dev-2026-04-23.json` — последний дамп роутов (306 штук).

## Как обновить дамп

```bash
TOKEN='<PAT>'
curl -s -H "PRIVATE-TOKEN: $TOKEN" \
  "https://git.rs-app.ru/api/v4/projects/682/repository/files/routes%2Fapi.php/raw?ref=dev" \
  > /tmp/api.php
python3 _verification/parse_routes.py
cp /tmp/routes.json _verification/routes-dev-YYYY-MM-DD.json
```

## Как сверить файл

```bash
cp _verification/routes-dev-2026-04-23.json /tmp/routes.json
python3 _verification/verify_api_ref.py internal/03-api-reference/realties.md /realties
```

Ожидаемый результат: `Matched: N == Claimed: N`, `Missing: 0`.

## Известные баги скрипта

- Reverse-lookup (code→doc) иногда даёт ложные срабатывания с `{param}` — regex-эскапировка `{` даёт сбой. Matched/Missing достоверные, «Не упомянуто в доке» — только подсказка, требует глазной проверки.
