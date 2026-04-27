<?php

namespace App\Http\Controllers;

use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Public email newsletter subscribe endpoint (§19.7).
 *
 * POST /api/subscribe → upsert subscriber record.
 */
class SubscriberController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email|max:191',
            'name'  => 'nullable|string|max:191',
        ]);

        Subscriber::updateOrCreate(
            ['email' => $data['email']],
            [
                'name'             => $data['name'] ?? null,
                'is_active'        => true,
                'subscribed_at'    => now(),
                'unsubscribed_at'  => null,
            ]
        );

        return response()->json(['message' => 'You\'re subscribed! Thanks for signing up.']);
    }
}
