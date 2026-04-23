<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;
    protected $fillable = [
        'lead_id',
        'created_by',
        'type',
        'encode_id',
        'first_name',
        'last_name',
        'email',
        'email_cc',
        'email_bcc',
        'email_subject',
        'event_type',
        'carrier',
        'effective_date',
        'expiration_date',
        'min_limit',
        'max_limit',
        'broker_fee',
        'processing_fee',
        'total_premium',
        'total_payable',
        'street',
        'suite',
        'city',
        'state',
        'zip',
        'plans',
        'invoice_status',
        'paypal_response',
        'paypal_transaction_id',
        'user_timezone',
    ];

    protected function casts(): array
    {
        return [
            'effective_date'   => 'date',
            'expiration_date'  => 'date',
            'broker_fee'       => 'decimal:2',
            'processing_fee'   => 'decimal:2',
            'total_premium'    => 'decimal:2',
            'total_payable'    => 'decimal:2',
            'plans'            => 'array',
        ];
    }

    const STATUS_UNPAID = 0;
    const STATUS_PAID   = 1;

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(InvoiceLineItem::class);
    }

    public function coverageLines(): HasMany
    {
        return $this->hasMany(InvoiceCoverageLine::class);
    }

    public function scopeUnpaid($query)
    {
        return $query->where('invoice_status', self::STATUS_UNPAID);
    }

    public function scopePaid($query)
    {
        return $query->where('invoice_status', self::STATUS_PAID);
    }
}
