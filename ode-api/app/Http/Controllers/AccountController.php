<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Self-service account management for the *currently authenticated* user.
 *
 * Distinct from Admin\UserController (which manages OTHER users): every endpoint
 * here operates strictly on $request->user(), so any role can manage their own
 * profile and password.
 */
class AccountController extends Controller
{
    /**
     * PATCH /api/account
     *
     * Update the signed-in user's own profile (name, email, phone).
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name'  => ['sometimes', 'string', 'max:100'],
            'email'      => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'      => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated.',
            'user'    => $this->payload($user->fresh('role')),
        ]);
    }

    /**
     * POST /api/account/password
     *
     * Change the signed-in user's password. Requires the current password.
     * On success, all OTHER active tokens are revoked (the current session stays
     * logged in) so a leaked/old session can't continue after a password change.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Your current password is incorrect.',
                'errors'  => ['current_password' => ['Your current password is incorrect.']],
            ], 422);
        }

        // 'password' has a 'hashed' cast — assign plaintext and the model hashes it.
        $user->update(['password' => $data['password']]);

        // Revoke every token except the one making this request. (A TransientToken
        // — e.g. session auth in tests — has no id, so revoke all in that case.)
        $current   = $request->user()->currentAccessToken();
        $currentId = $current instanceof \Laravel\Sanctum\PersonalAccessToken ? $current->id : null;
        $user->tokens()->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))->delete();

        return response()->json(['message' => 'Password updated successfully.']);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private function payload(User $user): array
    {
        return [
            'id'         => $user->id,
            'first_name' => $user->first_name,
            'last_name'  => $user->last_name,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'status'     => $user->status,
            'role'       => [
                'id'           => $user->role?->id,
                'name'         => $user->role?->role_name,
                'access_level' => $user->role?->access_level,
            ],
            'is_agency'  => $user->is_agency,
            'created_at' => $user->created_at,
        ];
    }
}
