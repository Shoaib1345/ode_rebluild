<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserRole extends Model
{
    // Legacy table has no created_at / updated_at columns
    public $timestamps = false;

    protected $fillable = [
        'role_name',
        'access_level',
    ];

    protected function casts(): array
    {
        return [
            'access_level' => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
