#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════"
echo " RSpace — дополнительные скрины (6 штук)"
echo "═══════════════════════════════════════════════"
echo ""
node _scripts/screens-extra.mjs

echo ""
echo "📐 Сжимаю..."
python3 _scripts/compress-screens.py 2>/dev/null || true

echo ""
echo "✅ Готово."
read -n 1 -s -r -p "Любую клавишу для закрытия..."
