<?php

namespace Tests\Feature;

use App\Models\ChatbotQa;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Chatbot knowledge base — public read + admin management (add / CSV import / delete).
 */
class ChatbotQaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([1 => 'Admin', 5 => 'Customer'] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function makeUser(int $level): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(['role_id' => $role->id, 'status' => 1]);
    }

    public function test_public_can_read_qa(): void
    {
        ChatbotQa::create(['keywords' => 'refund|cancel', 'answer' => 'Contact support.']);

        $this->getJson('/api/chatbot/qa')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.keywords', ['refund', 'cancel'])
            ->assertJsonPath('0.answer', 'Contact support.');
    }

    public function test_admin_can_add_entry(): void
    {
        $this->actingAs($this->makeUser(1))->postJson('/api/admin/chatbot/qa', [
            'keywords' => 'discount|promo',
            'answer'   => 'No promotions right now.',
        ])->assertCreated();

        $this->assertDatabaseHas('chatbot_qa', ['keywords' => 'discount|promo']);
    }

    public function test_admin_can_import_csv_text(): void
    {
        $csv = "keywords,answer\nrefund|cancel,\"Refunds are case-by-case.\"\ndiscount,\"No promos.\"";

        $this->actingAs($this->makeUser(1))->postJson('/api/admin/chatbot/qa/import', ['csv' => $csv])
            ->assertCreated()
            ->assertJsonPath('imported', 2);

        $this->assertDatabaseCount('chatbot_qa', 2);
        $this->assertDatabaseHas('chatbot_qa', ['keywords' => 'refund|cancel', 'answer' => 'Refunds are case-by-case.']);
    }

    public function test_import_replace_clears_existing(): void
    {
        ChatbotQa::create(['keywords' => 'old', 'answer' => 'old answer']);

        $csv = "keywords,answer\nnew,\"new answer\"";

        $this->actingAs($this->makeUser(1))->postJson('/api/admin/chatbot/qa/import', ['csv' => $csv, 'replace' => true])
            ->assertCreated();

        $this->assertDatabaseCount('chatbot_qa', 1);
        $this->assertDatabaseMissing('chatbot_qa', ['keywords' => 'old']);
    }

    public function test_import_rejects_empty_csv(): void
    {
        $this->actingAs($this->makeUser(1))->postJson('/api/admin/chatbot/qa/import', ['csv' => ''])
            ->assertStatus(422);
    }

    public function test_admin_can_delete_and_clear(): void
    {
        $a = ChatbotQa::create(['keywords' => 'a', 'answer' => 'a']);
        ChatbotQa::create(['keywords' => 'b', 'answer' => 'b']);
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->deleteJson("/api/admin/chatbot/qa/{$a->id}")->assertOk();
        $this->assertDatabaseMissing('chatbot_qa', ['id' => $a->id]);

        $this->actingAs($admin)->deleteJson('/api/admin/chatbot/qa')->assertOk();
        $this->assertDatabaseCount('chatbot_qa', 0);
    }

    public function test_non_admin_cannot_manage(): void
    {
        $customer = $this->makeUser(5);
        $this->actingAs($customer)->getJson('/api/admin/chatbot/qa')->assertForbidden();
        $this->actingAs($customer)->postJson('/api/admin/chatbot/qa', ['keywords' => 'x', 'answer' => 'y'])->assertForbidden();
    }
}
