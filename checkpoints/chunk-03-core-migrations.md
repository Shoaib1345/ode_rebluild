# Chunk 03 — Database Migrations: Core Tables ✅

**Status**: DONE  
**Date completed**: 2026-04-14

## What was built

### Migrations created & run (`php artisan migrate:fresh`)

| File | Tables created |
|------|----------------|
| `0001_01_01_000000_create_users_table.php` | `agencies`, `user_roles`, `users`, `password_reset_tokens`, `sessions` |
| `0001_01_01_000001_create_cache_table.php` | `cache`, `cache_locks` |
| `0001_01_01_000002_create_jobs_table.php` | `jobs`, `job_batches`, `failed_jobs` |
| Sanctum default | `personal_access_tokens` |
| `2026_04_14_110001_create_event_types_table.php` | `event_types` |
| `2026_04_14_110002_create_event_rates_table.php` | `event_rates` |
| `2026_04_14_110003_create_event_rate_states_table.php` | `event_rate_states` |
| `2026_04_14_110004_create_us_states_table.php` | `us_states` |

### Seeders created & run (`php artisan db:seed`)

| Seeder | Data |
|--------|------|
| `UserRolesSeeder` | 7 roles: Super Admin (0), Admin (1), Staff (2), Customer (5), Affiliate (6), Agent (7), Planner/Venue (8) |
| `UsStatesSeeder` | 51 rows: 50 US states + DC |

## Key design decisions

- **agencies + user_roles + users in one migration file** — FK constraints require agencies and user_roles to exist before users. Single file guarantees correct creation order.
- **Schema::defaultStringLength(191)** in `AppServiceProvider::boot()` — required for MySQL with utf8mb4 and MyISAM/InnoDB key length limits.
- **`event_rate_states` pivot table** — normalizes legacy `crm_event_rates.states` CSV column (e.g. "CA, NY, TX") into proper relational rows with `(event_rate_id, state_code)` unique constraint.
- **Add-on columns as `string(20)`** — `noha`, `w_o_s`, `p_a_n_c_b`, `e_a_i` store dollar amounts OR the literals `'N/A'` (not available) / `'M/Q'` (manual quote required), matching legacy behavior.
- **`access_level` on `user_roles`** — preserves legacy numeric role mapping for query compatibility.

## Verified working

```
php artisan migrate:fresh   # all tables created clean
php artisan db:seed         # UserRolesSeeder + UsStatesSeeder both DONE
```

Database: `ode_rebuild` on localhost:3306
