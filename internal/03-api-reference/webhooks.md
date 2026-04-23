# API: Webhooks (inbound)

Входящие webhook'и от внешних систем. Префикс: `/webhook`. **Без `auth`-middleware**, защита — через HMAC / токены в URL.

## Список

| URL | Источник | Middleware защиты |
|---|---|---|
| `POST /webhook/cloud-payments/check` | CloudPayments | HMAC (Content-HMAC header) |
| `POST /webhook/cloud-payments/pay` | CloudPayments | HMAC |
| `POST /webhook/cloud-payments/fail` | CloudPayments | HMAC |
| `POST /webhook/jivo/3752813899114971` | JivoSite | Токен в URL (жёстко прошит в route) |
| `POST /webhook/telegram/{token}` | Telegram | Токен в URL, свой на каждого юзера для bind |

---

## CloudPayments

Интеграция: [cloudpayments.md](../05-integrations/cloudpayments.md).

### `POST /webhook/cloud-payments/check`

Pre-check перед списанием. CP спрашивает: «можно провести этот платёж?».

**Headers:** `Content-HMAC: <sha256_of_body>` (ключ — `CP_WEBHOOK_SECRET` из `.env`).

**Body (form-data от CP):**
```
InvoiceId=123
AccountId=45
Amount=9000
Currency=RUB
Status=Completed | Authorized
```

**Ответы** (CP ждёт `{ "code": N }`):

| code | Значение | Действие CP |
|---|---|---|
| `0` | OK | Списать деньги |
| `10` | Invoice не найден | Отменить оплату, показать юзеру ошибку |
| `11` | AccountId не совпадает | Отменить |
| `12` | Сумма/валюта не совпадают | Отменить |
| `13` | Invoice уже оплачен или тип платежа неверный | Отменить |
| `20` | Invoice отменён / истёк | Отменить |

Controller: `CloudPaymentsWebhookController::check`.

### `POST /webhook/cloud-payments/pay`

Успешная оплата.

**Body (валидные поля):**
- `TransactionId` (int, required) — ID в CP.
- `InvoiceId` (int, required) — id `CPInvoicePayment`.
- `AccountId` (int, required) — user_id.
- `DateTime` (date, required).
- `Status` (`Completed` или `Authorized`).
- `Token` (опционально, но нужен для сохранения карты).
- `CardLastFour`, `CardExpDate` (MM/YY), `CardType` (`Mir`/`Visa`/...), `Issuer`.

**Что происходит:**
1. Валидация полей.
2. `DB::transaction`:
   - Если `Token` + `CardType` + `CardLastFour` + `CardExpDate` — сохраняется `PaymentMethod` через `PaymentMethodService`.
   - `CPInvoicePayment.status = paid`.
   - `Invoice.status = Paid`.
   - Выстреливает `InvoicePaid` event.

**Ответ:** `200 OK` с `{ "code": 0 }`.

Controller: `CloudPaymentsWebhookController::pay`.

### `POST /webhook/cloud-payments/fail`

Неудачная попытка оплаты.

**Body:** содержит `TransactionId`, `InvoiceId`, `Reason` / `ReasonCode`.

**Что происходит:**
- `CPInvoicePayment.status = failed`.
- `fail_code` заполняется из `ReasonCode` (маппинг на `CPInvoicePaymentFailCode`).
- Invoice остаётся в `Open` — юзер может попробовать ещё раз.
- Нотификация юзеру (Telegram/email, TBD).

**Ответ:** `200 OK`.

---

## JivoSite

Интеграция: [jivosite.md](../05-integrations/jivosite.md) (Волна 5).

### `POST /webhook/jivo/3752813899114971`

**Токен в URL — жёстко прошит** в `routes/api.php`:
```php
Route::post('/jivo/3752813899114971', [JivoWebhookController::class, 'handle']);
```

Это значит: URL — публичный, но неугадываемый без знания токена. Если токен утечёт — надо менять в коде (рефакторинг на env-переменную — tech debt).

**Body:** формат JivoSite webhook'а (см. их документацию).

**Что происходит:**
- Парсится сообщение.
- Извлекается телефон / имя клиента.
- Создаётся `Lead` через `LeadService::createFromExternal(source='jivo')`.
- Event `LeadCreated` → уведомления.

Controller: `App\Jivo\Http\Controllers\JivoWebhookController::handle`.

---

## Telegram

Интеграция: [telegram.md](../05-integrations/telegram.md) (Волна 5).

### `POST /webhook/telegram/{token}`

Webhook от Telegram Bot API. **Токен в URL — свой на каждого юзера** (генерируется в `POST /profile/telegram/generate-link`).

**Что происходит:**
- Если `{token}` совпадает с активным одноразовым токеном для привязки → находится юзер → сохраняется `UserTelegramInfo(chat_id, username)`.
- Если это обычное сообщение в бот → обрабатывается по контексту (команды, кнопки).

Controller: `App\Telegram\Http\Controllers\TelegramWebhookController::handle`.

---

## Общие принципы безопасности

- **Все webhook'и валидируют источник** (HMAC для CP, токены в URL для Jivo/Telegram).
- **Невалидные запросы** → `401 Unauthorized` или `400 Bad Request` без раскрытия причины.
- **Логирование**: каждый запрос в `logs()` с префиксом `[CLOUD_PAYMENTS]` / `[JIVO]` / `[TELEGRAM]`, уровень `info` для обычных, `alert`/`critical` для подозрительных.
- **Idempotency**: CP и Telegram могут слать дубликаты. Обработка — через `DB::transaction` + проверки статусов.
- **Retry на стороне клиента**: CP делает 3 попытки с задержкой, Telegram — более агрессивно. Важно возвращать `200 OK` при успехе, чтобы retry не шёл.

## Ссылки GitLab

- [CloudPaymentsWebhookController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Http/Controllers/Webhook/CloudPayments/CloudPaymentsWebhookController.php)
- [JivoWebhookController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Jivo/Http/Controllers/JivoWebhookController.php)
- [TelegramWebhookController.php](https://git.rs-app.ru/rspase/project/backend/-/blob/dev/app/Telegram/Http/Controllers/TelegramWebhookController.php)
