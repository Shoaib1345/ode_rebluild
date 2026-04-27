<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin Lead Assignments (§13.3 section 9 / Chunk 45).
 *
 * A lead can be assigned to multiple staff/agent/planner users simultaneously.
 * The pivot table is `lead_assignment` (lead_id, user_id, timestamps).
 * Unique constraint prevents duplicate assignments.
 *
 * GET    /admin/leads/{id}/assignments         → list current assignees
 * POST   /admin/leads/{id}/assignments         → assign a user
 * DELETE /admin/leads/{id}/assignments/{userId} → unassign a user
 */
class LeadAssignmentController extends Controller
{
    // ── Assignable role levels ─────────────────────────────────────────────────
    // Staff (2), Agent (7), Planner (8) can be assigned. Admins (0, 1) are excluded
    // because they already have full CRM access and aren't tracked via assignment.
    private const ASSIGNABLE_LEVELS = [2, 7, 8];

    // ── List current assignments ──────────────────────────────────────────────

    public function index(int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        $assignees = $lead->assignedUsers()
            ->with('role:id,role_name,access_level')
            ->get(['users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.role_id']);

        return response()->json([
            'assignees' => $assignees->map(fn ($u) => [
                'id'         => $u->id,
                'first_name' => $u->first_name,
                'last_name'  => $u->last_name,
                'email'      => $u->email,
                'role_name'  => $u->role?->role_name,
            ]),
        ]);
    }

    // ── Assign a user ─────────────────────────────────────────────────────────

    public function store(Request $request, int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = User::findOrFail($data['user_id']);

        // Only allow assignable roles
        if (! in_array($user->role?->access_level, self::ASSIGNABLE_LEVELS, true)) {
            return response()->json([
                'message' => 'Only staff, agents, and planners can be assigned to leads.',
            ], 422);
        }

        // attach() is idempotent when combined with unique constraint — but it would
        // throw a DB error on duplicate. Use syncWithoutDetaching for safety.
        $alreadyAssigned = $lead->assignedUsers()->where('users.id', $user->id)->exists();
        if ($alreadyAssigned) {
            return response()->json(['message' => 'User is already assigned to this lead.'], 422);
        }

        $lead->assignedUsers()->attach($user->id);

        return response()->json([
            'message'  => "{$user->first_name} {$user->last_name} assigned.",
            'assignee' => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'email'      => $user->email,
                'role_name'  => $user->role?->role_name,
            ],
        ], 201);
    }

    // ── Unassign a user ───────────────────────────────────────────────────────

    public function destroy(int $leadId, int $userId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);
        $lead->assignedUsers()->detach($userId);

        return response()->json(['message' => 'User unassigned.']);
    }

    // ── List assignable users (for the dropdown) ──────────────────────────────

    public function assignableUsers(): JsonResponse
    {
        $roleIds = UserRole::whereIn('access_level', self::ASSIGNABLE_LEVELS)
                           ->pluck('id');

        $users = User::whereIn('role_id', $roleIds)
                     ->where('status', 1)
                     ->with('role:id,role_name,access_level')
                     ->orderBy('first_name')
                     ->get(['id', 'first_name', 'last_name', 'email', 'role_id'])
                     ->map(fn ($u) => [
                         'id'         => $u->id,
                         'first_name' => $u->first_name,
                         'last_name'  => $u->last_name,
                         'email'      => $u->email,
                         'role_name'  => $u->role?->role_name,
                     ]);

        return response()->json($users);
    }
}
