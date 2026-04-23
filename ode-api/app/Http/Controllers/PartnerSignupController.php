<?php

namespace App\Http\Controllers;

use App\Jobs\SendPartnerWelcomeEmail;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class PartnerSignupController extends Controller
{
    /**
     * POST /api/partner/register
     *
     * Public — no auth required.
     * Creates an agent (access_level 7) or planner/venue (access_level 8) account.
     * Auto-generates a unique referral_string for tracking.
     *
     * type param:
     *   'agent'   → access_level 7  (insurance agents / event industry partners)
     *   'planner' → access_level 8  (event planners / venue coordinators)
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'                  => ['required', Rule::in(['agent', 'planner'])],
            'first_name'            => ['required', 'string', 'max:55'],
            'last_name'             => ['required', 'string', 'max:55'],
            'email'                 => ['required', 'email', 'unique:users,email'],
            'phone'                 => ['required', 'string', 'min:7', 'max:20'],
            'company_name'          => ['nullable', 'string', 'max:100'],
            'website'               => ['nullable', 'url', 'max:255'],
            'license_number'        => ['nullable', 'string', 'max:100'], // agents only
            'venue_capacity'        => ['nullable', 'integer', 'min:1'],  // planners/venues
            'how_did_you_hear'      => ['nullable', 'string', 'max:255'],
            'password'              => ['required', 'confirmed', Password::min(8)],
            'agree_to_terms'        => ['accepted'],
        ]);

        // Resolve role — agent=7, planner=8
        $accessLevel = $data['type'] === 'agent' ? 7 : 8;
        $role        = UserRole::where('access_level', $accessLevel)->firstOrFail();

        // Unique referral string
        do {
            $referralString = strtoupper(Str::random(8));
        } while (User::where('referral_string', $referralString)->exists());

        $user = User::create([
            'role_id'         => $role->id,
            'first_name'      => $data['first_name'],
            'last_name'       => $data['last_name'],
            'email'           => $data['email'],
            'phone'           => $data['phone'],
            'password'        => $data['password'],
            'referral_string' => $referralString,
            'status'          => 1,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role');

        // Queue welcome email
        SendPartnerWelcomeEmail::dispatch($user, $data['type']);

        return response()->json([
            'user' => [
                'id'              => $user->id,
                'first_name'      => $user->first_name,
                'last_name'       => $user->last_name,
                'email'           => $user->email,
                'phone'           => $user->phone,
                'status'          => $user->status,
                'referral_string' => $user->referral_string,
                'w9_status'       => $user->w9_status,
                'is_agency'       => $user->is_agency,
                'role' => [
                    'id'           => $user->role->id,
                    'role_name'    => $user->role->role_name,
                    'access_level' => $user->role->access_level,
                ],
            ],
            'token' => $token,
        ], 201);
    }
}
