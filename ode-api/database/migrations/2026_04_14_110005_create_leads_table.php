<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Core quote/order record — the heart of the CRM.
 * Maps to legacy crm_leads.
 *
 * Notable changes from legacy:
 *  - PK changed from VARCHAR(25) "lead_id" → bigint auto-increment "id"
 *  - event_date changed from TEXT → date (normalized)
 *  - isEmailBlocked/bound/privateResidence/isOnHold/isPriorityLead → boolean columns
 *  - comission_status typo fixed → commission_status
 *  - contac_at_venue typo fixed → contact_at_venue
 *  - pendingChanges / leadOfferedPlans stored as JSON
 *  - submission_status enum updated: "payment received" → "payment_received"
 *  - user_id / state_id added as proper FKs (nullable)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();

            // ── Attribution ───────────────────────────────────────────────────
            $table->string('affiliate_string', 50)->nullable()->index();
            $table->string('referral_string', 50)->nullable()->index();
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // ── Event Details ─────────────────────────────────────────────────
            $table->foreignId('event_type_id')
                  ->nullable()
                  ->constrained('event_types')
                  ->nullOnDelete();
            $table->string('event_type_label', 100)->nullable(); // snapshot of name at time of quote
            $table->string('when_event', 15)->nullable();         // "today", "this_week", etc.
            $table->date('event_date')->nullable();
            $table->time('start_time')->nullable();
            $table->foreignId('state_id')
                  ->nullable()
                  ->constrained('us_states')
                  ->nullOnDelete();
            $table->char('event_state', 2)->nullable();           // snapshot abbreviation
            $table->string('event_name', 155)->nullable();
            $table->unsignedSmallInteger('no_of_people')->nullable();
            $table->boolean('event_past_2am')->default(false);
            $table->boolean('have_entry_fee')->default(false);
            $table->string('event_description', 100)->nullable();

            // ── Alcohol ───────────────────────────────────────────────────────
            $table->string('alcohol_served', 15)->nullable();
            $table->string('alcohol_served_by', 25)->nullable();
            $table->string('alcohol_insurance', 25)->nullable();
            $table->string('alcohol_additional_insured', 25)->nullable();
            $table->boolean('is_sold_profitable')->default(false);

            // ── Special Activities ────────────────────────────────────────────
            $table->boolean('special_activities')->default(false);
            $table->text('event_special_act_detail')->nullable();
            $table->boolean('bouncehouses')->default(false);
            $table->boolean('is_inflatables_coverage')->default(false);
            $table->boolean('live_musical_performances')->default(false);
            $table->string('vendor_activity', 55)->nullable();

            // ── Selected Coverage ─────────────────────────────────────────────
            $table->unsignedInteger('product')->nullable();       // event_rate.id snapshot
            $table->string('carrier', 55)->nullable();
            $table->string('coverage_limit', 100)->nullable();    // selected GL limit
            $table->boolean('waiver_sub_status')->default(false);
            $table->boolean('hired_status')->default(false);
            $table->boolean('primary_basis')->default(false);
            $table->string('additional_insured', 100)->nullable();
            $table->json('lead_offered_plans')->nullable();        // quote results snapshot

            // ── Contact Info ──────────────────────────────────────────────────
            $table->string('email', 155)->nullable()->index();
            $table->string('phone', 20)->nullable();
            $table->string('first_name', 55)->nullable();
            $table->string('last_name', 55)->nullable();
            $table->string('street', 100)->nullable();
            $table->string('city', 55)->nullable();
            $table->char('zip', 10)->nullable();

            // ── Insured Party (may differ from contact) ───────────────────────
            $table->string('ins_first_name', 100)->nullable();
            $table->string('ins_last_name', 100)->nullable();
            $table->string('ins_street', 100)->nullable();
            $table->string('ins_city', 55)->nullable();
            $table->char('ins_state', 2)->nullable();
            $table->char('ins_zip', 10)->nullable();

            // ── Venue ─────────────────────────────────────────────────────────
            $table->string('venue_name', 155)->nullable();
            $table->string('contact_at_venue', 55)->nullable();   // fixed typo from legacy
            $table->text('venue_address')->nullable();
            $table->string('venue_street', 100)->nullable();
            $table->char('venue_state', 2)->nullable();
            $table->char('venue_zip', 10)->nullable();
            $table->string('venue_contact_number', 55)->nullable();
            $table->string('venue_contact_email', 155)->nullable();
            $table->boolean('private_residence')->default(false);

            // ── Signature & Acknowledgement ───────────────────────────────────
            $table->string('e_signature', 155)->nullable();       // S3 path to PNG
            $table->string('acknowledge', 100)->nullable();
            $table->string('any_claims', 55)->nullable();

            // ── Payment & Status ──────────────────────────────────────────────
            $table->string('payment_id', 55)->nullable();         // Stripe charge/intent ID
            $table->tinyInteger('payment_status')->default(0);    // 0=none, 1=attempting
            $table->boolean('bound')->default(false);
            $table->enum('submission_status', [
                'tried',
                'saved',
                'mq',
                'plan_added_manually',
                'payment',
                'payment_received',
                'finished',
            ])->default('tried')->index();
            $table->tinyInteger('status')->default(1);            // 1=active, 2=deleted
            $table->tinyText('closing_reason')->nullable();

            // ── Pending / Quote Save ──────────────────────────────────────────
            $table->string('pending_ode_quote_link_id', 100)->nullable();
            $table->string('pending_quote_status', 15)->nullable();
            $table->text('pending_json_form_array')->nullable();
            $table->json('pending_changes')->nullable();

            // ── Misc ──────────────────────────────────────────────────────────
            $table->string('donation_to', 100)->nullable();
            $table->string('prefilled_state_name', 100)->nullable();
            $table->string('user_timezone', 35)->nullable();
            $table->boolean('is_email_blocked')->default(false);
            $table->boolean('is_on_hold')->default(false);
            $table->boolean('is_priority_lead')->default(false);
            $table->integer('commission_status')->default(0);     // fixed typo from legacy
            $table->unsignedInteger('requoted_id')->nullable();   // lead.id of the original quote
            $table->integer('type')->nullable();
            $table->string('is_charged_ticket', 100)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('event_date');
            $table->index(['submission_status', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
