# Интеграция: Яндекс.Метрика

> **Тип:** аналитика (трекинг)
> **Направление:** outbound (pixel / JS-скрипт)
> **Статус:** production

**⚠️ Не путать с Яндекс.Диском.** В бэкенде есть `app/Api/Yandex/YandexDiskApiClient.php` — это клиент **Яндекс.Диска**, используется в `SyncLeadsCommand` для вычитывания лидов из файла на Диске (переменная `LEADS_YANDEX_DISK_URL` в `.env.example`). Никак не связан с Яндекс.Метрикой. Метрика работает только на клиенте (landing/lk), без backend-кода.

## Назначение

Аналитика посетителей лендинга `rspace.pro` и A/B-вариантов (a/b/c/d). Стандартный счётчик Яндекс.Метрики + цели (goals) для событий регистрации.

Собирает:
- Визиты, глубина просмотра.
- Отсюда → куда (referrer tracking).
- Воронка до регистрации.
- Vebvisor записи сессий (если включён).
- Конверсии по целям (регистрация, оплата подписки).

## Конфигурация

### Счётчики

| Окружение | Counter ID |
|---|---|
| **Production** | `104015550` |
| **Test/dev** | `104317883` |

⚠️ **Known issue:** в `.env.example` landing'а — **test counter**. На проде env должен перезаписывать на `104015550`. Надо проверить на prod-сервере, какой фактически используется.

### Env-переменные

```
YANDEX_METRIKA_ID=104015550     # prod
NEXT_PUBLIC_YANDEX_METRIKA_ID=  # если нужно на клиенте
```

## Код

### Landing (rspace.pro)

| Компонент | Путь |
|---|---|
| Хук | `src/hooks/use-yandex-metrika.ts` |
| Инициализатор | `src/components/yandex-metrika-initializer.tsx` |
| Tracked button | `src/components/ui/tracked-button.tsx` |
| Tracked link | `src/components/ui/tracked-link.tsx` |

**Tracked buttons/links** — кнопки и ссылки с автоматическим отслеживанием клика. Используются на всех CTA («Попробовать бесплатно», «Тарифы», «Связаться»).

### Frontend (lk.rspace.pro)

Инициализируется в `app/root.tsx` через условный `<script>`.

⚠️ **Known issue** (CODE-002): условный рендер Metrika через `!import.meta.env.DEV` + `dangerouslySetInnerHTML` вызывает Hydration Error #418. Фикс — перенести в `useEffect`.

## Цели (goals)

Настраиваются **в кабинете Metrika**, не в коде. Типичные:
- `signup_submit` — успешная регистрация.
- `subscription_paid` — оплата подписки.
- `cta_click` — клик на главный CTA.
- `pricing_view` — просмотр тарифов.

## PII

Metrika не получает:
- Пароли.
- Номера карт.
- Персональные данные клиентов объектов.

Передаются:
- UTM-метки (source, medium, campaign).
- URL-пути (но paths с id объектов — в планах маскировать).
- Device / browser / referrer.

## Known issues

- **Dev counter в .env.example** — надо перенастроить, чтобы не попадал в prod.
- **UTM-передача на backend** — не всегда работает (см. [14-tech-debt.md](../14-tech-debt.md)).
- **Vebvisor на кабинете** — TBD, включён ли.

## Связанные разделы

- [08. Лендинг](../08-landing.md) — место использования.
- [07. Frontend](../07-frontend.md) — Hydration issue.
- [posthog.md](./posthog.md) — вторая аналитика.

## Ссылки

- [use-yandex-metrika.ts](https://git.rs-app.ru/rspase/landing/next/-/blob/dev/src/hooks/use-yandex-metrika.ts)
- [tracked-button.tsx](https://git.rs-app.ru/rspase/landing/next/-/blob/dev/src/components/ui/tracked-button.tsx)
