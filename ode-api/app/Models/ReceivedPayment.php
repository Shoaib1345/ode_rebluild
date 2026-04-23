<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceivedPayment extends Model
{
    protected $fillable = [
        'lead_id',
        'payment_received_by',
        'payment_mode',
        'payment_carrier',
        'payment_received_other',
        'amount_received',
        'broker_fee_percentage',
        'broker_fee',
        'paypal_fee_percentage',
        'paypal_fee',
        'tria_fee_percentage',
        'tria_fee',
        'policy_effective_date',
        'policy_expiry_date',
        'proof_of_payment',
        'comments',
        'user_timezone',
    ];

    protected function casts(): array
    {
        return [
            'amount_received'       => 'decimal:2',
            'broker_fee'            => 'decimal:2',
            'paypal_fee'            => 'decimal:2',
            'tria_fee'              => 'decimal:2',
            'policy_effective_date' => 'date',
            'policy_expiry_date'    => 'date',
        ];
    }

    // Payment mode constants matching legacy values
    const MODE_CREDIT_CARD = 1;
    const MODE_PAYPAL      = 2;
    const MODE_CHEQUE      = 3;
    const MODE_CASH        = 4;
    const MODE_OTHER       = 5;
    const MODE_STRIPE      = 6;

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payment_received_by');
    }
}
