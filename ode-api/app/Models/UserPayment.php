<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPayment extends Model
{
    protected $fillable = [
        'user_id',
        'payment',
        'payment_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'payment'      => 'decimal:2',
            'payment_date' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
