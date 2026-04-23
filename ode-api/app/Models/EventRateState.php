<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRateState extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'event_rate_id',
        'state_code',
    ];

    public function eventRate(): BelongsTo
    {
        return $this->belongsTo(EventRate::class);
    }
}
