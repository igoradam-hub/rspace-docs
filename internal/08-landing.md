# 08. Лендинг (rspace.pro)

> **Аудитория:** frontend-разработчики, маркетинг, продукт.
> **Репозиторий:** `rspase/landing/next`
> **Prod-ветка:** `dev` (deploy автоматический) → `premaster` (deploy на прод через manual)
> **Домен:** [rspace.pro](https://rspace.pro)
> **Последнее обновление:** 2026-04-23

Маркетинговый сайт. Точка входа для регистрации. Next.js 15 с статическим экспортом (частично). Несколько A/B/C/D вариантов.

## Стек

Из `package.json` ветки `dev`:

| Категория | Пакет | Версия |
|---|---|---|
| **Framework** | `next` | **15.4.8** |
| **React** | `react`, `react-dom` | 19.1.0 |
| TypeScript | `typescript` | 5.x |
| **Styling** | `tailwindcss` + `@tailwindcss/postcss` | **v4** |
| **UI primitives** | `@radix-ui/react-*` (dialog, checkbox, label, select, slot) | latest |
| **Формы** | `react-hook-form` + `@hookform/resolvers` | 7.62 / 5.2 |
| **Schema validation** | `zod` | 4.1 |
| **Input masks** | `@maskito/core`, `@maskito/react`, `@maskito/kit` | 3.10 |
| **Слайдеры** | `swiper` | 11.2 |
| **Icons** | `lucide-react` | 0.539 |
| **Class utils** | `clsx`, `class-variance-authority`, `tailwind-merge` | 2/0.7/3.3 |
| **SVG как компоненты** | `@svgr/webpack` | 8.1 (dev) |
| **Utilities** | `tw-animate-css` | 1.3 (dev) |

## Структура репозитория

```
landing/next/
├── src/
│   ├── app/                          ← Next.js App Router
│   │   ├── page.tsx                  ← главная / (Hero + все секции)
│   │   ├── layout.tsx                ← root layout
│   │   ├── globals.css               ← токены дизайн-системы (455 строк)
│   │   ├── icon.svg, apple-icon.png
│   │   └── docs/
│   │       ├── layout.tsx            ← общий layout для документов
│   │       ├── oferta/page.tsx       ← /docs/oferta
│   │       ├── oferta-vivod/page.tsx ← /docs/oferta-vivod
│   │       ├── privacy/page.tsx      ← /docs/privacy
│   │       └── consent/page.tsx      ← /docs/consent
│   │
│   ├── components/                   ← секции и UI-компоненты
│   ├── constants.tsx                 ← статичные данные
│   ├── helpers/                      ← утилиты
│   ├── hooks/                        ← React hooks
│   ├── lib/                          ← lib-функции (включая varioqub.ts)
│   ├── types/                        ← TS types (about, faq)
│   └── utils/                        ← общие утилиты
├── public/                           ← статика (svg, webp, fonts)
├── next.config.ts                    ← Next-конфиг (standalone build)
├── postcss.config.mjs                ← Tailwind v4 PostCSS
├── tailwind.config.* или @theme в CSS
├── Dockerfile                        ← Node 22.14 Alpine
├── docker-compose.yml
├── .gitlab-ci.yml
└── package.json
```

## Секции главной страницы

Всё в `src/components/`, собрано в `src/app/page.tsx`:

| Компонент | Что делает |
|---|---|
| `header.tsx` | Шапка — лого + навигация + селектор города + Telegram/WhatsApp кнопки |
| `header-navigation-items.tsx` | Навигационные ссылки |
| `header-select-city.tsx` | Выпадашка выбора города |
| `header-buttons-wrapper.tsx` | Соц-кнопки |
| `hero.tsx` | Hero-блок (заголовок + CTA + изображение) |
| `about.tsx` + `about-benefit.tsx` | Блок «О сервисе» с преимуществами |
| `advantages.tsx` | Ряд преимуществ |
| `realtors-feed.tsx` | Видео-отзывы риелторов |
| `realtors-video.tsx` + `realtors-videos.tsx` | Плеер и список видео |
| `realtors-helper.tsx` + `realtors-helper-item.tsx` | «Помощь риелтору» |
| `income.tsx` + `income-item.tsx` + `income-item-description.tsx` | Как зарабатываете (4-5 пунктов) |
| `income-stats.tsx` + `income-stats-item.tsx` + `income-stats-table.tsx` | Статистика доходов |
| `savings-details.tsx` | Расчёт экономии по тарифам |
| `instruments.tsx` | «Инструменты» (12 тайлов с иконками) |
| `rspace-pro.tsx` | Блок «RSpace PRO» (коммьюнити) |
| `services.tsx` | Список услуг |
| `subscription-prices.tsx` + `subscription-prices-item.tsx` | Тарифная сетка |
| `faq.tsx` + `question.tsx` | FAQ аккордеон |
| `call-to-action.tsx` | Финальный CTA |
| `footer.tsx` | Футер |
| `feedback-dialog.tsx` + `feedback-form.tsx` | Модалка обратной связи |

### UI-примитивы (`src/components/ui/`)

- `button.tsx` — Radix Slot + CVA variants (`primary`, `secondary`, `outline`, `ghost`, `magenta`).
- `input.tsx`, `label.tsx`, `checkbox.tsx`, `select.tsx`, `dialog.tsx`, `form.tsx` — Radix UI + Tailwind стилизация.
- `highlighted-text.tsx` — **signature-элемент**: lime-прямоугольник за ключевым словом заголовка.
- `text-switch.tsx` — анимированный text toggle.
- `tracked-button.tsx`, `tracked-link.tsx` — кнопки/ссылки с Metrika-трекингом.

## Docs-страницы

Приватные юр-документы:
- `/docs/oferta` — публичная оферта.
- `/docs/oferta-vivod` — оферта на вывод средств (отдельный документ).
- `/docs/privacy` — политика конфиденциальности.
- `/docs/consent` — согласие на обработку ПД.

Обычно — статичные MD/HTML, рендерятся напрямую.

## Аналитика

### Yandex Metrika
`hooks/use-yandex-metrika.ts` + `components/yandex-metrika-initializer.tsx`.

**Prod-counter:** `104015550`.
**Test-counter:** `104317883`.

⚠️ **Known issue:** в `.env.example` указан **test counter** — нужно убедиться, что prod env перезаписывает на правильный. См. [14. Tech Debt](./14-tech-debt.md).

### UTM capture
`components/utm-capture.tsx` + `hooks/use-utm-params.ts`.

Снимает UTM из URL при заходе на лендинг, сохраняет в localStorage/cookies, передаёт на backend при регистрации (`POST /auth/register` — поля `utm_source`, `utm_medium`, и т.д.).

⚠️ **Известное ограничение:** исторически UTM не всегда доходили до backend. Исправлено в последних коммитах на `dev` (проверить актуальность).

### PostHog
PostHog через **reverse proxy**: `/api/ingest` на нашем домене проксирует в `eu.posthog.com`, чтобы:
- Обойти блокировщики рекламы.
- Данные идут с вашего домена (нет CORS/cookies issues).

### Varioqub
`src/lib/varioqub.ts` — интеграция с Яндекс.Varioqub (A/B-тестирование на платформе Яндекса). Скрипт подтягивается на старте.

## A/B/C/D варианты

Продакшн-лендинг обслуживает **4 варианта контента**, каждый на своём поддомене:
- `a.rspace.pro`, `b.rspace.pro`, `c.rspace.pro`, `d.rspace.pro`

Разделение:
- **Branch-based**: каждый вариант — отдельная ветка (`test/variant-a`, ..., или `feature/RSPASE-varioqub@*`).
- **Env-переменная** `NEXT_PUBLIC_VARIANT=a|b|c|d` читается через helper `getVariant()` в `@/lib/variant`.
- Деплой — через GitLab CI на свой поддомен.

Основной prod (`rspace.pro`) — контент текущий `dev`-ветки, переключённый вручную через `premaster`.

## Сборка и деплой

### Docker

`Dockerfile` (Node 22.14 Alpine):
```
Stage 1: build
  - npm ci
  - npm run build (Next.js standalone output)
Stage 2: runtime
  - Копируется .next/standalone + public
  - node server.js
```

### GitLab CI

`.gitlab-ci.yml`:

```
stages: [deploy_dev, deploy_prod]

deploy_dev (on: dev):
  build_frontend_dev:
    - docker build --build-arg BASE_URL=$BASE_URL .
    - docker push $CI_REGISTRY/rspase/landing/next:${BRANCH}-${SHA}
  deploy_front_dev:
    - docker compose pull && up -d (rspace_dev runner)
  clean_up_dev:
    - prune images

deploy_prod (on: premaster, manual trigger):
  build_frontend_prod:
    - docker build --build-arg BASE_URL=$BASE_URL_PROD --build-arg NODE_ENV=$NODE_ENV_PROD .
  deploy_front_prod:
    - rs_prod runner
  clean_up_prod
```

Полная настройка CI — в Волне 9 [13-dev-process.md](./13-dev-process.md).

## Env-переменные

```
BASE_URL=                  # URL API backend'а
NODE_ENV=production|development
YANDEX_METRIKA_ID=         # ID счётчика Метрики
NEXT_PUBLIC_VARIANT=       # a|b|c|d — для A/B-деплоя
```

## SEO

- **Sitemap** — **статический** `public/sitemap.xml` (сгенерирован через внешний `xml-sitemaps.com`, дата `lastmod` 2025-10-31). `src/app/sitemap.ts` нет — автогенерация через Next.js App Router не используется. При добавлении новых страниц sitemap нужно обновлять вручную или заменить на `sitemap.ts` от Next.js.
- **robots.txt** — в `public/robots.txt`.
- **Open Graph** — в `layout.tsx` через Next.js Metadata API.
- **favicon** — `src/app/icon.svg`, `apple-icon.png`.

## Performance

Tailwind v4 — CSS генерируется без JS-runtime (в отличие от v3 с JIT). Размер бандла меньше.

Next.js 15 + React 19 — улучшенная hydration, Server Components где возможно.

## Known issues

- **11 open issues** в GitLab с августа 2025 — устаревшие задачи (Lighthouse analysis, ESLint errors, code style). Нужен аудит — проверить, актуальны ли.
- **Yandex Metrika counter** — в `.env.example` test ID; в prod должна быть 104015550.
- **UTM capture ошибки** — исторически не всегда доходят до backend. Проверить текущее состояние.
- **A/B-варианты** — устаревшая инфраструктура (feature-branch per variant вместо feature-flags), усложняет поддержку.
- **Hydration warnings** — аналогично фронтенду кабинета (условный рендер скриптов) могут быть SSR-mismatch'и.

## Связанные разделы

- [07. Frontend (lk)](./07-frontend.md) — сосед, но другой стек.
- [09. Дизайн-система](./09-design-system.md) — токены и компоненты (globals.css — источник).
- [05-integrations/yandex-metrika.md](./05-integrations/yandex-metrika.md) (Волна 9) — аналитика.
- [13. Процессы разработки](./13-dev-process.md) (Волна 9).

## Ссылки GitLab

- [Репо landing](https://git.rs-app.ru/rspase/landing/next)
- [Ветка dev](https://git.rs-app.ru/rspase/landing/next/-/tree/dev)
- [package.json](https://git.rs-app.ru/rspase/landing/next/-/blob/dev/package.json)
- [src/components/](https://git.rs-app.ru/rspase/landing/next/-/tree/dev/src/components)
- [globals.css](https://git.rs-app.ru/rspase/landing/next/-/blob/dev/src/app/globals.css)
- [.gitlab-ci.yml](https://git.rs-app.ru/rspase/landing/next/-/blob/dev/.gitlab-ci.yml)
