<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        // Override built-in serve to default --no-reload on Windows
        \App\Console\Commands\ServeCommand::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        // Never redirect to a login page — always return null so the
        // AuthenticationException propagates to the JSON exception renderer.
        $middleware->redirectGuestsTo(fn () => null);

        // Alias for admin route groups
        $middleware->alias([
            'admin'     => \App\Http\Middleware\RequireAdminAccess::class,
            'affiliate' => \App\Http\Middleware\RequireAffiliateAccess::class,
            'customer'  => \App\Http\Middleware\RequireCustomerAccess::class,
            'agent'     => \App\Http\Middleware\RequireAgentAccess::class,
            'planner'   => \App\Http\Middleware\RequirePlannerAccess::class,
        ]);

        // Allow CORS for the React frontend
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Apply security headers + CORS to every API response
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON for API routes (handles validation, 404, etc.)
        $exceptions->shouldRenderJsonWhen(function ($request) {
            return $request->is('api/*');
        });

        // Return 401 JSON instead of redirecting to a named 'login' route
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
