#!/bin/bash
# Auto-login screenshot pipeline. Creds в `.auth-creds.json` (gitignored).

set -e
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════════════════════"
echo " RSpace — авто-съёмка скриншотов ЛК и админки"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🚀 Запускаю screens-auth.mjs..."
echo ""
node _scripts/screens-auth.mjs

echo ""
echo "📐 Сжимаю..."
python3 _scripts/compress-screens.py 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " ✅ Готово. Скриншоты в:"
echo "    $(pwd)/assets/screenshots/lk/"
echo "    $(pwd)/assets/screenshots/admin/"
echo "═══════════════════════════════════════════════════════════════"
read -n 1 -s -r -p "Любую клавишу для закрытия..."
