<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadFile extends Model
{
    protected $fillable = [
        'lead_id',
        'name',
        'category',
        'comments',
        'path',
        'send_to_customer',
        'user_timezone',
    ];

    protected function casts(): array
    {
        return [
            'send_to_customer' => 'boolean',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function scopeForCustomer($query)
    {
        return $query->where('send_to_customer', true);
    }
}
