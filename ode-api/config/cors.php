<?php

/**
 * CORS configuration for One Day Event API.
 *
 * In production set CORS_ALLOWED_ORIGINS to the exact frontend domain(s).
 * Multiple origins: "https://onedayevent.com,https://www.onedayevent.com"
 *
 * Never use '*' in production — it allows any origin to read API responses.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Parsed from env so prod can lock it to a single domain without code change.
    // In local dev, the .env already sets CORS_ALLOWED_ORIGINS=http://localhost:5173
    'allowed_origins' => array_filter(
        array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')))
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'X-Timezone',      // custom header sent by frontend for user timezone
    ],

    // Expose these headers so the frontend JS can read them
    'exposed_headers' => [],

    // Cache preflight for 2 hours in production (reduce OPTIONS round-trips)
    'max_age' => env('APP_ENV') === 'production' ? 7200 : 0,

    // Must be true for Sanctum cookie-based auth (though we use tokens)
    'supports_credentials' => true,

];
