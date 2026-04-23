# План скриншотов для документации

**Дата:** 2026-04-23
**Назначение:** визуальные вложения в Notion-документацию (external и internal).

## Соглашения по именам

Формат: `<surface>-<screen>-<state>.png` (kebab-case).

- `landing-` — с `rspace.pro`
- `lk-` — с `lk.rspace.pro`
- `admin-` — с `admin.rspace.pro`

Сохранять в соответствующие подпапки: `assets/screenshots/{landing,lk,admin}/`.

Оптимизация: PNG ≤ 500 KB через `pngquant --quality=70-85 <files>` (или cmd+shift+4 на Mac сохраняет как PNG, сжимать отдельно).

## Что снимать

### Лендинг `rspace.pro` (9 скринов)

| Файл | URL / состояние | Что в фокусе |
|---|---|---|
| `landing/landing-hero-desktop.png` | `rspace.pro` (top) | Hero-блок c H1 «Зарабатывайте больше с каждой сделки», primary-CTA «Попробовать 30 дней», иконки площадок |
| `landing/landing-about-section.png` | скролл до «О сервисе» | «RSpace — платформа, созданная риелторами» + числовая полоска 12/3/8/24·7 |
| `landing/landing-earning-cards.png` | «Как вы зарабатываете» | 4 сравнительных карточки «БЕЗ RSPACE ↔ С RSPACE» (публикация, ипотека, страховка, пассивный доход) |
| `landing/landing-features-grid.png` | сетка фич | Юрист / Проверка собственника / AI-юрист / Подготовка договора |
| `landing/landing-pricing-moscow.png` | блок «Стоимость подписки», таб МОСКВА | 3 тарифные карточки, CTA «НАЧАТЬ БЕСПЛАТНО» |
| `landing/landing-pricing-regions.png` | тот же блок, таб ДРУГОЙ РЕГИОН | 3 тарифные карточки для регионов |
| `landing/landing-rspace-pro.png` | «RSpace PRO» блок | Коммьюнити для профессионалов + CTA «ПОЛУЧИТЬ ДОСТУП» |
| `landing/landing-testimonials.png` | «Истории риелторов» | Карусель видео-отзывов |
| `landing/landing-faq.png` | FAQ блок | Раскрытый первый вопрос |
| `landing/landing-footer.png` | футер | 3 legal-ссылки, copyright |

### ЛК `lk.rspace.pro` — публичная часть (4 скрина)

| Файл | URL | Что в фокусе |
|---|---|---|
| `lk/lk-login.png` | `lk.rspace.pro/` | Форма логина: телефон + пароль, чекбокс «Запомнить меня», ссылка «Забыл пароль» |
| `lk/lk-registration.png` | `lk.rspace.pro/registration` | Форма регистрации на 4 поля + блок требований пароля |
| `lk/lk-password-requirements.png` | та же страница, скролл вниз | Зелёный блок со всеми 5 требованиями к паролю + чекбокс согласия |
| `lk/lk-reset.png` | `lk.rspace.pro/reset` | Восстановление пароля |

### ЛК `lk.rspace.pro` — авторизованная часть (8 скринов)

| Файл | URL | Что в фокусе |
|---|---|---|
| `lk/lk-dashboard.png` | `/my` (полный экран) | Кошелёк, Активный промокод, «Создать объект», Ваш уровень, нижний таб-бар |
| `lk/lk-dashboard-wallet.png` | `/my` (зум на блок Кошелёк) | «Баланс 99 516 баллов / Доступно к выводу 89 000 ₽» |
| `lk/lk-objects-list.png` | `/my/listing` | Список объектов: карточка с бейджем «ГОТОВ К РЕКЛАМЕ» |
| `lk/lk-object-edit.png` | `/my/listing/977/edit` | Accordion из 6 секций, CTA «ОПУБЛИКОВАТЬ ОБЪЯВЛЕНИЕ» |
| `lk/lk-services-shelf.png` | `/my/services` | Витрина услуг + **baг «undefined»** |
| `lk/lk-services-bug-undefined.png` | `/my/services` (зум на уровень подписки) | BUG-001 «undefined ключевых услуг из 10 возможных» |
| `lk/lk-subscription.png` | `/my/subscription` | Текущая подписка + «Способ оплаты: Внутренний баланс» |
| `lk/lk-withdrawal.png` | `/my/withdrawal` | Вывод средств, история операций, FAQ |
| `lk/lk-profile.png` | `/my/profile` | Профиль + реф.ссылка + промокод + меню настроек |

### Админка `admin.rspace.pro` (12 скринов)

| Файл | URL | Что в фокусе |
|---|---|---|
| `admin/admin-users-list.png` | `/console/users` | Список юзеров, все колонки |
| `admin/admin-user-card.png` | `/console/users/1` | Карточка юзера «Фамилия Никита» (вкладка Пользователь) |
| `admin/admin-user-subscription.png` | тот же URL, секция Подписка | «План: Профи (Базовый)», «Способ оплаты: Внутренний баланс» |
| `admin/admin-plans-list.png` | `/console/plans` таб Тарифы | 13 тарифов в БД |
| `admin/admin-plan-levels.png` | `/console/plans` таб Настройки уровней | 4 карточки (Профи/Премиум/Ультима/Демо) с Наценкой/Скидкой |
| `admin/admin-services-catalog.png` | `/console/services` | Каталог из 29 услуг |
| `admin/admin-scorings.png` | `/console/scorings` | 3 скоринга |
| `admin/admin-service-orders.png` | `/console/service-orders` | 111 заявок, колонка «Ответственный: Нет» |
| `admin/admin-leads-developers.png` | `/console/leads` | Лиды от застройщиков (источник = домен) |
| `admin/admin-promo-codes.png` | `/console/promo-codes` | Все 5 промокодов, SUPERSTAR выделить |
| `admin/admin-ai-prompts.png` | `/console/prompts` | Активный промпт с моделью `o4-mini-2025-04-16` |
| `admin/admin-administrators.png` | `/console/administrators` | Один супер-админ Орлова И. М. |
| `admin/admin-balance-transactions.png` | `/console/balance-transactions` | 3 вкладки + 204 транзакции |
| `admin/admin-withdrawal-orders.png` | `/console/withdrawal-orders` | 16 заявок, крупная на 163 745 ₽ |
| `admin/admin-calls.png` | `/console/publishing-calls` | 7 312 записей звонков |

## GIF-записи ключевых flow (3-4 штуки)

| Файл | Что записать |
|---|---|
| `videos/flow-landing-pricing-toggle.gif` | Лендинг: переключение МОСКВА ↔ ДРУГОЙ РЕГИОН в тарифах — показывает, что **цены услуг не меняются** (баг) |
| `videos/flow-lk-login-to-dashboard.gif` | Логин → ввод данных → попадание на dashboard |
| `videos/flow-lk-object-edit-accordion.gif` | Раскрытие accordion-секций в редакторе объекта |
| `videos/flow-admin-plans.gif` | Админка → переход из «Тарифы» во вкладку «Настройки уровней» + назад в юзера |

## Где использовать в markdown

### External

- `external/00-about.md` — `landing-hero-desktop` в самом начале.
- `external/01-tariffs.md` — `landing-pricing-moscow` и `landing-pricing-regions` в блоке «Абонентская плата»; `admin-plan-levels` (правилами администратора) не нужно, только для internal.
- `external/02-start.md` — `lk-registration`, `lk-password-requirements`, `lk-dashboard`, `lk-login`.
- `external/03-listings.md` — `lk-objects-list`, `lk-object-edit`.
- `external/04-publishing.md` — (публикация через edit-форму, GIF flow если успеем).
- `external/05-leads.md` — скриншот лидов из ЛК (раз уж есть), `admin-leads-developers` для внутренней версии.
- `external/09-balance.md` — `lk-dashboard-wallet`, `lk-withdrawal`.
- `external/12-settings.md` — `lk-profile`.
- `external/15-known-issues.md` — `lk-services-bug-undefined` как демонстрация BUG-001.
- `external/17-contacts.md` — `landing-footer` как источник контактов.

### Internal

- `internal/06-admin.md` — все `admin-*.png`, разбросанные по разделам (Пользователи, Тарифы, Услуги, Скоринги, Промокоды, AI-генерация, Администраторы, История платежей, Заявки на вывод).
- `internal/02-modules/realty-prompts.md` — `admin-ai-prompts.png`.
- `internal/02-modules/billing.md` — `admin-balance-transactions.png`, `admin-withdrawal-orders.png`.
- `internal/02-modules/leads.md` — `admin-leads-developers.png`.
- `internal/14-tech-debt.md` — `lk-services-bug-undefined.png` как доказательство TD-V11/V12.

## Статус

**2026-04-23:**

- ✅ **Лендинг (10/10):** сняты автоматически через `_scripts/landing-screens.mjs` (playwright в песочнице, публичный сайт). Сжаты через `_scripts/compress-screens.py` до 118-662KB. Лежат в `assets/screenshots/landing/`.
- ⚠️ **ЛК авторизованная часть (0/8):** html2canvas не справился с React Router 7 SPA, Chrome блокирует множественные автодаунлоуды после первого. Снимаются через `_scripts/screens-auth.mjs` — при первом запуске один раз руками логинишься в ЛК и админку, дальше скрипт докручивает всё сам. См. `_scripts/README.md`.
- ⚠️ **Админка (0/14):** тот же скрипт `screens-auth.mjs` покрывает и админку одним проходом.
- ⚠️ **GIF (0/4):** пока снимать руками через QuickTime / Kap. Автоматический видеорекорд через chrome extension требует tab group, которая не конфигурируется из нашей сессии.

**Что внедрено в markdown:**

- `external/00-about.md` — `landing-hero-desktop`
- `external/01-tariffs.md` — `landing-pricing-moscow`, `landing-pricing-regions`
- `external/17-contacts.md` — `landing-footer`

**Когда появятся LK/admin PNG'ы** (после первого запуска `node _scripts/screens-auth.mjs`) — добавить `![...](../assets/screenshots/{lk,admin}/...)` в файлы, перечисленные выше в разделе «Где использовать в markdown».

## Как обновлять скриншоты

```bash
cd rspace-docs

# 1. Лендинг (полностью автоматически, можно повторять когда угодно)
node _scripts/landing-screens.mjs

# 2. ЛК + Админка (первый раз — с логином, потом автоматически)
node _scripts/screens-auth.mjs

# 3. Сжать всё
python3 _scripts/compress-screens.py
```

Детали — в `_scripts/README.md`.
