<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocSignStatus extends Model
{
    protected $fillable = [
        'lead_id',
        'envelope_id',
        'status',
        'sent_at',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at'   => 'datetime',
            'signed_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /** Is the envelope still awaiting a response? */
    public function isPending(): bool
    {
        return in_array($this->status, ['sent', 'delivered'], true);
    }
}
