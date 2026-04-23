<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates admin API routes to users whose role access_level <= 2
 * (super-admin = 0, admin = 1, staff = 2).
 *
 * Must be placed after auth:sanctum so $request->user() is populated.
 */
class RequireAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || $user->role->access_level > 2) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
