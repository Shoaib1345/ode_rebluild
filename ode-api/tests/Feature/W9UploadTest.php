<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use App\Models\W9Upload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Feature tests for W9 Upload API + Visibility Gate.
 *
 * Covers:
 *   - Upload validation (must be PDF, max 5 MB)
 *   - Successful upload stores file + creates W9Upload row (status: pending)
 *   - GET /api/w9 returns current status
 *   - Admin PATCH /api/admin/users/{id}/w9/verify flips status to verified
 *   - Commission amounts are null before verification, visible after
 *   - Re-verifying an already-verified W9 returns 422
 */
class W9UploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->seedRoles();
    }

    // ── Upload validation ──────────────────────────────────────────────────────

    public function test_upload_requires_file(): void
    {
        $user = $this->makeUser(6); // affiliate

        $response = $this->actingAs($user)->postJson('/api/w9', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_rejects_non_pdf(): void
    {
        $user = $this->makeUser(6);
        $file = UploadedFile::fake()->create('document.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/api/w9', ['file' => $file]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_rejects_file_over_5mb(): void
    {
        $user = $this->makeUser(6);
        // 5,121 KB = slightly over 5 MB limit
        $file = UploadedFile::fake()->create('big.pdf', 5121, 'application/pdf');

        $response = $this->actingAs($user)->postJson('/api/w9', ['file' => $file]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['file']);
    }

    // ── Successful upload ──────────────────────────────────────────────────────

    public function test_affiliate_can_upload_w9(): void
    {
        $user = $this->makeUser(6);
        $file = UploadedFile::fake()->create('my-w9.pdf', 512, 'application/pdf');

        $response = $this->actingAs($user)->postJson('/api/w9', ['file' => $file]);

        $response->assertCreated()
                 ->assertJsonPath('w9.status', 'pending')
                 ->assertJsonPath('w9.file_name', 'my-w9.pdf');

        // DB row created
        $this->assertDatabaseHas('w9_uploads', [
            'user_id'     => $user->id,
            'file_name'   => 'my-w9.pdf',
            'verified_at' => null,
        ]);

        // File stored on disk
        $upload = W9Upload::where('user_id', $user->id)->latest()->first();
        Storage::assertExists($upload->file_path);
    }

    public function test_unauthenticated_user_cannot_upload(): void
    {
        $file = UploadedFile::fake()->create('w9.pdf', 100, 'application/pdf');

        $this->postJson('/api/w9', ['file' => $file])
             ->assertUnauthorized();
    }

    // ── Status endpoint ────────────────────────────────────────────────────────

    public function test_show_returns_null_when_no_upload(): void
    {
        $user = $this->makeUser(6);

        $this->actingAs($user)->getJson('/api/w9')
             ->assertOk()
             ->assertJsonPath('w9', null);
    }

    public function test_show_returns_pending_status_after_upload(): void
    {
        $user   = $this->makeUser(6);
        $upload = W9Upload::create([
            'user_id'   => $user->id,
            'file_path' => 'referrals/1-w9-20260423.pdf',
            'file_name' => 'w9.pdf',
            'file_size' => 1024,
        ]);

        $this->actingAs($user)->getJson('/api/w9')
             ->assertOk()
             ->assertJsonPath('w9.status', 'pending')
             ->assertJsonPath('w9.id', $upload->id);
    }

    public function test_show_returns_verified_status_after_admin_verification(): void
    {
        $user   = $this->makeUser(6);
        $upload = W9Upload::create([
            'user_id'     => $user->id,
            'file_path'   => 'referrals/1-w9-20260423.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 1024,
            'verified_at' => now(),
        ]);

        $this->actingAs($user)->getJson('/api/w9')
             ->assertOk()
             ->assertJsonPath('w9.status', 'verified');
    }

    // ── Admin verify ───────────────────────────────────────────────────────────

    public function test_admin_can_verify_w9(): void
    {
        $admin  = $this->makeUser(1); // admin
        $target = $this->makeUser(6); // affiliate

        W9Upload::create([
            'user_id'   => $target->id,
            'file_path' => 'referrals/2-w9-20260423.pdf',
            'file_name' => 'w9.pdf',
            'file_size' => 2048,
        ]);

        $response = $this->actingAs($admin)
                         ->patchJson("/api/admin/users/{$target->id}/w9/verify");

        $response->assertOk()
                 ->assertJsonPath('w9.status', 'verified');

        $this->assertDatabaseHas('w9_uploads', [
            'user_id'    => $target->id,
            'verified_by' => $admin->id,
        ]);

        $this->assertNotNull(
            W9Upload::where('user_id', $target->id)->latest()->first()->verified_at
        );
    }

    public function test_admin_cannot_verify_already_verified_w9(): void
    {
        $admin  = $this->makeUser(1);
        $target = $this->makeUser(6);

        W9Upload::create([
            'user_id'     => $target->id,
            'file_path'   => 'referrals/2-w9-20260423.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 2048,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $this->actingAs($admin)
             ->patchJson("/api/admin/users/{$target->id}/w9/verify")
             ->assertStatus(422)
             ->assertJsonPath('message', 'W9 is already verified.');
    }

    public function test_non_admin_cannot_verify_w9(): void
    {
        $affiliate = $this->makeUser(6);
        $target    = $this->makeUser(6);

        W9Upload::create([
            'user_id'   => $target->id,
            'file_path' => 'referrals/2-w9-20260423.pdf',
            'file_name' => 'w9.pdf',
            'file_size' => 512,
        ]);

        $this->actingAs($affiliate)
             ->patchJson("/api/admin/users/{$target->id}/w9/verify")
             ->assertForbidden();
    }

    // ── Admin show ─────────────────────────────────────────────────────────────

    public function test_admin_can_view_user_w9_history(): void
    {
        $admin  = $this->makeUser(1);
        $target = $this->makeUser(6);

        // Create 2 uploads for this user
        W9Upload::create(['user_id' => $target->id, 'file_path' => 'p1.pdf', 'file_name' => 'w9-v1.pdf', 'file_size' => 512]);
        W9Upload::create(['user_id' => $target->id, 'file_path' => 'p2.pdf', 'file_name' => 'w9-v2.pdf', 'file_size' => 1024]);

        $response = $this->actingAs($admin)
                         ->getJson("/api/admin/users/{$target->id}/w9");

        $response->assertOk()
                 ->assertJsonPath('user_id', $target->id)
                 ->assertJsonPath('w9_verified', false)
                 ->assertJsonCount(2, 'uploads');
    }

    // ── Visibility gate ────────────────────────────────────────────────────────

    public function test_commission_amounts_are_hidden_before_w9_verification(): void
    {
        $user = $this->makeUser(6);
        $lead = Lead::factory()->create(['submission_status' => 'payment_received']);

        Commission::create([
            'user_id'    => $user->id,
            'lead_id'    => $lead->id,
            'amount'     => '10.00',
            'type'       => 'affiliate',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        // No W9 uploaded → amounts should be null
        $response = $this->actingAs($user)->getJson('/api/commissions');

        $response->assertOk()
                 ->assertJsonPath('w9_verified', false)
                 ->assertJsonPath('commissions.data.0.amount', null);
    }

    public function test_commission_amounts_visible_after_w9_verification(): void
    {
        $admin = $this->makeUser(1);
        $user  = $this->makeUser(6);
        $lead  = Lead::factory()->create(['submission_status' => 'payment_received']);

        Commission::create([
            'user_id'    => $user->id,
            'lead_id'    => $lead->id,
            'amount'     => '10.00',
            'type'       => 'affiliate',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        // Admin verifies the W9
        W9Upload::create([
            'user_id'     => $user->id,
            'file_path'   => 'referrals/3-w9-20260423.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 1024,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        // Now amounts should be visible
        $response = $this->actingAs($user)->getJson('/api/commissions');

        $response->assertOk()
                 ->assertJsonPath('w9_verified', true)
                 ->assertJsonPath('commissions.data.0.amount', '10.00');
    }

    public function test_commission_summary_hides_amounts_before_verification(): void
    {
        $user = $this->makeUser(6);
        $lead = Lead::factory()->create(['submission_status' => 'payment_received']);

        Commission::create([
            'user_id'    => $user->id,
            'lead_id'    => $lead->id,
            'amount'     => '10.00',
            'type'       => 'affiliate',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/commissions/summary');

        $response->assertOk()
                 ->assertJsonPath('w9_verified', false)
                 ->assertJsonPath('total_earned', null)
                 ->assertJsonPath('count', 1); // count is always visible
    }

    public function test_commission_summary_shows_amounts_after_verification(): void
    {
        $admin = $this->makeUser(1);
        $user  = $this->makeUser(6);
        $lead  = Lead::factory()->create(['submission_status' => 'payment_received']);

        Commission::create([
            'user_id'    => $user->id,
            'lead_id'    => $lead->id,
            'amount'     => '10.00',
            'type'       => 'affiliate',
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        W9Upload::create([
            'user_id'     => $user->id,
            'file_path'   => 'referrals/3-w9-20260423.pdf',
            'file_name'   => 'w9.pdf',
            'file_size'   => 1024,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/commissions/summary');

        $response->assertOk()
                 ->assertJsonPath('w9_verified', true)
                 ->assertJsonPath('total_earned',  10)   // JSON encodes 10.0 as integer 10
                 ->assertJsonPath('total_accrued', 10)
                 ->assertJsonPath('total_paid',    0);
    }

    // ── User can upload multiple W9s (re-upload for corrections) ──────────────

    public function test_user_can_upload_multiple_w9s(): void
    {
        $user = $this->makeUser(6);

        $file1 = UploadedFile::fake()->create('w9-v1.pdf', 100, 'application/pdf');
        $file2 = UploadedFile::fake()->create('w9-v2.pdf', 200, 'application/pdf');

        $this->actingAs($user)->postJson('/api/w9', ['file' => $file1])->assertCreated();
        $this->actingAs($user)->postJson('/api/w9', ['file' => $file2])->assertCreated();

        $this->assertEquals(2, W9Upload::where('user_id', $user->id)->count());
    }

    public function test_show_returns_most_recent_upload(): void
    {
        $user = $this->makeUser(6);

        W9Upload::create(['user_id' => $user->id, 'file_path' => 'p1.pdf', 'file_name' => 'old.pdf', 'file_size' => 100]);
        // newest
        $latest = W9Upload::create(['user_id' => $user->id, 'file_path' => 'p2.pdf', 'file_name' => 'new.pdf', 'file_size' => 200]);

        $this->actingAs($user)->getJson('/api/w9')
             ->assertOk()
             ->assertJsonPath('w9.id', $latest->id)
             ->assertJsonPath('w9.file_name', 'new.pdf');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function seedRoles(): void
    {
        $levels = [
            0 => 'Super Admin',
            1 => 'Admin',
            2 => 'Staff',
            5 => 'Customer',
            6 => 'Affiliate',
            7 => 'Agent',
            8 => 'Planner',
        ];

        foreach ($levels as $level => $name) {
            UserRole::firstOrCreate(
                ['access_level' => $level],
                ['role_name'    => $name]
            );
        }
    }

    private function makeUser(int $accessLevel, array $extra = []): User
    {
        $role = UserRole::where('access_level', $accessLevel)->first();

        return User::factory()->create(array_merge([
            'role_id' => $role->id,
            'status'  => 1,
        ], $extra));
    }
}
