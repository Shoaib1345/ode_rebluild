<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for Admin CMS Pages CRUD.
 *
 * Covers:
 *   - Access control: unauthenticated / non-admin blocked
 *   - Index: list pages, search filter, status filter
 *   - Show: single page, 404 for missing
 *   - Store: create, validation (duplicate slug, invalid slug format)
 *   - Update: edit fields
 *   - Destroy: delete
 *   - Reorder: bulk sort_order update
 */
class AdminPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    // ── Access control ────────────────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_pages(): void
    {
        $this->getJson('/api/admin/pages')->assertUnauthorized();
    }

    public function test_non_admin_cannot_access_pages(): void
    {
        $customer = $this->makeUser(5);
        $this->actingAs($customer)->getJson('/api/admin/pages')->assertForbidden();
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_pages(): void
    {
        $admin = $this->makeUser(1);
        Page::factory()->count(3)->create();

        $this->actingAs($admin)->getJson('/api/admin/pages')
             ->assertOk()
             ->assertJsonCount(3);
    }

    public function test_index_returns_required_fields(): void
    {
        $admin = $this->makeUser(1);
        Page::factory()->create(['title' => 'About Us', 'slug' => 'about-us']);

        $response = $this->actingAs($admin)->getJson('/api/admin/pages')->assertOk();

        $this->assertEquals('About Us', $response->json('0.title'));
        $this->assertEquals('about-us', $response->json('0.slug'));
    }

    public function test_index_filters_by_search(): void
    {
        $admin = $this->makeUser(1);
        Page::factory()->create(['title' => 'About Us', 'slug' => 'about-us']);
        Page::factory()->create(['title' => 'Contact', 'slug' => 'contact']);

        $response = $this->actingAs($admin)->getJson('/api/admin/pages?search=About')->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertEquals('About Us', $response->json('0.title'));
    }

    public function test_index_filters_by_status(): void
    {
        $admin = $this->makeUser(1);
        Page::factory()->create(['status' => 1]);
        Page::factory()->inactive()->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/pages?status=0')->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertEquals(0, $response->json('0.status'));
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_admin_can_view_single_page(): void
    {
        $admin = $this->makeUser(1);
        $page  = Page::factory()->create(['slug' => 'about-us']);

        $this->actingAs($admin)->getJson("/api/admin/pages/{$page->id}")
             ->assertOk()
             ->assertJsonPath('slug', 'about-us')
             ->assertJsonStructure(['id', 'title', 'slug', 'editor_content', 'status', 'add_to_menu']);
    }

    public function test_show_returns_404_for_missing_page(): void
    {
        $admin = $this->makeUser(1);
        $this->actingAs($admin)->getJson('/api/admin/pages/99999')->assertNotFound();
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function test_admin_can_create_page(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->postJson('/api/admin/pages', [
            'title'          => 'About Us',
            'slug'           => 'about-us',
            'editor_content' => '<p>Welcome to One Day Event.</p>',
            'add_to_menu'    => true,
        ])
             ->assertCreated()
             ->assertJsonPath('slug', 'about-us')
             ->assertJsonPath('status', 1);

        $this->assertDatabaseHas('pages', ['slug' => 'about-us']);
    }

    public function test_store_rejects_duplicate_slug(): void
    {
        $admin = $this->makeUser(1);
        Page::factory()->create(['slug' => 'about-us']);

        $this->actingAs($admin)->postJson('/api/admin/pages', [
            'title' => 'Another About',
            'slug'  => 'about-us',
        ])->assertUnprocessable();
    }

    public function test_store_rejects_invalid_slug_format(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->postJson('/api/admin/pages', [
            'title' => 'About Us',
            'slug'  => 'About Us!', // spaces + uppercase + special chars
        ])->assertUnprocessable();
    }

    public function test_store_requires_title_and_slug(): void
    {
        $admin = $this->makeUser(1);

        $this->actingAs($admin)->postJson('/api/admin/pages', [])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['title', 'slug']);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_admin_can_update_page(): void
    {
        $admin = $this->makeUser(1);
        $page  = Page::factory()->create(['title' => 'Old Title']);

        $this->actingAs($admin)->patchJson("/api/admin/pages/{$page->id}", [
            'title'  => 'New Title',
            'status' => 0,
        ])
             ->assertOk()
             ->assertJsonPath('title', 'New Title')
             ->assertJsonPath('status', 0);
    }

    public function test_update_rejects_duplicate_slug_on_another_page(): void
    {
        $admin  = $this->makeUser(1);
        $pageA  = Page::factory()->create(['slug' => 'page-a']);
        $pageB  = Page::factory()->create(['slug' => 'page-b']);

        $this->actingAs($admin)->patchJson("/api/admin/pages/{$pageB->id}", [
            'slug' => 'page-a',
        ])->assertUnprocessable();
    }

    public function test_update_allows_same_slug_on_same_page(): void
    {
        $admin = $this->makeUser(1);
        $page  = Page::factory()->create(['slug' => 'my-page']);

        $this->actingAs($admin)->patchJson("/api/admin/pages/{$page->id}", [
            'slug' => 'my-page', // same slug — should be fine
        ])->assertOk();
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function test_admin_can_delete_page(): void
    {
        $admin = $this->makeUser(1);
        $page  = Page::factory()->create();

        $this->actingAs($admin)->deleteJson("/api/admin/pages/{$page->id}")
             ->assertOk()
             ->assertJsonPath('message', 'Page deleted.');

        $this->assertDatabaseMissing('pages', ['id' => $page->id]);
    }

    // ── Reorder ───────────────────────────────────────────────────────────────

    public function test_admin_can_reorder_pages(): void
    {
        $admin = $this->makeUser(1);
        $p1    = Page::factory()->create(['sort_order' => 0]);
        $p2    = Page::factory()->create(['sort_order' => 1]);

        $this->actingAs($admin)->postJson('/api/admin/pages/reorder', [
            'order' => [
                ['id' => $p1->id, 'sort_order' => 5],
                ['id' => $p2->id, 'sort_order' => 2],
            ],
        ])->assertOk()->assertJsonPath('message', 'Order updated.');

        $this->assertDatabaseHas('pages', ['id' => $p1->id, 'sort_order' => 5]);
        $this->assertDatabaseHas('pages', ['id' => $p2->id, 'sort_order' => 2]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
