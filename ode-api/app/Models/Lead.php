<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'affiliate_string',
        'referral_string',
        'user_id',
        'referred_by_affiliate_id',
        'referred_by_planner_id',
        'referred_by_customer_id',
        'event_type_id',
        'event_type_label',
        'when_event',
        'event_date',
        'start_time',
        'state_id',
        'event_state',
        'event_name',
        'no_of_people',
        'event_past_2am',
        'have_entry_fee',
        'event_description',
        'alcohol_served',
        'alcohol_served_by',
        'alcohol_insurance',
        'alcohol_additional_insured',
        'is_sold_profitable',
        'special_activities',
        'event_special_act_detail',
        'bouncehouses',
        'is_inflatables_coverage',
        'live_musical_performances',
        'vendor_activity',
        'product',
        'carrier',
        'coverage_limit',
        'waiver_sub_status',
        'hired_status',
        'primary_basis',
        'additional_insured',
        'lead_offered_plans',
        'email',
        'phone',
        'first_name',
        'last_name',
        'street',
        'city',
        'zip',
        'ins_first_name',
        'ins_last_name',
        'ins_street',
        'ins_city',
        'ins_state',
        'ins_zip',
        'venue_name',
        'contact_at_venue',
        'venue_address',
        'venue_street',
        'venue_state',
        'venue_zip',
        'venue_contact_number',
        'venue_contact_email',
        'private_residence',
        'e_signature',
        'acknowledge',
        'any_claims',
        'payment_id',
        'payment_status',
        'bound',
        'submission_status',
        'status',
        'closing_reason',
        'pending_ode_quote_link_id',
        'pending_quote_status',
        'pending_json_form_array',
        'pending_changes',
        'donation_to',
        'prefilled_state_name',
        'user_timezone',
        'is_email_blocked',
        'is_on_hold',
        'is_priority_lead',
        'commission_status',
        'requoted_id',
        'type',
        'is_charged_ticket',
    ];

    protected function casts(): array
    {
        return [
            'event_date'          => 'date',
            'event_past_2am'      => 'boolean',
            'have_entry_fee'      => 'boolean',
            'is_sold_profitable'  => 'boolean',
            'special_activities'  => 'boolean',
            'bouncehouses'        => 'boolean',
            'is_inflatables_coverage' => 'boolean',
            'live_musical_performances' => 'boolean',
            'waiver_sub_status'   => 'boolean',
            'hired_status'        => 'boolean',
            'primary_basis'       => 'boolean',
            'private_residence'   => 'boolean',
            'bound'               => 'boolean',
            'is_email_blocked'    => 'boolean',
            'is_on_hold'          => 'boolean',
            'is_priority_lead'    => 'boolean',
            'lead_offered_plans'  => 'array',
            'pending_changes'     => 'array',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class);
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(UsState::class, 'state_id');
    }

    public function assignedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'lead_assignment')
                    ->withTimestamps();
    }

    public function notes(): HasMany
    {
        return $this->hasMany(LeadNote::class);
    }

    public function emails(): HasMany
    {
        return $this->hasMany(LeadEmail::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(LeadFile::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(LeadFollowUp::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(LeadAction::class);
    }

    public function changes(): HasMany
    {
        return $this->hasMany(LeadChange::class);
    }

    public function receivedPayments(): HasMany
    {
        return $this->hasMany(ReceivedPayment::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function sale(): HasOne
    {
        return $this->hasOne(Sale::class)->latest();
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function referredByAffiliate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by_affiliate_id');
    }

    public function referredByPlanner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by_planner_id');
    }

    public function referredByCustomer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by_customer_id');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('submission_status', $status);
    }

    public function scopeFinished($query)
    {
        return $query->where('submission_status', 'finished');
    }
}
