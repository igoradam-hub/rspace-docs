"""Улучшенный парсер — обрабатывает мульти-строчные Route::verb(...) вызовы."""
import re, json

with open('/tmp/api.php') as f:
    content = f.read()
lines = content.split('\n')

# Склеим в один текст с сохранением строк — нужно знать номер строки каждого Route::verb(...)
# Простой подход: скан однопроходный, когда встречаем Route::verb( — собираем до парной ) с учётом строк
stack = []

def scan_group_header(line):
    m_prefix = re.findall(r"prefix\(['\"]([^'\"]*)['\"]\)", line)
    m_mw = re.findall(r"middleware\(['\"]([^'\"]+)['\"]\)", line)
    is_group = '->group(' in line
    return m_prefix[0] if m_prefix else '', ','.join(m_mw) if m_mw else '', is_group

results = []
i = 0
while i < len(lines):
    line = lines[i]
    # Откроем группу, если там есть prefix/group
    prefix, mw, is_group = scan_group_header(line)
    if is_group:
        stack.append((prefix, mw, i+1))
    # Ищем Route::verb( — может начаться на этой строке
    m = re.search(r"Route::(get|post|put|patch|delete)\(", line)
    if m:
        verb = m.group(1).upper()
        # Захватим текст от m.end() и следующие строки до парной ')'
        start_line = i + 1
        snippet = line[m.end():]
        depth = 1  # уже в (
        j = i
        while depth > 0 and j < len(lines):
            if j > i: snippet += '\n' + lines[j]
            for ch in (lines[j] if j > i else line[m.end():]):
                if ch == '(': depth += 1
                elif ch == ')':
                    depth -= 1
                    if depth == 0: break
            if depth == 0: break
            j += 1
        # snippet теперь содержит '/path', [Controller::class, 'method'])... + chain
        m_path = re.match(r"\s*['\"]([^'\"]*)['\"]\s*,\s*(?:\[([A-Za-z0-9_\\]+)::class\s*,\s*['\"]([A-Za-z0-9_]+)['\"]\])?", snippet)
        if m_path:
            path = m_path.group(1)
            ctrl = m_path.group(2) or ''
            method = m_path.group(3) or ''
            # Inline chain методы после закрытия ):
            rest_lines = []
            k = j + 1
            while k < len(lines) and (lines[k].strip().startswith('->') or lines[k].strip().startswith(';')):
                rest_lines.append(lines[k])
                if ';' in lines[k]: break
                k += 1
            inline = line + '\n' + '\n'.join(rest_lines)
            inline_mw = re.findall(r"middleware\(['\"]([^'\"]+)['\"]\)", inline)
            inline_without = re.findall(r"withoutMiddleware\(['\"]([^'\"]+)['\"]\)", inline)
            full_prefix = ''.join(s[0] for s in stack if s[0])
            full_path = full_prefix + path
            full_path = re.sub(r'/+', '/', full_path)
            if not full_path.startswith('/'): full_path = '/' + full_path
            mws = [s[1] for s in stack if s[1]]
            if inline_mw: mws.extend(inline_mw)
            results.append({
                'line': start_line,
                'verb': verb,
                'path': full_path,
                'controller': ctrl,
                'method': method,
                'middleware': ','.join(mws),
                'without_middleware': ','.join(inline_without),
            })
        # перескочим на j (закрытие )
        i = j
    # Закрытия групп
    closes = line.count('});')
    for _ in range(closes):
        if stack: stack.pop()
    i += 1

print(f"Total: {len(results)}")
with open('/tmp/routes.json','w') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
# Саммари
from collections import Counter
cnt = Counter((r['verb'], r['path']) for r in results)
print(f"Unique (verb,path): {len(cnt)}")
# Подсчёт по middleware
mw_counter = Counter()
for r in results:
    mw_counter['auth:admin' if 'auth:admin' in r['middleware'] else 'auth:user' if 'auth:user' in r['middleware'] else 'none/special'] += 1
print(dict(mw_counter))

# Admin routes которых не было в старой версии:
print("\n=== Теперь найдено /complete: ===")
for r in results:
    if 'complete' in r['path'] and 'promotions' in r['path']:
        print(f"  {r['verb']:6} {r['path']}")
