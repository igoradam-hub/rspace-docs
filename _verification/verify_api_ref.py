"""
Читает markdown API-reference, ищет упоминания эндпоинтов, сверяет с routes.json.
Паттерны эндпоинтов в доках:
  - `POST /realties` (в бэктиках)
  - `POST` `/realties` (разделённые)
  - В таблицах: | `POST` | `/realties` | ... |
  - `GET /realties/{id}`
"""
import json, re, sys
from collections import defaultdict

if len(sys.argv) < 2:
    print("usage: verify_api_ref.py <md_file> [section_prefix=/]")
    sys.exit(1)

md_path = sys.argv[1]
prefix_filter = sys.argv[2] if len(sys.argv) > 2 else None

routes = json.load(open('/tmp/routes.json'))
# Индекс: (VERB, path) -> route
by_pair = {}
for r in routes:
    # Нормализуем path: убираем trailing slash кроме корня
    p = r['path'].rstrip('/') or '/'
    by_pair[(r['verb'], p)] = r
all_paths = {r['path']: r for r in routes}

md = open(md_path).read()

# Паттерн 1: `VERB /path` в бэктиках
pat1 = re.compile(r"`(GET|POST|PUT|PATCH|DELETE)\s+([/\w{}.:\-]+)`")
# Паттерн 2: `VERB` ... `/path`  (в таблицах)
pat2 = re.compile(r"`(GET|POST|PUT|PATCH|DELETE)`[^|`]*?`([/\w{}.:\-]+)`")
# Паттерн 3: heading "### VERB /path"
pat3 = re.compile(r"^#{2,4}\s+(GET|POST|PUT|PATCH|DELETE)\s+([/\w{}.:\-]+)", re.MULTILINE)

claims = []
for line_idx, line in enumerate(md.split('\n'), 1):
    for p in [pat1, pat2, pat3]:
        for m in p.finditer(line):
            v, path = m.group(1), m.group(2)
            if prefix_filter and not path.startswith(prefix_filter):
                continue
            claims.append((line_idx, v, path))
# Дедуп
seen = set()
uniq = []
for c in claims:
    key = (c[1], c[2])
    if key not in seen:
        seen.add(key)
        uniq.append(c)

print(f"FILE: {md_path}")
print(f"Claimed endpoints: {len(uniq)}")
print()
missing = []
matched = []
for line, v, path in uniq:
    # Нормализуем путь
    norm = path.rstrip('/') or '/'
    if (v, norm) in by_pair:
        matched.append((line, v, path))
    else:
        # Может быть роут с trailing slash в коде
        if (v, path + '/') in by_pair or (v, norm + '/') in by_pair:
            matched.append((line, v, path))
        else:
            # Попробуем fuzzy: без последнего сегмента с фигурными скобками
            # Или проверим параметризацию: /users/{id} в доке vs /users/{user_id} в коде
            found = False
            for (rv, rp), rr in by_pair.items():
                if rv != v: continue
                # Сравнение с wildcard параметров
                pattern_path = re.sub(r"\{[^}]+\}", r"\\{[^/]+\\}", re.escape(path))
                if re.fullmatch(pattern_path, rp) or re.fullmatch(pattern_path, rp + '/'):
                    matched.append((line, v, path, f"→ {rp}"))
                    found = True
                    break
            if not found:
                missing.append((line, v, path))

print(f"Matched: {len(matched)}")
print(f"Missing (в доке есть, в роутах НЕТ): {len(missing)}")
for line, v, path in missing:
    print(f"  L{line}  {v:6} {path}")

# Обратное: роуты, которые есть в коде, но НЕ упомянуты в доке (только в пределах prefix_filter)
print()
print(f"Не упомянуто в доке (подпрефикс: {prefix_filter or 'все'}):")
unmentioned = []
for r in routes:
    if prefix_filter and not r['path'].startswith(prefix_filter):
        continue
    key = (r['verb'], r['path'])
    # Проверим упоминалось ли
    ok = False
    for (vl, pl) in [(c[1], c[2]) for c in uniq]:
        if vl != r['verb']: continue
        pat = re.sub(r"\{[^}]+\}", r"\\{[^/]+\\}", re.escape(pl))
        if re.fullmatch(pat, r['path']) or re.fullmatch(pat, r['path'].rstrip('/')):
            ok = True
            break
    if not ok:
        unmentioned.append(r)
for r in unmentioned:
    print(f"  {r['verb']:6} {r['path']:50}  (line {r['line']})")
