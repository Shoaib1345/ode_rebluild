<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventType extends Model
{
    use HasFactory;
    // Standard 'id' primary key — the old crm used 'uid' but this rebuild uses id()
    // Do NOT add $primaryKey = 'uid' — the migration creates a standard id column.

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

    /**
     * Pricing role used by the broker-fee engine. Resolved by NAME (not the
     * auto-increment id) so the special rules survive any re-seed / migration.
     *
     * Legacy ode_new keyed these off hard-coded ids (66 Baby Shower,
     * 72 Wedding, 32 Vendor); the rebuild keys off the event_type name instead.
     */
    public function pricingRole(): string
    {
        return match ($this->event_type) {
            'Baby Shower'       => 'baby_shower',
            'Wedding Reception' => 'wedding',
            'Vendor at Event'   => 'vendor',
            default             => 'standard',
        };
    }
}
