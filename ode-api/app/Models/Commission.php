<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a single commission earned by a user for a converted lead.
 *
 * Types & amounts (FULL-SPEC-V2.md §14, §15, §16, §25):
 *   affiliate : $10 flat
 *   agent     : (lead.premium × user.commission_pct / 100) + user.commission_flat
 *   planner   : $15 flat
 *   customer  : $5 flat
 *
 * The unique(lead_id, type) constraint on the table makes every accrual
 * idempotent — calling firstOrCreate is safe to call multiple times.
 */
class Commission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lead_id',
        'amount',
        'type',
        'status',
        'accrued_at',
        'paid_at',
        'paid_method',
        'paid_note',
    ];

    protected function casts(): array
    {
        return [
            'amount'     => 'decimal:2',
            'accrued_at' => 'datetime',
            'paid_at'    => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeAccrued($query)
    {
        return $query->where('status', 'accrued');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function markPaid(string $method, ?string $note = null): void
    {
        $this->update([
            'status'      => 'paid',
            'paid_at'     => now(),
            'paid_method' => $method,
            'paid_note'   => $note,
        ]);
    }
}
