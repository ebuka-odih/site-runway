# RunwayAlgo Backend (Laravel API)

API-first Laravel backend for the RunwayAlgo web flow (Home, Trade, Copy, Wallet, Profile), with UUID primary keys across user/domain models and seeded demo data.

## Stack

- Laravel 12
- Sanctum token auth
- SQLite (default)
- UUID-based Eloquent models/tables

## Quick Start

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

API base URL (local):

```text
http://127.0.0.1:8000/api/v1
```

## Demo Account

```text
email: tommygreymassey@yahoo.com
password: password
```

Login:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tommygreymassey@yahoo.com","password":"password","device_name":"web"}'
```

Use the returned bearer token for authenticated routes.

## API Surface

- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/resend-otp`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /dashboard`
- `GET /market/assets`
- `GET /market/assets/{asset}`
- `GET /orders`
- `POST /orders`
- `GET /wallet`
- `GET /wallet/transactions`
- `POST /wallet/deposits`
- `POST /wallet/deposits/{depositRequest}/proof`
- `GET /copy-trading/discover`
- `GET /copy-trading/following`
- `GET /copy-trading/history`
- `POST /copy-trading/follow`
- `PATCH /copy-trading/following/{copyRelationship}`
- `DELETE /copy-trading/following/{copyRelationship}`
- `GET /profile`
- `PATCH /profile`

## Data Model (UUID)

Core tables:

- `users`
- `assets`
- `positions`
- `portfolio_snapshots`
- `watchlist_items`
- `wallets`
- `wallet_transactions`
- `deposit_requests`
- `orders`
- `traders`
- `copy_relationships`
- `copy_trades`

All domain ids are UUIDs. Sanctum tokenable morph columns are UUID-aware as well.

## Quality Checks

```bash
./vendor/bin/pint
php artisan test
```
