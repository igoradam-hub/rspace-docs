# API: Onboarding

Статус прогресса юзера по чек-листу первых шагов. Префикс: `/onboarding`. Middleware: `auth:user`.

Модуль: [Onboarding](../02-modules/onboarding.md).

## `GET /onboarding`

Текущий статус чек-листа.

**Ответ:**
```json
{
  "data": {
    "completed_percent": 60,
    "steps": [
      { "key": "profile_filled", "completed": true, "completed_at": "2026-04-22T11:00:00Z" },
      { "key": "telegram_bound", "completed": true },
      { "key": "first_realty_created", "completed": true },
      { "key": "first_realty_published", "completed": false },
      { "key": "subscription_purchased", "completed": false },
      ...
    ]
  }
}
```

Controller: `app/Onboarding/Http/Controllers/OnboardingController.php`.

Обновление шагов — **событийное** (listener ловит `RealtyPublished`, `UserProfileUpdated`, `TelegramChatBound`, `SubscriptionActivated` и обновляет соответствующие шаги).

Полный список шагов — в ТЗ `ТЗ_Онбординг_на_сайте_v2.docx`. На текущий момент реализация **частичная** — сверить с кодом.

## Связанные

- [Модуль Onboarding](../02-modules/onboarding.md)
- [External 02: Начало работы](../../external/02-start.md) — пользовательская сторона
