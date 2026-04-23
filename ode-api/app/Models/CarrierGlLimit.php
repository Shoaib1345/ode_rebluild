<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarrierGlLimit extends Model
{
    protected $fillable = [
        'carrier',
        'min_limit',
        'max_limit',
        'gl_limit',
        'gl_limit_type',
    ];

    public function scopeForCarrier($query, string $carrier)
    {
        return $query->where('carrier', $carrier);
    }

    public function scopeForLimitRange($query, int $min, int $max)
    {
        return $query->where('min_limit', $min)->where('max_limit', $max);
    }
}
