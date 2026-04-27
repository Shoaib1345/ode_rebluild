<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates planner portal routes to users with access_level === 8.
 * Must be placed after auth:sanctum.
 */
class RequirePlannerAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || $user->role->access_level !== 8) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
