# 07. Frontend (lk.rspace.pro)

> **Аудитория:** frontend-разработчики, QA, новый сотрудник.
> **Репозиторий:** `rspase/project/frontend`
> **Prod-ветка:** `develop` (⚠️ `main` — заморожена с 2025-04-18)
> **Домен:** [lk.rspace.pro](https://lk.rspace.pro)
> **Последнее обновление:** 2026-04-23

Кабинет риелтора — рабочая среда: объекты, публикации, лиды, услуги, подписка, выплаты. SSR на React Router 7.

## Стек

Из `package.json` ветки `develop`:

| Категория | Пакет | Версия |
|---|---|---|
| **Framework** | `react-router` | **7.11** |
| SSR-сервер | `@react-router/node`, `@react-router/serve` | 7.11 |
| **React** | `react`, `react-dom` | 19.2.3 |
| **UI-библиотека** | `@chakra-ui/react` | **3.27** |
| Emotion CSS-in-JS | `@emotion/react` | 11.14 |
| **Data fetching** | `@tanstack/react-query` | 5.74 |
| HTTP | `axios` | 1.8 |
| **State (Jotai)** | `jotai` | 2.12 |
| **Формы** | `formik` + `yup` | 2.4 / 1.6 |
| **Даты** | `date-fns` + `moment` | 4.1 / 2.30 |
| **DnD** | `@dnd-kit/core`, `@dnd-kit/sortable` | 6.3 / 10.0 |
| **Карты** | `@iminside/react-yandex-maps` | 1.2 |
| **Маски ввода** | `use-mask-input` | 3.4 |
| **Crop фото** | `react-easy-crop` | 5.4 |
| **Themes** | `next-themes` | 0.4 |
| **Debounce** | `use-debounce` | 10.0 |
| **Icons** | `react-icons` | 5.5 |
| **Slider** | `swiper` | 11.2 |
| **Bot-detection SSR** | `isbot` | 5.1 |
| **RSC** | `@vitejs/plugin-rsc` | 0.5 (экспериментальное) |
| Dev | TypeScript 5.7, Vite 5.4 |  |

## Структура репозитория

```
frontend/
├── app/
│   ├── api/              ← API-клиенты (axios), типы из swagger
│   ├── assets/           ← статика (картинки, иконки SVG, logo)
│   ├── components/       ← переиспользуемые компоненты
│   ├── constants/        ← enums, static data
│   ├── hooks/            ← кастомные React-хуки
│   ├── layouts/          ← базовые layout-компоненты
│   ├── pages/            ← крупные модули страниц (по доменам: my/, auth/, offer/)
│   ├── providers/        ← React-провайдеры (Query, Jotai, Chakra, Theme)
│   ├── routes/           ← route-модули React Router 7 (см. ниже)
│   ├── styles/           ← глобальные стили
│   ├── theme/            ← тема Chakra UI (tokens, components override)
│   ├── utils/            ← утилиты
│   ├── root.tsx          ← корневой layout (HTML, Metrika, providers)
│   ├── routes.ts         ← декларация маршрутов
│   └── types.ts          ← общие TS-типы
├── public/               ← статика (fonts, robots.txt)
├── swagger.json          ← OpenAPI-схема backend'а (тянется `fetch-swagger.sh`)
├── react-router.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile
├── docker-compose.yml
└── .gitlab-ci.yml
```

## Маршруты

Структура в `app/routes/`:

```
routes/
├── home.tsx                                    /
├── offer.tsx                                   /offer/{id}   (публичная карточка объекта)
│
├── auth/
│   ├── login.tsx                               /login         (под AuthLayout)
│   ├── logout.tsx                              /logout        (top-level, без layout)
│   ├── registration.tsx                        /registration  (под AuthLayout)
│   └── reset.tsx                               /reset         (под AuthLayout)
│
├── docs/
│   ├── offer.tsx                               /docs/offer    (оферта)
│   └── privacy.tsx                             /docs/privacy  (политика)
│
└── my/                                         /my (root кабинета, auth-only)
    ├── my.tsx                                  /my (dashboard)
    │
    ├── listing/
    │   ├── listings.tsx                        /my/listing        (список)
    │   ├── listing.tsx                         /my/listing/{id}   (одна карточка)
    │   ├── create/create.tsx                   /my/listing/create
    │   ├── edit/
    │   │   ├── edit.tsx                        /my/listing/{id}/edit
    │   │   ├── apartment.tsx, building.tsx,
    │   │   ├── house.tsx, land-plot.tsx,
    │   │   ├── location.tsx, deal-terms.tsx,
    │   │   ├── description.tsx, photo.tsx,
    │   │   ├── rooms.tsx, share.tsx,
    │   │   └── new-appartment-info.tsx         (суб-формы редактирования)
    │   ├── prolong/prolong.tsx                 /my/listing/{id}/prolong
    │   ├── promotion/promotion.tsx             /my/listing/{id}/promotion
    │   └── publication/publication.tsx         /my/listing/{id}/publication
    │
    ├── profile/
    │   ├── profile.tsx                         /my/profile
    │   ├── change-password.tsx                 /my/profile/change-password
    │   └── offer.tsx                           /my/profile/offer (брендинг public-offer)
    │
    ├── services/
    │   ├── services.tsx                        /my/services
    │   └── service.tsx                         /my/services/{id}
    │
    ├── subscription/subscription.tsx           /my/subscription
    ├── reports/reports.tsx                     /my/reports
    └── withdrawal/withdrawal.tsx               /my/withdrawal
```

**Рендеринг:** React Router 7 SSR. Сервер отдаёт HTML с pre-fetched данными (через loader'ы), клиент гидрирует.

## API-клиент

`app/api/` содержит:
- **axios-инстанс** с interceptor'ом, добавляющим Bearer-токен из localStorage.
- **Refresh-logic** при `401` (если refresh-token flow внедрён).
- **Типы** — генерируются из `swagger.json` (backend OpenAPI) скриптом `pnpm fetch-swagger` / `./fetch-swagger.sh`.
- **Хуки React Query** вокруг каждого endpoint — например `useListings()`, `useSubscription()`.

## State management

### TanStack React Query
Для **серверного state** (данные из API):
- Кеширование запросов (`listings`, `user`, `subscription`, `leads`).
- Refetch при фокусе окна, интервальные refresh.
- Optimistic updates для редактирования.

⚠️ **Known issue** (из QA-отчёта, CODE-003): `queryClient` экспортируется как модульный синглтон — потенциальная утечка данных между SSR-запросами разных пользователей. Рефакторинг — в planned.

### Jotai
Для **клиентского state** (UI-флаги, временные данные форм, модалки):
- Atomic state, минимум бойлерплейта.
- Лёгкие persisted atoms для настроек UI.

### Formik + Yup
Для форм создания/редактирования объекта. Многошаговые формы (12 разных `edit/*.tsx`).

## Chakra UI v3

Chakra переехал на v3 (2024) — **значительное изменение** по сравнению с v2:
- `@chakra-ui/react` 3.27 + `@emotion/react` для runtime CSS-in-JS.
- Компоненты через **recipes** (новая архитектура стилизации).
- Тема — в `app/theme/` — переопределение tokens, слотов, recipes.
- `chakra-cli` (dev-deps) — codegen для кастомной темы.

Если пришли с v2 — почитать миграционный guide Chakra.

## Маски и валидация

- **Телефон**: `use-mask-input` — маска `+7 (___) ___-__-__`.
- **Паспорт, ИНН**: кастомные маски с валидаторами через Yup (`InnRule` на backend + клиентская проверка).
- **Номер карты**: в CloudPayments виджете (не на нашей стороне, 3DS на CP).

## Карты

`@iminside/react-yandex-maps` — Yandex Maps для:
- Выбор адреса при создании объекта (интеграция с Dadata подсказками — см. [интеграцию Dadata](./05-integrations/dadata.md)).
- Отображение локации в public-offer.

## Drag-and-drop

`@dnd-kit/core` + `@dnd-kit/sortable`:
- **Переупорядочивание фото** в карточке объекта.
- **Сортировка объектов** (в планах, из CusDev запрос Подстоева).

## Сборка и деплой

### Vite
`vite.config.ts` — конфиг сборки. React Router 7 использует `@vitejs/plugin-rsc` (React Server Components, экспериментально).

Scripts:
- `dev` — dev-сервер.
- `build` — prod-сборка.
- `start` — prod-сервер через `react-router-serve`.
- `typecheck` — tsc.
- `typegen` — генерация типов React Router (маршрутов).
- `fetch-swagger` — обновление типов из backend OpenAPI.

### Docker + GitLab CI

`Dockerfile` + `.gitlab-ci.yml`:

```
stages: [deploy_dev, deploy_prod]

deploy_dev (on: develop):
  build_frontend_dev:
    - docker build (secrets из rspase/secrets/dev/.env.front через git clone в CI)
    - push в $CI_REGISTRY
  deploy_front_dev:
    - docker compose pull && up -d на rspace_dev runner

deploy_prod:
  - build_frontend_prod  # Triggered on premaster
  - deploy_front_prod    # runner rs_prod
  - clean_up_prod
```

**Prod-стадия работает** (сверено по `frontend/.gitlab-ci.yml@develop` на 2026-04-23). Триггер — push в `premaster` (не в `main`). Secrets тянутся из `rspase/secrets/prod.git` (deploy-token 62) → `.env.front`. Выполняется автоматически, без manual-подтверждения.

Если в более ранней версии этой доки было «prod CI не настроен» — это устарело: стадия появилась позже.

## Known issues (код-ревью)

Из QA-отчёта:

### CODE-001: Отсутствие null-safe fallback
**Файл:** `app/pages/my/Services/components/Subscription.tsx`
**Проблема:** `${subscriptionData?.subscription?.plan?.services?.length}` без `?? 0` → `undefined` в UI.
**Фикс:** добавить `?? 0` или обёртка безопасного отображения.

### CODE-002: Hydration mismatch
**Файл:** `app/root.tsx`
**Проблема:** условный рендер Yandex.Metrika через `!import.meta.env.DEV` + `dangerouslySetInnerHTML` вызывает SSR/CSR mismatch → React error #418.
**Фикс:** перенести Metrika в `useEffect` или использовать паттерн afterInteractive.
**Обход:** `suppressHydrationWarning` на `<html>` — маскирует, но не решает.

### CODE-003: QueryClient singleton
**Файл:** `app/root.tsx`
**Проблема:** `export const queryClient = new QueryClient()` — один инстанс шарится между SSR-запросами → потенциальная утечка данных.
**Фикс:** создавать `new QueryClient()` внутри компонента или через фабрику per-request.

## Тема и брендинг

`app/theme/` содержит Chakra theme override:
- **Цветовая палитра** — токены из дизайн-системы (lime `#cdf757`, magenta `#f331ab`, black `#181818`, surfaces).
- **Типографика** — шрифт NT Somic (подгружается через `next-themes` + custom loader).
- **Компоненты** — переопределения для Button, Badge, Card, Input.

Полная дизайн-база — [09-design-system.md](./09-design-system.md).

## Как локально стартовать

1. `git clone https://git.rs-app.ru/rspase/project/frontend.git`.
2. `git checkout develop` (не `main`!).
3. Скопировать env-переменные из `.env.example` (для прода тянутся через CI из `rspase/secrets/dev/.env.front`).
4. `npm install`.
5. `npm run fetch-swagger` — подтянуть типы из backend.
6. `npm run dev`.
7. Открыть `http://localhost:3000` (или порт из Vite config).

## Frontend-паттерны

### Loading state
- Глобальный `<Spinner>` через Chakra.
- Suspense-boundary для route-level lazy loading.

### Error boundary
- ErrorBoundary в `app/routes/*` через React Router 7 паттерн.
- Отображение дружелюбной страницы с кнопкой «Попробовать снова».

### Auth guard
- Layout `my.tsx` — проверяет токен в localStorage, redirect на `/login` если не авторизован.
- Публичные роуты (`/offer/{id}`, `/docs/*`) — без проверки.

### Формы
- Formik — основной wrapper, обычно с `Yup` schema.
- Поля валидируются на blur, errors показываются под input'ом.
- Submit → optimistic update через TanStack Query или await mutation.

## Integration points

| С чем | Через что |
|---|---|
| Backend API (все эндпоинты) | axios + TanStack Query |
| OpenAPI → TS types | `fetch-swagger.sh` + Swagger JSON |
| Dadata (suggestions) | backend proxy `/proxy/dadata/suggestions/{path}` |
| Yandex Metrika | скрипт в `root.tsx` (см. hydration issue) |
| PostHog | провайдер есть, **не обёрнут в Layout** — не активен. Серверных вызовов PostHog на бэкенде тоже нет (composer-зависимость установлена, кода нет). Трекинг только на лендинге через client-side JS |
| CloudPayments | redirect на виджет, не SDK (нет пакета CP в frontend) |

## Связанные разделы

- [00. Обзор](./00-overview.md)
- [01. Архитектура](./01-architecture.md)
- [09. Дизайн-система](./09-design-system.md)
- [08. Лендинг](./08-landing.md) — по стеку и деплою близок, но Next.js
- [13. Процессы разработки](./13-dev-process.md) (Волна 9) — MR-ы, CI, ветки.
- [14. Tech Debt](./14-tech-debt.md) (Волна 9) — список задолженностей.

## Ссылки GitLab

- [Репо frontend](https://git.rs-app.ru/rspase/project/frontend)
- [Ветка develop](https://git.rs-app.ru/rspase/project/frontend/-/tree/develop)
- [package.json](https://git.rs-app.ru/rspase/project/frontend/-/blob/develop/package.json)
- [app/routes/](https://git.rs-app.ru/rspase/project/frontend/-/tree/develop/app/routes)
- [.gitlab-ci.yml](https://git.rs-app.ru/rspase/project/frontend/-/blob/develop/.gitlab-ci.yml)
