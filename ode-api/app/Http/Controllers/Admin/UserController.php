<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Admin user management (FULL-SPEC-V2.md §17.2).
 *
 * Admins can list, create, view, update, and soft-delete any user.
 * Role filtering covers staff (0–2), customer (5), affiliate (6), agent (7), planner (8).
 * Commission fields and payroll flags are editable here.
 */
class UserController extends Controller
{
    // ── Index ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/users
     *
     * Paginated user list. Supports:
     *   ?search=   — name or email
     *   ?role=     — staff | customer | affiliate | agent | planner | all
     *   ?status=   — 1 (active) | 0 (inactive)
     *   ?sort=     — column
     *   ?dir=      — asc | desc
     *   ?per_page= — default 25
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'role'     => ['nullable', 'string'],
            'status'   => ['nullable', 'in:0,1'],
            'sort'     => ['nullable', Rule::in(['id', 'first_name', 'last_name', 'email', 'created_at', 'status'])],
            'dir'      => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::with('role:id,role_name,access_level')
            ->withTrashed(false); // exclude soft-deleted

        // Role filter
        $roleFilter = $request->input('role');
        if ($roleFilter && $roleFilter !== 'all') {
            $levels = match ($roleFilter) {
                'staff'     => [0, 1, 2],
                'customer'  => [5],
                'affiliate' => [6],
                'agent'     => [7],
                'planner'   => [8],
                default     => null,
            };
            if ($levels !== null) {
                $query->whereHas('role', fn ($q) => $q->whereIn('access_level', $levels));
            }
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', (int) $request->input('status'));
        }

        // Search
        if ($search = $request->input('search')) {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('first_name', 'like', $like)
                  ->orWhere('last_name',  'like', $like)
                  ->orWhere('email',      'like', $like)
                  ->orWhere('phone',      'like', $like);
            });
        }

        $sort  = $request->input('sort', 'created_at');
        $dir   = $request->input('dir',  'desc');
        $query->orderBy($sort, $dir);

        $users = $query->paginate(
            (int) $request->input('per_page', 25),
            ['id', 'role_id', 'first_name', 'last_name', 'email', 'phone',
             'status', 'is_on_payroll', 'is_agency', 'commission_pct',
             'commission_flat', 'referral_string', 'created_at']
        );

        return response()->json($users);
    }

    // ── Show ───────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with(['role:id,role_name,access_level', 'w9Uploads' => function ($q) {
            $q->latest()->limit(1);
        }])->findOrFail($id);

        return response()->json($this->formatUser($user));
    }

    // ── Store ──────────────────────────────────────────────────────────────────

    /**
     * POST /api/admin/users
     *
     * Creates a staff/affiliate/agent/planner user.
     * A random temporary password is generated; in production this would be
     * emailed as a reset link (Chunk 39 — email automation).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role_id'         => ['required', 'integer', Rule::exists('user_roles', 'id')],
            'first_name'      => ['required', 'string', 'max:100'],
            'last_name'        => ['required', 'string', 'max:100'],
            'email'           => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone'           => ['nullable', 'string', 'max:20'],
            'commission_pct'  => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_flat' => ['nullable', 'numeric', 'min:0'],
            'is_on_payroll'   => ['nullable', 'boolean'],
            'is_agency'       => ['nullable', 'boolean'],
        ]);

        // Validate role is allowed (no creating super-admins via this endpoint)
        $role = UserRole::findOrFail($data['role_id']);
        if ($role->access_level === 0) {
            return response()->json(['message' => 'Cannot create super-admin users.'], 422);
        }

        $tempPassword = Str::random(12);

        // Auto-generate referral_string for affiliate/agent/planner
        $referralString = null;
        if (in_array($role->access_level, [6, 7, 8])) {
            do {
                $referralString = strtoupper(Str::random(8));
            } while (User::where('referral_string', $referralString)->exists());
        }

        $user = User::create([
            'role_id'          => $data['role_id'],
            'first_name'       => $data['first_name'],
            'last_name'        => $data['last_name'],
            'email'            => $data['email'],
            'phone'            => $data['phone'] ?? null,
            'password'         => Hash::make($tempPassword),
            'status'           => 1,
            'referral_string'  => $referralString,
            'commission_pct'   => $data['commission_pct'] ?? 0,
            'commission_flat'  => $data['commission_flat'] ?? 0,
            'is_on_payroll'    => $data['is_on_payroll'] ?? false,
            'is_agency'        => $data['is_agency'] ?? false,
            'email_verified_at'=> now(),
        ]);

        $user->load('role:id,role_name,access_level');

        // TODO (Chunk 39): send welcome email with password reset link

        return response()->json(array_merge(
            $this->formatUser($user),
            ['temp_password' => $tempPassword]   // returned once; client shows to admin
        ), 201);
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    /**
     * PATCH /api/admin/users/{id}
     *
     * Updates any editable user field.
     * Admin cannot change their own role (guard against lockout).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'role_id'         => ['sometimes', 'integer', Rule::exists('user_roles', 'id')],
            'first_name'      => ['sometimes', 'string', 'max:100'],
            'last_name'        => ['sometimes', 'string', 'max:100'],
            'email'           => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'           => ['sometimes', 'nullable', 'string', 'max:20'],
            'status'          => ['sometimes', 'boolean'],
            'commission_pct'  => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'commission_flat' => ['sometimes', 'numeric', 'min:0'],
            'is_on_payroll'   => ['sometimes', 'boolean'],
            'is_agency'       => ['sometimes', 'boolean'],
        ]);

        // Guard: prevent changing own role
        if (isset($data['role_id']) && $user->id === $request->user()->id) {
            unset($data['role_id']);
        }

        $user->update($data);
        $user->load('role:id,role_name,access_level');

        return response()->json($this->formatUser($user->fresh(['role'])));
    }

    // ── Destroy ────────────────────────────────────────────────────────────────

    /**
     * DELETE /api/admin/users/{id}
     *
     * Soft-deletes the user. Commissions and lead data remain intact.
     * Admin cannot delete themselves.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    // ── Roles list ─────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/users/roles
     *
     * Returns all roles for the create/edit form selects.
     */
    public function roles(): JsonResponse
    {
        $roles = UserRole::orderBy('access_level')->get(['id', 'role_name', 'access_level']);
        return response()->json($roles);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function formatUser(User $user): array
    {
        $latestW9 = $user->relationLoaded('w9Uploads')
            ? $user->w9Uploads->first()
            : null;

        return [
            'id'               => $user->id,
            'role_id'          => $user->role_id,
            'role'             => $user->role ? [
                'id'           => $user->role->id,
                'role_name'    => $user->role->role_name,
                'access_level' => $user->role->access_level,
            ] : null,
            'first_name'       => $user->first_name,
            'last_name'        => $user->last_name,
            'email'            => $user->email,
            'phone'            => $user->phone,
            'status'           => $user->status,
            'referral_string'  => $user->referral_string,
            'is_on_payroll'    => $user->is_on_payroll,
            'is_agency'        => $user->is_agency,
            'commission_pct'   => $user->commission_pct,
            'commission_flat'  => $user->commission_flat,
            'w9_verified'      => $latestW9?->verified_at !== null,
            'created_at'       => $user->created_at?->toIso8601String(),
        ];
    }
}
