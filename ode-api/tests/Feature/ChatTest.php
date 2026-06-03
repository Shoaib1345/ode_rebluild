<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadMessage;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Customer / lead support chat.
 *
 * Admin inbox of conversations (with unread counts) + threaded view + reply,
 * plus the customer-portal inbound send/list endpoints.
 */
class ChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([
            0 => 'Super Admin', 1 => 'Admin', 2 => 'Staff',
            5 => 'Customer', 6 => 'Affiliate',
        ] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function makeUser(int $level, array $extra = []): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(array_merge(['role_id' => $role->id, 'status' => 1], $extra));
    }

    // ── Admin inbox ──────────────────────────────────────────────────────────────

    public function test_admin_sees_only_leads_with_messages(): void
    {
        $withMsg = Lead::factory()->create(['status' => 1, 'first_name' => 'Has', 'last_name' => 'Chat']);
        $withMsg->messages()->create(['direction' => 'in', 'body' => 'Hi there']);

        $noMsg = Lead::factory()->create(['status' => 1]); // no messages → excluded

        $res = $this->actingAs($this->makeUser(1))->getJson('/api/admin/chat?per_page=50');
        $res->assertOk();

        $ids = collect($res->json('data'))->pluck('lead_id');
        $this->assertTrue($ids->contains($withMsg->id), 'lead with a message should appear');
        $this->assertFalse($ids->contains($noMsg->id), 'lead with no messages should be excluded');

        $row = collect($res->json('data'))->firstWhere('lead_id', $withMsg->id);
        $this->assertSame(1, $row['unread_count']);
    }

    public function test_admin_conversations_count_only_inbound_unread(): void
    {
        $lead = Lead::factory()->create(['status' => 1]);
        $lead->messages()->create(['direction' => 'in', 'body' => 'one']);
        $lead->messages()->create(['direction' => 'in', 'body' => 'two']);
        $lead->messages()->create(['direction' => 'out', 'body' => 'reply']); // outbound never counts
        $lead->messages()->create(['direction' => 'in', 'body' => 'read', 'read_at' => now()]); // already read

        $res = $this->actingAs($this->makeUser(1))->getJson('/api/admin/chat?per_page=50');
        $res->assertOk();

        $row = collect($res->json('data'))->firstWhere('lead_id', $lead->id);
        $this->assertSame(2, $row['unread_count']);
    }

    public function test_unread_count_endpoint_excludes_outbound_and_read(): void
    {
        $admin = $this->makeUser(1);

        $base = $this->actingAs($admin)->getJson('/api/admin/chat/unread-count')->json('unread_count');

        $lead = Lead::factory()->create(['status' => 1]);
        $lead->messages()->create(['direction' => 'in',  'body' => 'x']);                      // +1
        $lead->messages()->create(['direction' => 'in',  'body' => 'y']);                      // +1
        $lead->messages()->create(['direction' => 'out', 'body' => 'z']);                      // never counts
        $lead->messages()->create(['direction' => 'in',  'body' => 'r', 'read_at' => now()]);  // already read

        $this->actingAs($admin)->getJson('/api/admin/chat/unread-count')
             ->assertOk()
             ->assertJsonPath('unread_count', $base + 2);
    }

    public function test_opening_thread_marks_inbound_read_and_returns_messages(): void
    {
        $lead = Lead::factory()->create(['status' => 1]);
        $lead->messages()->create(['direction' => 'in', 'body' => 'first']);
        $lead->messages()->create(['direction' => 'in', 'body' => 'second']);

        $res = $this->actingAs($this->makeUser(1))->getJson("/api/admin/chat/{$lead->id}");

        $res->assertOk()
            ->assertJsonPath('lead.id', $lead->id)
            ->assertJsonCount(2, 'messages');

        // All inbound messages are now read.
        $this->assertSame(0, $lead->messages()->inbound()->unread()->count());
    }

    public function test_admin_can_send_outbound_reply(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create(['status' => 1]);

        $res = $this->actingAs($admin)->postJson("/api/admin/chat/{$lead->id}", [
            'body' => 'Thanks for reaching out!',
        ]);

        $res->assertCreated()
            ->assertJsonPath('direction', 'out')
            ->assertJsonPath('body', 'Thanks for reaching out!')
            ->assertJsonPath('sender_id', $admin->id);

        $this->assertDatabaseHas('lead_messages', [
            'lead_id'   => $lead->id,
            'user_id'   => $admin->id,
            'direction' => 'out',
            'body'      => 'Thanks for reaching out!',
        ]);
    }

    public function test_send_requires_body(): void
    {
        $lead = Lead::factory()->create(['status' => 1]);

        $this->actingAs($this->makeUser(1))
             ->postJson("/api/admin/chat/{$lead->id}", ['body' => ''])
             ->assertStatus(422);
    }

    public function test_non_admin_cannot_access_admin_chat(): void
    {
        $lead = Lead::factory()->create(['status' => 1]);

        $this->actingAs($this->makeUser(5))->getJson('/api/admin/chat')->assertForbidden();
        $this->actingAs($this->makeUser(5))->getJson("/api/admin/chat/{$lead->id}")->assertForbidden();
    }

    // ── Customer portal ──────────────────────────────────────────────────────────

    public function test_customer_can_send_inbound_message(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['status' => 1, 'user_id' => $customer->id]);

        $res = $this->actingAs($customer)->postJson('/api/customer/messages', [
            'body' => 'When does my coverage start?',
        ]);

        $res->assertCreated()
            ->assertJsonPath('direction', 'in')
            ->assertJsonPath('lead_id', $lead->id);

        $this->assertDatabaseHas('lead_messages', [
            'lead_id'   => $lead->id,
            'user_id'   => $customer->id,
            'direction' => 'in',
        ]);
    }

    public function test_customer_message_list_marks_outbound_read(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['status' => 1, 'user_id' => $customer->id]);
        $lead->messages()->create(['direction' => 'out', 'body' => 'Hello from support']);

        $res = $this->actingAs($customer)->getJson('/api/customer/messages');

        $res->assertOk()
            ->assertJsonPath('lead_id', $lead->id)
            ->assertJsonCount(1, 'messages');

        $this->assertSame(0, $lead->messages()->outbound()->unread()->count());
    }

    public function test_customer_without_leads_gets_empty_thread(): void
    {
        $customer = $this->makeUser(5);

        $this->actingAs($customer)->getJson('/api/customer/messages')
             ->assertOk()
             ->assertJsonPath('lead_id', null)
             ->assertJsonPath('messages', []);

        $this->actingAs($customer)->postJson('/api/customer/messages', ['body' => 'hi'])
             ->assertStatus(422);
    }

    public function test_customer_cannot_post_to_foreign_lead(): void
    {
        $customer = $this->makeUser(5);
        $ownLead  = Lead::factory()->create(['status' => 1, 'user_id' => $customer->id]);
        $foreign  = Lead::factory()->create(['status' => 1, 'user_id' => $this->makeUser(5)->id]);

        // Requesting a lead they don't own falls back to their own lead.
        $res = $this->actingAs($customer)->postJson('/api/customer/messages', [
            'body'    => 'sneaky',
            'lead_id' => $foreign->id,
        ]);

        $res->assertCreated()->assertJsonPath('lead_id', $ownLead->id);
        $this->assertDatabaseMissing('lead_messages', ['lead_id' => $foreign->id]);
    }

    // ── Moderation: block / unblock ────────────────────────────────────────────────

    public function test_admin_can_block_and_unblock_chat(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create(['status' => 1]);

        $this->actingAs($admin)->patchJson("/api/admin/chat/{$lead->id}/settings", ['is_blocked' => true])
             ->assertOk()->assertJsonPath('is_blocked', true);
        $this->assertTrue($lead->fresh()->is_chat_blocked);

        $this->actingAs($admin)->patchJson("/api/admin/chat/{$lead->id}/settings", ['is_blocked' => false])
             ->assertOk()->assertJsonPath('is_blocked', false);
        $this->assertFalse($lead->fresh()->is_chat_blocked);
    }

    public function test_blocked_customer_cannot_send(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['status' => 1, 'user_id' => $customer->id, 'is_chat_blocked' => true]);

        $this->actingAs($customer)->postJson('/api/customer/messages', ['body' => 'hello?'])
             ->assertStatus(403);

        $this->assertDatabaseMissing('lead_messages', ['lead_id' => $lead->id]);
    }

    // ── Moderation: close / reopen ─────────────────────────────────────────────────

    public function test_admin_can_close_and_customer_reopens(): void
    {
        $admin    = $this->makeUser(1);
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['status' => 1, 'user_id' => $customer->id]);

        $this->actingAs($admin)->patchJson("/api/admin/chat/{$lead->id}/settings", ['is_closed' => true])
             ->assertOk()->assertJsonPath('is_closed', true);
        $this->assertNotNull($lead->fresh()->chat_closed_at);

        // Customer reply reopens the conversation.
        $this->actingAs($customer)->postJson('/api/customer/messages', ['body' => 'one more thing'])
             ->assertCreated();
        $this->assertNull($lead->fresh()->chat_closed_at);
    }

    public function test_admin_reply_reopens_closed_conversation(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create(['status' => 1, 'chat_closed_at' => now()]);

        $this->actingAs($admin)->postJson("/api/admin/chat/{$lead->id}", ['body' => 'following up'])
             ->assertCreated();

        $this->assertNull($lead->fresh()->chat_closed_at);
    }

    public function test_conversations_status_filter(): void
    {
        $admin  = $this->makeUser(1);
        $open   = Lead::factory()->create(['status' => 1]);
        $closed = Lead::factory()->create(['status' => 1, 'chat_closed_at' => now()]);
        $open->messages()->create(['direction' => 'in', 'body' => 'open one']);
        $closed->messages()->create(['direction' => 'in', 'body' => 'closed one']);

        $openIds = collect($this->actingAs($admin)->getJson('/api/admin/chat?status=open&per_page=50')->json('data'))->pluck('lead_id');
        $this->assertTrue($openIds->contains($open->id));
        $this->assertFalse($openIds->contains($closed->id));

        $closedIds = collect($this->actingAs($admin)->getJson('/api/admin/chat?status=closed&per_page=50')->json('data'))->pluck('lead_id');
        $this->assertTrue($closedIds->contains($closed->id));
        $this->assertFalse($closedIds->contains($open->id));
    }

    // ── Moderation: delete message ──────────────────────────────────────────────────

    public function test_admin_can_delete_message(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create(['status' => 1]);
        $msg   = $lead->messages()->create(['direction' => 'in', 'body' => 'spam spam']);

        $this->actingAs($admin)->deleteJson("/api/admin/chat/{$lead->id}/messages/{$msg->id}")
             ->assertOk();

        $this->assertSoftDeleted('lead_messages', ['id' => $msg->id]);

        // Thread no longer surfaces the deleted message.
        $this->actingAs($admin)->getJson("/api/admin/chat/{$lead->id}")
             ->assertOk()->assertJsonCount(0, 'messages');
    }

    // ── Moderation: internal notes ──────────────────────────────────────────────────

    public function test_internal_note_hidden_from_customer_but_visible_to_admin(): void
    {
        $admin    = $this->makeUser(1);
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create(['status' => 1, 'user_id' => $customer->id]);

        $this->actingAs($admin)->postJson("/api/admin/chat/{$lead->id}", [
            'body' => 'VIP — comp the broker fee', 'is_internal' => true,
        ])->assertCreated()->assertJsonPath('is_internal', true);

        $this->actingAs($admin)->postJson("/api/admin/chat/{$lead->id}", [
            'body' => 'Hello, how can we help?',
        ])->assertCreated();

        // Admin sees both messages.
        $this->actingAs($admin)->getJson("/api/admin/chat/{$lead->id}")
             ->assertOk()->assertJsonCount(2, 'messages');

        // Customer sees only the non-internal reply.
        $res = $this->actingAs($customer)->getJson('/api/customer/messages')->assertOk();
        $res->assertJsonCount(1, 'messages');
        $bodies = collect($res->json('messages'))->pluck('body');
        $this->assertTrue($bodies->contains('Hello, how can we help?'));
        $this->assertFalse($bodies->contains('VIP — comp the broker fee'));
    }
}
