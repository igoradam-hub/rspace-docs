# 09. Дизайн-система RSpace

> **Аудитория:** frontend-разработчики, дизайнеры, маркетинг (копирайт).
> **Бандл:** `/Users/igoradam/Projects/rspace/RSpace Design System (2)/` (локально)
> **Применяется:** landing (`rspace.pro`) + кабинет (`lk.rspace.pro`) + email
> **Последнее обновление:** 2026-04-23

RSpace использует единую дизайн-систему, которая закрывает визуальную часть продукта. Шрифт NT Somic, lime/magenta/black палитра, плоский flat-design, большие радиусы, signature-элементы (lime-highlight за словами, 4px magenta-рамка у «ПОПУЛЯРНО»).

## Бандл на диске

Полный пакет дизайн-системы — локально:
```
/Users/igoradam/Projects/rspace/RSpace Design System (2)/
├── README.md                    — гайдлайны + фаст-пасс
├── SKILL.md                     — Agent Skill manifest
├── brandbook.html               — 8-страничный print-ready брендбук
├── brandbook-print.html         — для печати
├── colors_and_type.css          — токены (цвета, шрифты, радиусы, spacing)
├── fonts/                       — NT Somic .woff2 (Regular/Medium/Bold)
├── assets/
│   ├── icons/                   — 40+ SVG-иконок
│   └── images/                  — hero/marketing webp
├── preview/                     — HTML-превью компонентов
├── slides/                      — шаблон презентаций (5 типов слайдов)
└── ui_kits/
    ├── landing/                 — UI-кит маркетинга
    ├── app/                     — UI-кит кабинета
    ├── onboarding/              — 6-шаговый onboarding flow
    └── emails/                  — 6 email-шаблонов
```

## Бренд

### Цветовая палитра

| Токен | HEX | Назначение |
|---|---|---|
| **brand (lime)** | `#cdf757` | Signature-цвет. Highlight-прямоугольники за словами, pricing pills, club-pricing wash, lime image plates |
| **brand2 (magenta)** | `#f331ab` | Accent. Recommended tariff (4px border + «ПОПУЛЯРНО» banner), mobile sticky CTA |
| **brand-ink (deep olive)** | `#4a6a14` | Текст на lime-backgrounds (доступный контраст) |
| **on-surface main (black)** | `#181818` | Основной текст, dark-секции full-bleed |
| **surface main** | `#f3f8fa` | Основной фон карточек (cool gray-blue) |
| **surface low** | `#f7f7f7` | Второстепенный фон |
| **club-wash (lime-light)** | `#f2fdd3` | Wash под клубными ценами внутри тарифных карточек |
| **deep-green** | `#2e5815` | Текст на club-wash |
| **outline-main** | `rgba(24,24,24,0.12)` | Разделители, обводки карточек |
| **outline-soft** | `rgba(24,24,24,0.06)` | Очень тонкие разделители |

**Запрещённые цвета:** warm tones (тёплые), любые кастомные hex прямо в CSS/JSX. Всё — через CSS custom properties.

### Типографика

**Шрифт:** NT Somic. Единственный на весь продукт.

**Веса:**
- 400 (Regular) — body, большинство текста.
- 500 (Medium) — заголовки, CTA, акценты.
- 600 (Bold) — display-заголовки, numerals.

**Type scale** (из preview/type-scale.html):

| Размер | px | Использование |
|---|---|---|
| xs | 12 | captions, labels |
| sm | 14 | small body, footer |
| base | 16 | body default |
| lg | 18 | lead text |
| xl | 20 | h6 / small headings |
| 2xl | 24 | h5 |
| 3xl | 28 | h4 |
| 4xl | 32 | h3 |
| 5xl | 40 | h2 |
| 6xl | 48 | h1 |
| 7xl | 56 | display small |
| 8xl | 68 | display large (hero) |

**Letter-spacing:**
- Display (h1-h3): `-0.02em` (tight).
- Body: `0` (default).
- Caps-track (eyebrow, badges): `0.06-0.08em` (wide).

### Радиусы (corner radius)

Мягкие и крупные, из preview/spacing-radii.html:

| Токен | px | Применение |
|---|---|---|
| xs | 4 | — |
| sm | 8 | small buttons, pills |
| md | 12 | **default buttons**, chips |
| lg | 16 | cards |
| xl | 20 | tariff cards |
| 2xl | 24 | larger cards |
| 3xl | 32 | hero plates, full-bleed image containers |
| full | 999 | pill, circle |

### Spacing scale

13-шаговая scale (4px-112px):
```
space-1 = 4px     space-8  = 48px
space-2 = 8px     space-9  = 64px
space-3 = 12px    space-10 = 72px
space-4 = 16px    space-11 = 80px
space-5 = 20px    space-12 = 96px
space-6 = 24px    space-13 = 112px
space-7 = 32px
```

**Section padding ladder** (responsive):
- Mobile: 36px
- md: 64px
- lg: 96px
- xl: 112px

### Shadows

**Интенциональный flat-дизайн.** Тени используются минимально:

| Токен | Значение | Применение |
|---|---|---|
| shadow-none | none | Всё по умолчанию |
| shadow-mobile-cta | `0 -2px 10px rgba(0,0,0,0.08)` | Mobile sticky CTA shelf (единственный систем. shadow) |

**Запрещено:**
- Elevation-тени на cards (используем colored fills для разделения).
- Inner shadows.
- Glow-эффекты (кроме очень специфичных admin-кейсов — и то tech debt).

Для разделения — **цветные заливки** (surface-main vs white) + тонкие outline-бордеры.

## Signature-элементы

### Highlight-прямоугольник
Лаймовый прямоугольник, абсолютно позиционированный **за** ключевым словом заголовка.

Компонент: `src/components/ui/highlighted-text.tsx` (landing).

Пример:
```
Платформа ДЛЯ РИЕЛТОРОВ, которая заменяет 5 сервисов
          [═══════════]  ← lime-плашка за словом
```

### «ПОПУЛЯРНО» banner
Recommended тариф (обычно Премиум) выделяется:
- **4px solid magenta** (`#f331ab`) border на всей карточке.
- Corner banner «ПОПУЛЯРНО» в верхнем левом углу (магентой, белый текст).
- Единственная карточка в сетке с бордером — остальные без.

### Lime image plate
Hero-картинки (риелтор за ноутбуком) сидят на **lime-заливке** (rounded 32px радиус), не вплывают в страницу напрямую.

### Club-pricing wash
В каждой тарифной карточке блок «клубные цены» — на светло-лаймовом фоне `#f2fdd3` с deep-green текстом. Визуально выделяется без границы.

## Компоненты

### Buttons

5 вариантов (`preview/components-buttons.html`):

| Variant | Background | Text | Использование |
|---|---|---|---|
| **primary (dark)** | `#181818` | `#fff` | Основные CTA (ALL CAPS) |
| **primary (lime)** | `#cdf757` | `#181818` | Hero CTA, email CTA |
| **magenta** | `#f331ab` | `#fff` | Recommended-карточка CTA, mobile sticky |
| **outline** | transparent + border | `#181818` | Secondary |
| **ghost** | transparent | `#181818` | Tertiary (ссылки, меню) |
| **small** | compact padding | | — варианты размеров |

**Типичные размеры:**
- Large: padding `18px 24px`, radius `12px`.
- Medium: padding `14px 20px`, radius `12px`.
- Small: padding `8px 16px`, radius `8px`.

**Transitions:** 200-300ms, ease-in-out. На hover:
- dark → text `#d5d5d5`.
- magenta → opacity 90% или `#d12a95`.
- outline → fill с `--accent`.

### Badges (pills)

Короткие caps-track теги: `NEW`, `НОВОЕ`, `ПОПУЛЯРНО`, `РЕКОМЕНДОВАН`, `ИЗМЕНЕНО`, `ТЕКУЩИЙ`, `УБРАНО`.

Цветные фоны:
- lime (`#cdf757`) — positive (NEW, ПОПУЛЯРНО).
- magenta (`#f331ab`) — highlight (РЕКОМЕНДОВАН).
- dark — neutral (ТЕКУЩИЙ).
- red / orange — destructive (УБРАНО).

### Cards

Flat surfaces:
- Fill: `--surface-main` (`#f3f8fa`).
- Radius: 16-20px (`--radius-lg` / `--radius-xl`).
- **Без** shadow, **без** border (кроме popular tariff).
- Внутреннее разделение через **horizontal rules** `1px solid --outline-main`.

### Forms

Inputs, selects, checkboxes:
- Fill: white или `--surface-main` depending on context.
- Border: 1px `--outline-main`, focus → `--brand` (lime) или `--brand-ink`.
- Radius: 8-12px.
- Maskito (landing) / use-mask-input (кабинет) — маски.

### Tariff cards

Детальный компонент (`preview/components-tariff.html`):
- Обычная: surface-main fill, radius 20px, no border.
- **Popular** (Премиум): 4px solid magenta border + «ПОПУЛЯРНО» banner.
- Заголовок: название тарифа + цена (`16 000 ₽/мес` mobile, `23 750 ₽` strikethrough + `18 900 ₽` actual).
- Список включённого + club-wash с клубными ценами внизу.

## Контент-правила

### Язык
- **Только русский.**
- Формальное **«Вы»** (не «ты»).
- Тон: **уверенный, коммерческий, утилитарный** («Создано риелторами для риелторов»).
- **Никакого marketing-buzz** («revolutionize», «disrupt», «game-changer»).

### CTA
- Primary — **ALL CAPS**: «ПОПРОБОВАТЬ 30 ДНЕЙ БЕСПЛАТНО», «НАЧАТЬ БЕСПЛАТНО», «СВЯЗАТЬСЯ», «ТАРИФЫ».
- Secondary и inline — sentence case.

### Labels / section titles
Sentence case с заглавной: «Стоимость подписки», «Как вы зарабатываете».

### Eyebrow / section flag
Caps-track: «КЛУБНЫЕ ЦЕНЫ НА УСЛУГИ · НОВОЕ», «БЕЗЛИМИТНО В ПОДПИСКЕ».

### Numbers & money
- Ruble: `₽` через **NBSP** (non-breaking space): `15 000 ₽`, не `15 000₽`.
- **Discounts:** `−20%`, `−30%` (U+2212, не ASCII hyphen `-`).
- **Thousand separator:** NBSP: `15 000`, не `15,000`.
- **Strikethrough** для old-price: ~~15 000 ₽~~ **12 000 ₽**.
- **Infinity** `∞` для unlimited: «∞ Заявки на ипотеку».

### Bullets & middots
- **Middot** (`·`) как inline-разделитель в списках: «Кабинет РОПа · AI-юрист 24/7 · Менеджер».
- В running copy — не использовать `*`, `•`, `–` как разделители.

### Emoji
- **Не используем** в продуктовом UI.
- Одно исключение: `🔒` на gated-фичах в дашборде (AI-юрист заблокирован на Профи).
- В иконографии — всегда SVG.

## Иконки

### Система
- **Hand-drawn SVG pack** — не Lucide, не FontAwesome. Каждая иконка — индивидуально нарисована.
- Stroke weight: ~2-2.5px визуально.
- Фиксированные fill (не outlined-only).
- Хранятся в `assets/icons/` и `landing/public/icons/`.

### Категории (40+ иконок)

| Группа | Примеры |
|---|---|
| Product glyphs | `download`, `account-balance`, `gavel`, `clock`, `grid`, `check-banner`, `checkmark`, `absent` |
| Navigational | `arrow-left/right/up`, `arrow-up-bold`, `collapse-icon`, `menu` |
| Instrument grid (12 фичей) | `instrument-1` … `instrument-12` |
| Income step illustrations | `income-step-{1,2,4,6,7}` |
| Brand/partner logos | `logo-rspace`, `logo-avito`, `logo-domclick`, `logo-dom-rf`, `logo-alpha-bank`, `logo-renessans-bank`, `logo-real-estate` |

### Frontend-app icons

В кабинете `lk.rspace.pro` — **параллельный pack** в `frontend/app/assets/icons/` как React-компоненты (`.tsx`): `DashboardClockIcon`, `DashboardHouseIcon`, `LinkMapPinIcon`, `EyeIcon`, и т.д.

**Правило:** для общих глифов использовать landing SVG, для dashboard-специфики — React-компоненты из frontend.

### Отсутствующие иконки

При импорте DS некоторые социальные иконки (`tg.svg`, `wup.svg`, `vk.svg`, `menu.svg`) не попали в public-pack — **flag, если надо сделать кит ревизию**.

## Email-шаблоны

`ui_kits/emails/index.html` — **6 готовых шаблонов** с inline-стилями (готовы для рассылок):

1. **Welcome** — приветствие после регистрации.
2. **OTP** — код подтверждения.
3. **New Lead** — новая заявка с портала.
4. **Weekly Report** — еженедельная сводка (шаблон готов, рассылка не запущена).
5. **Tariff Expiring** — триал заканчивается.
6. **Club Deal** — эксклюзивное клубное предложение.

Все — на NT Somic, с lime-акцентами в hero-блоке, magenta-highlight в critical-block'ах.

## Имплементация в коде

### Landing (`globals.css`)

Все токены дизайн-системы — в `src/app/globals.css` через Tailwind v4 `@theme inline`:

```css
@theme inline {
  --color-brand: #cdf757;
  --color-brand2: #f331ab;
  --color-on-surface-main: #181818;
  --color-surface-main: #f3f8fa;
  --color-outline-main: rgba(24, 24, 24, 0.12);
  --radius-xl: 1.6rem;
  --radius-2xl: 2rem;
  --radius-3xl: 3.2rem;
  --font-nt-somic: 'NT Somic', system-ui, sans-serif;
  --breakpoint-sm: 400px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1280px;
  --breakpoint-xl: 1600px;
  --breakpoint-2xl: 1920px;
  /* ... и т.д. */
}
```

### Frontend (кабинет)

`app/theme/` — Chakra UI v3 theme:
- Color tokens мапятся с DS.
- Semantic tokens (surface/on-surface/brand/outline).
- Custom recipes для Button, Badge, Card.

## Соответствие реальной реализации

### Актуально ✅
- Палитра (lime/magenta/black/surfaces) — работает.
- NT Somic как единственный шрифт — работает.
- Tailwind v4 @theme — в landing применено.
- Flat-design (нет shadow'ов на cards) — подтверждается кодом.

### Нужен аудит ⚠️
- **Гитлаб issues** (11 штук с августа 2025) — часть про ESLint, code style, возможно про DS-consistency. Закрыть или переоценить.
- Некоторые компоненты могут использовать inline-hex вместо токенов. Аудит-скрипт grep'ит по палитре — 4 off-palette hex было замечено в одном audit.
- Hand-drawn иконки частично замещены Lucide в отдельных местах (tech debt).

## Редакторы / тулинг

- **Figma** — хостится по ссылке в `landing/README.md`: https://www.figma.com/design/hEDDjsUA6LDpf3lrTG5ql2/RSpace-сервис (доступ по запросу).
- **brandbook.html** — open в браузере, Cmd+P → Save as PDF для print-версии.
- **preview/*.html** — изолированные визуальные референсы каждого компонента.

## Связанные разделы

- [07. Frontend](./07-frontend.md) — как используется в кабинете.
- [08. Лендинг](./08-landing.md) — источник истины globals.css.
- [../external/00-about.md](../external/00-about.md) и другие external — используют voice DS.
- [_sources/02a-cusdev-digest.md](../_sources/02a-cusdev-digest.md) — voice из интервью.

## Ссылки

- Бандл: `/Users/igoradam/Projects/rspace/RSpace Design System (2)/`
- Figma: `https://www.figma.com/design/hEDDjsUA6LDpf3lrTG5ql2/RSpace-сервис`
- [globals.css в GitLab](https://git.rs-app.ru/rspase/landing/next/-/blob/dev/src/app/globals.css)
