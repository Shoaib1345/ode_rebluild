<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadFollowUp extends Model
{
    protected $fillable = [
        'lead_id',
        'user_id',
        'created_by',
        'follow_up_date',
        'notes',
        'status',
        'reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_date'   => 'date',
            'reminder_sent_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 0);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 1);
    }

    public function scopeUpcoming($query)
    {
        return $query->pending()->whereDate('follow_up_date', '>=', now()->toDateString());
    }
}
