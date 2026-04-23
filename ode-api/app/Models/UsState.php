<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UsState extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'abbreviation',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'state_id');
    }
}
