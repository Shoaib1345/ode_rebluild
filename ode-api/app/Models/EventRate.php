<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventRate extends Model
{
    protected $fillable = [
        'event_type_id',
        'carrier',
        'min_audience',
        'max_audience',
        'rate',
        'min_limit',
        'max_limit',
        'limit_type',
        'host_liquor',
        'liquor',
        'noha',
        'w_o_s',
        'p_a_n_c_b',
        'e_a_i',
        'same_day_coverage',
        'weekend_coverage',
        'quote_instantly',
        'bind_instantly',
        'additional_people',
        'additional_charges',
    ];

    protected function casts(): array
    {
        return [
            'host_liquor'       => 'boolean',
            'liquor'            => 'boolean',
            'same_day_coverage' => 'boolean',
            'weekend_coverage'  => 'boolean',
            'quote_instantly'   => 'boolean',
            'bind_instantly'    => 'boolean',
            'rate'              => 'decimal:2',
        ];
    }

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class);
    }

    public function states(): HasMany
    {
        return $this->hasMany(EventRateState::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeForAudience($query, int $count)
    {
        return $query->where('min_audience', '<=', $count)
                     ->where('max_audience', '>=', $count);
    }

    public function scopeForState($query, string $stateCode)
    {
        return $query->whereHas('states', fn ($q) => $q->where('state_code', $stateCode));
    }

    public function scopeCarrier($query, string $carrier)
    {
        return $query->where('carrier', $carrier);
    }
}
