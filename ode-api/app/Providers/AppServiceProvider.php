<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Fix for MySQL < 5.7.7 / MariaDB < 10.2.2 utf8mb4 key length limit
        Schema::defaultStringLength(191);

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        // ── Auth endpoints ─────────────────────────────────────────────────
        // 10 attempts per minute per IP — prevents brute-force on login/register
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // ── Payment endpoints ──────────────────────────────────────────────
        // 5 payment attempts per minute per IP — hard cap to limit card testing
        RateLimiter::for('payment', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // ── Signup endpoints ───────────────────────────────────────────────
        // 10 signups per hour per IP — prevents mass account creation
        RateLimiter::for('signup', function (Request $request) {
            return Limit::perHour(10)->by($request->ip());
        });

        // ── General API ────────────────────────────────────────────────────
        // 120 requests per minute per user (authenticated) or IP (guest)
        RateLimiter::for('api', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(120)->by('user:' . $request->user()->id)
                : Limit::perMinute(60)->by($request->ip());
        });

        // ── Quote engine ───────────────────────────────────────────────────
        // 30 quote requests per minute per IP — prevents quote scraping
        RateLimiter::for('quote', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });
    }
}
