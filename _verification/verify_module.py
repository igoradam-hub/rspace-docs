"""
Сверяет markdown-модуль против tree_app_full.json.
Извлекает все path-like строки (`app/...`), проверяет существуют ли в коде.
"""
import json, re, sys
from collections import Counter

tree = json.load(open('/tmp/tree_app_full.json'))
present = {x['path'] for x in tree}
present_dirs = set()
for p in present:
    parts = p.split('/')
    for i in range(1, len(parts)):
        present_dirs.add('/'.join(parts[:i]))

md = open(sys.argv[1]).read()
name = sys.argv[1].split('/')[-1]

# Паттерны: `app/...` или backtick path
pattern = re.compile(r"`(app/[\w/\.\-]+)`")
paths = set()
for m in pattern.finditer(md):
    paths.add(m.group(1))

# Классы: `\S+::class`, `ModelName` (CamelCase upper), etc - сложнее, скип.

# Heuristic: также ищем raw paths (без бэктиков) в таблицах/markdown
pattern2 = re.compile(r"\bapp/(?:[A-Z]\w*/)+[A-Z]\w+\.php\b")
for m in pattern2.finditer(md):
    paths.add(m.group(0))

missing = []
matched = []
for p in sorted(paths):
    # Normalize trailing slash
    np = p.rstrip('/')
    if np in present or np in present_dirs:
        matched.append(p)
    else:
        # partial match — возможно unit part exists
        # например app/Realty/ встречается как 'app/Realty/Prompts'
        found = False
        # Для директорий пытаемся проверить substring
        if not np.endswith('.php'):
            if any(d.startswith(np) or np.startswith(d) for d in present_dirs):
                matched.append(p)
                found = True
        if not found:
            missing.append(p)

print(f"=== {name} ===")
print(f"Paths mentioned: {len(paths)}")
print(f"Matched: {len(matched)}")
print(f"Missing/Unknown ({len(missing)}):")
for p in missing:
    print(f"  ✗ {p}")
