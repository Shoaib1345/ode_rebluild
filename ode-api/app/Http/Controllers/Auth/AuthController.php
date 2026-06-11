<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Register a new customer account.
     * New self-registered users always get the customer role (access_level 5).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $customerRole = UserRole::where('access_level', 5)->firstOrFail();

        $user = User::create([
            'role_id'    => $customerRole->id,
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'password'   => $request->password, // hashed by cast
            'phone'      => $request->phone,
            'status'     => 1,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->userPayload($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate a user and issue a Sanctum token.
     *
     * Direct Hash::check (rather than Auth::attempt) skips the web guard's
     * session creation — token-only auth doesn't need a server-side session,
     * and skipping it saves a DB round-trip on every login.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        $user->loadMissing('role');

        // Affiliates (access_level 6) sign up in a pending state and must be able
        // to log in to track their approval status. Every other inactive account
        // stays blocked.
        $isPendingAffiliate = $user->role
            && (int) $user->role->access_level === 6
            && (int) $user->status !== 1;

        if ((int) $user->status !== 1 && ! $isPendingAffiliate) {
            return response()->json([
                'message' => 'Your account is inactive. Please contact support.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    /**
     * Revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * Return the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private function userPayload(User $user): array
    {
        $user->loadMissing('role');

        return [
            'id'           => $user->id,
            'first_name'   => $user->first_name,
            'last_name'    => $user->last_name,
            'email'        => $user->email,
            'phone'        => $user->phone,
            'status'       => $user->status,
            'role'         => [
                'id'           => $user->role?->id,
                'name'         => $user->role?->role_name,
                'access_level' => $user->role?->access_level,
            ],
            'is_agency'    => $user->is_agency,
            'created_at'   => $user->created_at,
        ];
    }
}
