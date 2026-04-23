<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agency extends Model
{
    protected $fillable = [
        'agency_name',
        'modules_setup',
    ];

    protected function casts(): array
    {
        return [
            'modules_setup' => 'array',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function invoiceTemplates(): HasMany
    {
        return $this->hasMany(InvoiceTemplate::class);
    }

    public function invoiceSenderProfiles(): HasMany
    {
        return $this->hasMany(InvoiceSenderProfile::class);
    }
}
