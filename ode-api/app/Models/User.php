<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'agency_id',
        'role_id',
        'email',
        'password',
        'first_name',
        'last_name',
        'phone',
        'status',
        'referral_string',
        'w9_status',
        'w9_file',
        'is_agency',
        'is_on_payroll',
        'commission_pct',
        'commission_flat',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'w9_status'         => 'boolean',
            'is_agency'         => 'boolean',
            'is_on_payroll'     => 'boolean',
            'commission_pct'    => 'decimal:2',
            'commission_flat'   => 'decimal:2',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(UserRole::class, 'role_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function assignedLeads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'lead_assignment')
                    ->withTimestamps();
    }

    public function leadNotes(): HasMany
    {
        return $this->hasMany(LeadNote::class, 'added_by');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(LeadFollowUp::class);
    }

    public function receivedPayments(): HasMany
    {
        return $this->hasMany(ReceivedPayment::class, 'payment_received_by');
    }

    public function userPayments(): HasMany
    {
        return $this->hasMany(UserPayment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'created_by');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function w9Uploads(): HasMany
    {
        return $this->hasMany(W9Upload::class);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Whether the user's most-recent W9 has been admin-verified.
     * Controls visibility of commission dollar amounts in portal APIs (§14, §25).
     */
    public function hasVerifiedW9(): bool
    {
        return $this->w9Uploads()
            ->whereNotNull('verified_at')
            ->exists();
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function isSuperAdmin(): bool
    {
        return $this->role?->access_level === 0;
    }

    public function isAdmin(): bool
    {
        return $this->role?->access_level <= 1;
    }

    public function isStaff(): bool
    {
        return $this->role?->access_level <= 2;
    }

    public function isCustomer(): bool
    {
        return $this->role?->access_level === 5;
    }

    public function isAffiliate(): bool
    {
        return $this->role?->access_level === 6;
    }

    public function isAgent(): bool
    {
        return $this->role?->access_level === 7;
    }

    public function isPlanner(): bool
    {
        return $this->role?->access_level === 8;
    }
}
