<?php

namespace Tests\Feature;

use App\Jobs\GenerateCoiPdfJob;
use App\Jobs\GeneratePolicyPdfJob;
use App\Jobs\GenerateReceiptPdfJob;
use App\Models\Lead;
use App\Models\User;
use App\Models\UserRole;
use App\Services\PdfService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

/**
 * Feature tests for Chunk 42 — PDF Generation.
 *
 * PdfService is mocked so no real DomPDF rendering happens in tests.
 * Storage::fake() captures file writes without touching the real disk.
 *
 * Covers:
 *   - Access control: unauthenticated / non-admin blocked
 *   - GET  /admin/leads/{id}/pdf-status  — returns current paths
 *   - POST /admin/leads/{id}/generate-pdf — dispatches policy job (sync queue)
 *   - POST /admin/leads/{id}/generate-pdf/coi — dispatches COI job
 *   - GET  /api/files/{category}/{id}  — serves PDF or 404
 *   - File job unit: GeneratePolicyPdfJob stores file + chains receipt job
 */
class PdfGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
        Storage::fake('local');
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_generate_pdf(): void
    {
        $lead = Lead::factory()->create();
        $this->postJson("/api/admin/leads/{$lead->id}/generate-pdf")->assertUnauthorized();
    }

    public function test_non_admin_cannot_generate_pdf(): void
    {
        $customer = $this->makeUser(5);
        $lead     = Lead::factory()->create();

        $this->actingAs($customer)
             ->postJson("/api/admin/leads/{$lead->id}/generate-pdf")
             ->assertForbidden();
    }

    // ── PDF status ────────────────────────────────────────────────────────────

    public function test_pdf_status_returns_null_paths_when_no_pdfs(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        $this->actingAs($admin)
             ->getJson("/api/admin/leads/{$lead->id}/pdf-status")
             ->assertOk()
             ->assertJson([
                 'policy_pdf_path'  => null,
                 'receipt_pdf_path' => null,
                 'coi_pdf_path'     => null,
             ]);
    }

    public function test_pdf_status_returns_existing_paths(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create([
            'policy_pdf_path' => "policies/{$this->faker()->numberBetween(1,99)}.pdf",
        ]);

        $response = $this->actingAs($admin)
                         ->getJson("/api/admin/leads/{$lead->id}/pdf-status")
                         ->assertOk();

        $this->assertNotNull($response->json('policy_pdf_path'));
    }

    // ── Generate PDF trigger ──────────────────────────────────────────────────

    public function test_admin_can_trigger_policy_pdf_generation(): void
    {
        Queue::fake();
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        $this->actingAs($admin)
             ->postJson("/api/admin/leads/{$lead->id}/generate-pdf")
             ->assertOk()
             ->assertJsonPath('message', 'PDF generation queued. Policy and receipt will be ready shortly.');

        Queue::assertPushed(GeneratePolicyPdfJob::class, fn ($job) => $job->leadId === $lead->id);
    }

    public function test_admin_can_trigger_coi_generation(): void
    {
        Queue::fake();
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        $this->actingAs($admin)
             ->postJson("/api/admin/leads/{$lead->id}/generate-pdf/coi")
             ->assertOk()
             ->assertJsonPath('message', 'COI generation queued.');

        Queue::assertPushed(GenerateCoiPdfJob::class, fn ($job) => $job->leadId === $lead->id);
    }

    public function test_generate_returns_404_for_missing_lead(): void
    {
        $admin = $this->makeUser(1);
        $this->actingAs($admin)
             ->postJson('/api/admin/leads/99999/generate-pdf')
             ->assertNotFound();
    }

    // ── File download ─────────────────────────────────────────────────────────

    public function test_authenticated_user_can_download_existing_pdf(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create(['policy_pdf_path' => 'policies/1.pdf']);

        // Fake the file in storage
        Storage::disk('local')->put('policies/1.pdf', '%PDF stub content');

        $response = $this->actingAs($admin)
                         ->get("/api/files/policies/{$lead->id}");

        // Streams a response (200) for local disk
        $response->assertOk();
    }

    public function test_download_returns_404_when_pdf_not_generated(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create(['policy_pdf_path' => null]);

        $this->actingAs($admin)
             ->getJson("/api/files/policies/{$lead->id}")
             ->assertNotFound();
    }

    public function test_download_returns_404_for_invalid_category(): void
    {
        $admin = $this->makeUser(1);
        $lead  = Lead::factory()->create();

        $this->actingAs($admin)
             ->getJson("/api/files/unknown/{$lead->id}")
             ->assertNotFound();
    }

    public function test_unauthenticated_cannot_download_pdf(): void
    {
        $lead = Lead::factory()->create(['policy_pdf_path' => 'policies/1.pdf']);
        $this->getJson("/api/files/policies/{$lead->id}")->assertUnauthorized();
    }

    // ── Job unit tests ────────────────────────────────────────────────────────

    public function test_generate_policy_job_stores_pdf_and_updates_lead(): void
    {
        $lead = Lead::factory()->create();

        // Mock PdfService so no real DomPDF rendering occurs
        $mock = Mockery::mock(PdfService::class);
        $mock->shouldReceive('generatePolicy')
             ->once()
             ->andReturn("policies/{$lead->id}.pdf");
        $this->app->instance(PdfService::class, $mock);

        // Also mock receipt job chaining by faking the queue
        Queue::fake([GenerateReceiptPdfJob::class]);

        $job = new GeneratePolicyPdfJob($lead->id);
        $job->handle($mock);

        $this->assertDatabaseHas('leads', [
            'id'              => $lead->id,
            'policy_pdf_path' => "policies/{$lead->id}.pdf",
        ]);

        Queue::assertPushed(GenerateReceiptPdfJob::class);
    }

    public function test_generate_receipt_job_stores_pdf_and_updates_lead(): void
    {
        $lead = Lead::factory()->create();

        $mock = Mockery::mock(PdfService::class);
        $mock->shouldReceive('generateReceipt')
             ->once()
             ->andReturn("receipts/{$lead->id}-receipt.pdf");
        $this->app->instance(PdfService::class, $mock);

        $job = new GenerateReceiptPdfJob($lead->id);
        $job->handle($mock);

        $this->assertDatabaseHas('leads', [
            'id'              => $lead->id,
            'receipt_pdf_path' => "receipts/{$lead->id}-receipt.pdf",
        ]);
    }

    public function test_generate_coi_job_stores_pdf_and_updates_lead(): void
    {
        $lead = Lead::factory()->create();

        $mock = Mockery::mock(PdfService::class);
        $mock->shouldReceive('generateCoi')
             ->once()
             ->andReturn("cois/filled_claims/{$lead->id}-coi.pdf");
        $this->app->instance(PdfService::class, $mock);

        $job = new GenerateCoiPdfJob($lead->id);
        $job->handle($mock);

        $this->assertDatabaseHas('leads', [
            'id'          => $lead->id,
            'coi_pdf_path' => "cois/filled_claims/{$lead->id}-coi.pdf",
        ]);
    }

    public function test_job_skips_gracefully_for_missing_lead(): void
    {
        $mock = Mockery::mock(PdfService::class);
        $mock->shouldNotReceive('generatePolicy');
        $this->app->instance(PdfService::class, $mock);

        $job = new GeneratePolicyPdfJob(99999);
        $job->handle($mock); // should not throw
        $this->assertTrue(true);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function faker(): \Faker\Generator
    {
        return \Faker\Factory::create();
    }

    private function seedRoles(): void
    {
        foreach ([
            0 => 'Super Admin', 1 => 'Admin', 2 => 'Staff',
            5 => 'Customer', 6 => 'Affiliate', 7 => 'Agent', 8 => 'Planner',
        ] as $level => $name) {
            UserRole::firstOrCreate(['access_level' => $level], ['role_name' => $name]);
        }
    }

    private function makeUser(int $level): User
    {
        $role = UserRole::where('access_level', $level)->first();
        return User::factory()->create(['role_id' => $role->id, 'status' => 1]);
    }
}
