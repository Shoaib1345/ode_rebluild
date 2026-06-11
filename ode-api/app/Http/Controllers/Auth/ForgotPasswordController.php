<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

/**
 * Password reset (forgot password) flow.
 *
 *   POST /api/auth/forgot-password — email a reset link.
 *   POST /api/auth/reset-password  — set a new password using the link's token.
 *
 * The reset link points at the SPA (FRONTEND_URL/reset-password?token=…&email=…),
 * and the email is a branded Mailable rather than the framework default (which
 * assumes a server-rendered `password.reset` route that doesn't exist here).
 */
class ForgotPasswordController extends Controller
{
    public function sendResetLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        // Respond identically whether or not the email exists (no enumeration).
        if ($user) {
            $token    = Password::broker()->createToken($user);
            $resetUrl = rtrim((string) config('app.frontend_url'), '/')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($user->email);

            try {
                Mail::to($user->email)->send(new ResetPasswordMail($user, $resetUrl));
            } catch (\Throwable $e) {
                Log::error('Password reset email failed', [
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'If an account exists for that email, a password reset link is on its way.',
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                // 'password' has a 'hashed' cast — assign plaintext, it gets hashed.
                $user->forceFill([
                    'password'       => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                // Invalidate every existing session/token after a reset.
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Your password has been reset. You can now sign in.',
            ]);
        }

        return response()->json([
            'message' => 'This password reset link is invalid or has expired.',
            'errors'  => ['email' => ['This password reset link is invalid or has expired.']],
        ], 422);
    }
}
