<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AffiliateController extends Controller
{
    /**
     * POST /api/affiliate/register
     *
     * Public — no auth required.
     * Creates a new affiliate account (access_level 6) in a PENDING state
     * (status = 0). An admin must approve it before the affiliate can log in.
     * Auto-generates a unique referral_string.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name'            => ['required', 'string', 'max:55'],
            'last_name'             => ['required', 'string', 'max:55'],
            'email'                 => ['required', 'email', 'unique:users,email'],
            'phone'                 => ['required', 'string', 'min:7', 'max:20'],
            'password'              => ['required', 'confirmed', Password::min(8)],
            'company_name'          => ['nullable', 'string', 'max:100'],
            'website'               => ['nullable', 'url', 'max:255'],
            'how_did_you_hear'      => ['nullable', 'string', 'max:255'],
            'agree_to_terms'        => ['accepted'],
        ]);

        $affiliateRole = UserRole::where('access_level', 6)->firstOrFail();

        // Generate a unique 8-char alphanumeric referral string
        do {
            $referralString = strtoupper(Str::random(8));
        } while (User::where('referral_string', $referralString)->exists());

        $user = User::create([
            'role_id'          => $affiliateRole->id,
            'first_name'       => $data['first_name'],
            'last_name'        => $data['last_name'],
            'email'            => $data['email'],
            'phone'            => $data['phone'],
            'password'         => $data['password'], // hashed by cast
            'referral_string'  => $referralString,
            'status'           => 0,   // pending admin approval
            'w9_status'        => false,
        ]);

        $user->load('role');

        // No token is issued until an admin approves the application. The welcome
        // email is sent on approval (see Admin\UserController::approve).
        return response()->json([
            'message' => 'Thanks for applying! Your affiliate account is pending approval — we\'ll email you once it\'s active.',
            'user'    => [
                'id'               => $user->id,
                'first_name'       => $user->first_name,
                'last_name'        => $user->last_name,
                'email'            => $user->email,
                'phone'            => $user->phone,
                'status'           => $user->status,
                'referral_string'  => $user->referral_string,
                'role'             => [
                    'id'           => $user->role->id,
                    'role_name'    => $user->role->role_name,
                    'access_level' => $user->role->access_level,
                ],
            ],
        ], 201);
    }
}
