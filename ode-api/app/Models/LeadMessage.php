<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A single message in a lead's support conversation.
 *
 * @see \App\Models\Lead::messages()
 */
class LeadMessage extends Model
{
    use SoftDeletes;

    public const DIRECTION_IN  = 'in';   // from the customer/lead
    public const DIRECTION_OUT = 'out';  // from an admin/CSR

    protected $fillable = [
        'lead_id',
        'user_id',
        'direction',
        'body',
        'is_internal',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'is_internal' => 'boolean',
            'read_at'     => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ── Scopes ───────────────────────────────────────────────────────────────────

    public function scopeInbound($query)
    {
        return $query->where('direction', self::DIRECTION_IN);
    }

    public function scopeOutbound($query)
    {
        return $query->where('direction', self::DIRECTION_OUT);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /** Messages a customer is allowed to see (excludes admin-only internal notes). */
    public function scopeVisibleToCustomer($query)
    {
        return $query->where('is_internal', false);
    }
}
