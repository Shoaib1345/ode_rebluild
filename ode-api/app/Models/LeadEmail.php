<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadEmail extends Model
{
    protected $fillable = [
        'lead_id',
        'email_msg_number',
        'email_from',
        'from_email_address',
        'subject',
        'message',
        'mail_to',
        'mail_cc',
        'mail_bcc',
        'has_attachment',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'has_attachment' => 'boolean',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function scopeVisible($query)
    {
        return $query->where('status', 0);
    }
}
