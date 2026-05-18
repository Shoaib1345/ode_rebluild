<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadAction extends Model
{
    // ── Action-type constants ─────────────────────────────────────────────────

    const LEAD_CREATED        = 'lead_created';
    const EMAIL_SENT          = 'email_sent';
    const NOTE_ADDED          = 'note_added';
    const FOLLOW_UP_ADDED     = 'follow_up_added';
    const STATUS_CHANGED      = 'status_changed';

    const INVOICE_CREATED     = 'invoice_created';
    const INVOICE_VIEWED      = 'invoice_viewed';
    const INVOICE_PAID        = 'invoice_paid';

    const PDF_GENERATED       = 'pdf_generated';
    const COI_GENERATED       = 'coi_generated';

    const AGENT_ASSIGNED      = 'agent_assigned';
    const AGENT_UNASSIGNED    = 'agent_unassigned';
    const LEAD_VIEWED_AGENT   = 'lead_viewed_agent';

    const DOCUSIGN_SENT       = 'docusign_sent';
    const DOCUSIGN_COMPLETED  = 'docusign_completed';

    // ── Eloquent ──────────────────────────────────────────────────────────────

    protected $fillable = [
        'lead_id',
        'user_id',
        'action_type',
        'message',
        'meta',
        'user_timezone',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Static helper ─────────────────────────────────────────────────────────

    /**
     * Create a structured activity entry.
     *
     * @param  int         $leadId
     * @param  string      $actionType  One of the class constants above
     * @param  string      $message     Human-readable summary (displayed in timeline)
     * @param  int|null    $userId      Auth user ID, or null for system/public actions
     * @param  array       $meta        Extra structured data (invoice_id, amount, etc.)
     */
    public static function log(
        int     $leadId,
        string  $actionType,
        string  $message,
        ?int    $userId = null,
        array   $meta   = []
    ): self {
        return static::create([
            'lead_id'     => $leadId,
            'user_id'     => $userId,
            'action_type' => $actionType,
            'message'     => $message,
            'meta'        => empty($meta) ? null : $meta,
        ]);
    }
}
