<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates affiliate API routes to users with access_level === 6.
 * Must be placed after auth:sanctum.
 */
class RequireAffiliateAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || $user->role->access_level !== 6) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
