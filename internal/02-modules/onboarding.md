# Модуль: Onboarding (кратко)

> **Домен:** Onboarding (прогресс после регистрации)
> **Репозиторий:** `rspase/project/backend`
> **Путь:** `backend/app/Onboarding/`
> **Ветка prod:** `dev`
> **Статус:** production (базовый функционал)

## Назначение

Отслеживание прогресса пользователя по чек-листу «первые шаги»: добавил первый объект, подключил Авито, загрузил фото, настроил профиль и т.п. Frontend использует прогресс, чтобы показывать подсказки и скрывать чек-лист, когда всё пройдено.

На Волне 2 — краткое описание. Детали (конкретные шаги, триггеры, UI) — в Волне 6 вместе с External 02 «Начало работы».

## API-эндпоинты

Префикс: `/onboarding`. Middleware: `auth:user`. Controller: `app/Onboarding/Http/Controllers/OnboardingController.php`.

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/onboarding` | Статус чек-листа: какие шаги завершены, процент |

## Модели

В `app/Onboarding/Models/`:
- `OnboardingProgress` (`app/Onboarding/Models/OnboardingProgress.php`) — связка `user_id` → список пройденных шагов.
- `PublishedRealtyInfo` (`app/Onboarding/Models/PublishedRealtyInfo.php`) — snapshot первой опубликованной realty для шага «Опубликовать объект».

Отдельной модели `OnboardingStep` в коде нет — ключи шагов хранятся как константы в `OnboardingProgress` (или в enum внутри модели).

Обновление шагов — **событийное**: listener'ы в `app/Onboarding/Listeners/` ловят доменные события и отмечают шаги выполненными:

- `InitializeOnboardingProgress` — при создании юзера (через `UserRegistered`).
- `ProcessPublishingCreated` — при создании публикации (через `PublishingCreated` из Publishings).
- `ProcessRealtyPublished` — при успешной публикации (через `RealtyPublished`).
- `ProcessUserProfileUpdate` — при апдейте профиля (через `UserProfileUpdated` из Identity).
- `ProcessUserSubscribed` — при активации подписки (через `SubscriptionActivated` из Subscriptions).

## Open questions

- **Список шагов** — точный, актуальный, с ключами и условиями выполнения. Извлечь из seeder'а или OnboardingStep-enum.
- **Зависимости между шагами** — есть ли строгий порядок, или чек-лист свободный.
- **ТЗ v2** `ТЗ_Онбординг_на_сайте_v2.docx` — часть уже в проде, часть — нет. Сверить.

## Связанные разделы

- [identity.md](./identity.md) — регистрация (триггер старта онбординга).
- [External 02: Начало работы](../../external/02-start.md) — пользовательская сторона.

## Ссылки GitLab

- [Onboarding/](https://git.rs-app.ru/rspase/project/backend/-/tree/dev/app/Onboarding)
