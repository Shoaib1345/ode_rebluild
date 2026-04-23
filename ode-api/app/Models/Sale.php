<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    protected $fillable = [
        'lead_id',
        'first_name',
        'last_name',
        'quantity',
        'affiliate_string',
        'referral_string',
        'price',
        'purchase_date',
    ];

    protected function casts(): array
    {
        return [
            'price'         => 'decimal:2',
            'purchase_date' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
