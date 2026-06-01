<?php

namespace Tests\Feature;

use App\Services\CertificateService;
use Tests\TestCase;

/**
 * Named additional insureds are listed on the certificate's
 * description-of-operations block.
 */
class CertificateAdditionalInsuredTest extends TestCase
{
    private function service(): CertificateService
    {
        return app(CertificateService::class);
    }

    public function test_formats_named_additional_insureds(): void
    {
        $line = $this->service()->formatAdditionalInsureds([
            ['name' => 'Acme Venue',  'relation' => 'Venue'],
            ['name' => 'Bob Caterer', 'relation' => ''],
        ]);

        $this->assertSame('Additional Insureds: Acme Venue (Venue), Bob Caterer.', $line);
    }

    public function test_skips_blank_names(): void
    {
        $line = $this->service()->formatAdditionalInsureds([
            ['name' => '',           'relation' => 'Venue'],
            ['name' => 'Real Party', 'relation' => 'Sponsor'],
        ]);

        $this->assertSame('Additional Insureds: Real Party (Sponsor).', $line);
    }

    public function test_empty_when_none(): void
    {
        $this->assertSame('', $this->service()->formatAdditionalInsureds(null));
        $this->assertSame('', $this->service()->formatAdditionalInsureds([]));
    }
}
