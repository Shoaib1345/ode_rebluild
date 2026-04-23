<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates customer portal routes to users with access_level === 5.
 * Must be placed after auth:sanctum.
 */
class RequireCustomerAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || $user->role->access_level !== 5) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
