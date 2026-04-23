# Chunk 01 — Laravel Setup
Status: DONE

## Checklist
- [x] Laravel 12 installed (at C:\wamp64\www\ode-rebuild\ode-api)
- [x] .env configured (APP_NAME=OneDayEvent, DB=mysql, DB_DATABASE=ode_rebuild)
- [x] Sanctum installed + config published (config/sanctum.php)
- [x] Stateful domains: localhost, localhost:5173, localhost:3000
- [x] S3 config already in filesystems.php (aws-s3 driver ready, keys blank)
- [x] Legacy DB connection added to config/database.php (connection name: 'legacy')
- [x] API routes file created: routes/api.php
- [x] bootstrap/app.php: API routing + Sanctum SPA middleware + JSON error responses
- [x] APP_KEY generated
- [x] `GET /api/health` returns {"status":"ok","app":"OneDayEvent","env":"local"}

## Packages Installed
- laravel/sanctum
- league/flysystem-aws-s3-v3
- barryvdh/laravel-dompdf
- maatwebsite/excel

## Project Locations
- Backend:     C:\wamp64\www\ode-rebuild\ode-api
- Checkpoints: C:\wamp64\www\ode-rebuild\checkpoints
- Frontend:    C:\wamp64\www\ode-rebuild\ode-frontend  ← (created in Chunk 2)

## DB Setup Needed
MySQL must be running (WAMP) before migrations.
Create database manually:
  CREATE DATABASE ode_rebuild CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

## Notes
- Laravel 12 was installed (roadmap said 11, 12 is fine — same patterns)
- MySQL was not running during setup; DB config is ready for when WAMP starts
- Server runs on: php artisan serve --port=8000
