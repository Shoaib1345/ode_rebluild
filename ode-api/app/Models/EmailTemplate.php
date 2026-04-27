<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Admin-managed email template.
 *
 * Template keys (FULL-SPEC-V2.md §18.4):
 *   quote_submitted     — wizard step finished
 *   payment_receipt     — payment success
 *   follow_up_reminder  — staff follow-up cron
 *   post_event          — day after event
 *   7day_saved          — 7 days before saved lead
 *   7day_invoice        — 7 days before MQ lead with pending invoice
 *   invoice_sent        — staff manual send
 *
 * Body uses {variableName} substitution via EmailService::render().
 */
class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'subject',
        'body',
        'variables',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Find active template by key. Returns null if not found or inactive.
     */
    public static function findActive(string $key): ?static
    {
        return static::where('key', $key)->where('is_active', true)->first();
    }
}
