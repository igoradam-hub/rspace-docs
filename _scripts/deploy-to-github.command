#!/bin/bash
# Создаёт публичный репозиторий github.com/igoradam-hub/rspace-docs
# и пушит туда всю документацию. После — GitBook подключается к этому репо.

set -e
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════"
echo " Пушу rspace-docs на GitHub"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Проверка git-репо
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init -b main
  git config user.email "igor.adam@rspace.pro"
  git config user.name "Igor Adam"
fi

# 2. Добавляем изменения если что-то не закомичено
git add -A
if ! git diff --staged --quiet; then
  git commit -m "docs: update $(date +%Y-%m-%d)"
fi

# 3. Настраиваем remote
if ! git remote | grep -q origin; then
  # Пробуем gh CLI сначала
  if command -v gh >/dev/null 2>&1; then
    echo "→ Создаю публичный репо через gh CLI..."
    gh repo create igoradam-hub/rspace-docs --public --source=. --push || {
      echo "❌ gh не смог (возможно не залогинен). Запусти: gh auth login"
      exit 1
    }
    echo "✅ Запушено"
    echo ""
    echo "GitHub URL: https://github.com/igoradam-hub/rspace-docs"
  else
    echo "⚠️  GitHub CLI (gh) не установлен."
    echo ""
    echo "Установи:  brew install gh  →  gh auth login"
    echo "ИЛИ создай репо вручную:"
    echo "  1. Открой https://github.com/new"
    echo "  2. Name: rspace-docs, Public, БЕЗ README/license"
    echo "  3. Create repository"
    echo ""
    echo "Потом запусти эту команду в терминале:"
    echo "  cd $(pwd)"
    echo "  git remote add origin https://github.com/igoradam-hub/rspace-docs.git"
    echo "  git push -u origin main"
    exit 1
  fi
else
  echo "→ Remote уже есть, пушу изменения..."
  git push origin main || {
    echo "❌ Push не прошёл. Проверь auth."
    exit 1
  }
fi

echo ""
echo "═══════════════════════════════════════════════"
echo " Далее Claude подключит этот репо к GitBook."
echo "═══════════════════════════════════════════════"
read -n 1 -s -r -p "Любую клавишу для закрытия..."
