<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceSenderProfile extends Model
{
    protected $fillable = [
        'agency_id',
        'company_name',
        'contact_first_name',
        'contact_last_name',
        'phone',
        'phone_ext',
        'address',
        'address2',
        'city',
        'state',
        'zipcode',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
