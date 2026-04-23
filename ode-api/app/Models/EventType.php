<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventType extends Model
{
    // Legacy table uses 'uid' as primary key instead of 'id'
    protected $primaryKey = 'uid';

    protected $fillable = [
        'event_type',
        'client_added',
    ];

    protected function casts(): array
    {
        return [
            'client_added' => 'boolean',
        ];
    }

    public function eventRates(): HasMany
    {
        return $this->hasMany(EventRate::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    // Only types shown in public quote dropdown
    public function scopePublic($query)
    {
        return $query->where('client_added', false);
    }
}
