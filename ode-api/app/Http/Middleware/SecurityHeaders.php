<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds security-relevant HTTP response headers to every API response.
 *
 * These headers protect against common browser-based attacks even though
 * this is a JSON API (no HTML pages served). They still matter:
 *  - HSTS ensures the browser always uses HTTPS once seen once
 *  - X-Content-Type-Options prevents MIME sniffing of JSON as script
 *  - Referrer-Policy stops the API URL leaking in Referer headers
 *  - Permissions-Policy locks down sensitive browser APIs
 *
 * Note: Content-Security-Policy is intentionally omitted here — the React
 * SPA sets its own CSP via its own hosting (Vite/nginx/CloudFront).
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Don't send referrer to other origins
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Deny framing of any response (API shouldn't be embedded anywhere)
        $response->headers->set('X-Frame-Options', 'DENY');

        // Disable browser features that have no business in an API context
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=()'
        );

        // HTTP Strict Transport Security — only sent in production
        // Tells browsers to always use HTTPS for this domain for 1 year
        if (config('app.env') === 'production') {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Remove the default X-Powered-By header to avoid fingerprinting
        $response->headers->remove('X-Powered-By');

        return $response;
    }
}
