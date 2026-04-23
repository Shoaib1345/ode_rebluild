<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a W9 form uploaded by an affiliate, agent, planner, or customer.
 *
 * Commission amounts are hidden in portal APIs until verified_at is set
 * by an admin (FULL-SPEC-V2.md §14, §25).
 *
 * Files stored at: referrals/{userId}-w9-{timestamp}.pdf  (§21.2)
 */
class W9Upload extends Model
{
    protected $fillable = [
        'user_id',
        'file_path',
        'file_name',
        'file_size',
        'verified_at',
        'verified_by',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'file_size'   => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    public function status(): string
    {
        if ($this->verified_at) {
            return 'verified';
        }
        return 'pending';
    }
}
