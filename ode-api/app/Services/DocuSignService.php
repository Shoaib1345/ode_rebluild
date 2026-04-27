<?php

namespace App\Services;

use App\Models\Lead;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * DocuSign JWT-grant integration (§20).
 *
 * Credentials (from ode_new):
 *   Integrator Key: ae96c443-513c-48b1-b58e-bdd2091b5d9a
 *   User ID:        4ce2bd70-f928-46e8-86a3-a8411a0f0aa2
 *
 * JWT Grant flow:
 *   1. Build + sign a JWT with the RSA private key (RS256).
 *   2. POST to {oauth_base}/oauth/token → access_token (1 hr TTL).
 *   3. If DOCUSIGN_ACCOUNT_ID is blank, call /oauth/userinfo to get it.
 *   4. Use Bearer token for all Envelopes API calls.
 *
 * First-time setup (one-time, per account):
 *   1. Log in to https://admindemo.docusign.com → Apps & Keys.
 *   2. Click your integration key (ae96c443-...).
 *   3. Under "RSA Keypairs" click "Add RSA Keypair".
 *   4. Paste the contents of storage/app/docusign-jwt-public.pem.
 *   5. Visit the consent URL to grant the app impersonation rights:
 *      https://account-d.docusign.com/oauth/auth?response_type=code
 *        &scope=signature%20impersonation
 *        &client_id=ae96c443-513c-48b1-b58e-bdd2091b5d9a
 *        &redirect_uri=https://www.docusign.com
 */
class DocuSignService
{
    // ── Token cache (request-lifetime) ───────────────────────────────────────

    private ?string $cachedToken   = null;
    private ?string $cachedAccount = null;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Send an envelope to the lead's insured email for e-signature.
     *
     * Returns:  ['envelope_id' => string, 'status' => 'sent']
     *
     * @throws RuntimeException on API failure
     */
    public function sendEnvelope(Lead $lead): array
    {
        $token     = $this->getAccessToken();
        $accountId = $this->getAccountId($token);
        $baseUrl   = config('docusign.base_path');

        $signerName  = trim(
            ($lead->ins_first_name ?? $lead->first_name ?? '') . ' ' .
            ($lead->ins_last_name  ?? $lead->last_name  ?? '')
        );
        $signerEmail = $lead->email ?? '';

        if (! $signerEmail) {
            throw new RuntimeException('Lead has no email address for DocuSign.');
        }

        $envelope = [
            'emailSubject' => config('docusign.email_subject') . ' — Lead #' . $lead->id,
            'documents'    => [
                [
                    'documentBase64' => $this->getPolicyDocumentBase64($lead),
                    'name'           => 'Event Insurance Policy',
                    'fileExtension'  => 'pdf',
                    'documentId'     => '1',
                ],
            ],
            'recipients' => [
                'signers' => [
                    [
                        'email'        => $signerEmail,
                        'name'         => $signerName ?: $signerEmail,
                        'recipientId'  => '1',
                        'routingOrder' => '1',
                        'tabs'         => [
                            'signHereTabs' => [
                                [
                                    'anchorString'  => 'Signature of Applicant',
                                    'anchorUnits'   => 'inches',
                                    'anchorXOffset' => '0.05',
                                    'anchorYOffset' => '-0.2',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            // Webhook notification — mirrors ode_new event list
            'eventNotification' => $this->buildEventNotification(),
            'status' => 'sent',
        ];

        $response = Http::withToken($token)
            ->post("{$baseUrl}/v2.1/accounts/{$accountId}/envelopes", $envelope);

        if (! $response->successful()) {
            Log::error('DocuSign sendEnvelope failed', [
                'lead_id' => $lead->id,
                'status'  => $response->status(),
                'body'    => $response->body(),
            ]);
            throw new RuntimeException('DocuSign envelope creation failed: ' . $response->body());
        }

        return [
            'envelope_id' => $response->json('envelopeId'),
            'status'      => $response->json('status', 'sent'),
        ];
    }

    /**
     * Resend an existing envelope to its recipients.
     */
    public function resendEnvelope(string $envelopeId): void
    {
        $token     = $this->getAccessToken();
        $accountId = $this->getAccountId($token);
        $baseUrl   = config('docusign.base_path');

        $response = Http::withToken($token)
            ->put("{$baseUrl}/v2.1/accounts/{$accountId}/envelopes/{$envelopeId}", [
                'resendEnvelope' => true,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('DocuSign resend failed: ' . $response->body());
        }
    }

    /**
     * Poll DocuSign for the current status of an envelope.
     *
     * Returns one of: sent | delivered | completed | declined | voided
     */
    public function getEnvelopeStatus(string $envelopeId): string
    {
        $token     = $this->getAccessToken();
        $accountId = $this->getAccountId($token);
        $baseUrl   = config('docusign.base_path');

        $response = Http::withToken($token)
            ->get("{$baseUrl}/v2.1/accounts/{$accountId}/envelopes/{$envelopeId}");

        if (! $response->successful()) {
            throw new RuntimeException('DocuSign getEnvelope failed: ' . $response->body());
        }

        return $response->json('status', 'sent');
    }

    // ── JWT Grant auth ────────────────────────────────────────────────────────

    /**
     * Obtain (or return cached) OAuth access token via JWT grant.
     *
     * @throws RuntimeException when credentials are missing or auth fails
     */
    public function getAccessToken(): string
    {
        if ($this->cachedToken) {
            return $this->cachedToken;
        }

        $jwt  = $this->buildJwt();
        $base = rtrim(config('docusign.oauth_base'), '/');

        $response = Http::asForm()->post("{$base}/oauth/token", [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('DocuSign JWT auth failed: ' . $response->body());
        }

        $this->cachedToken = $response->json('access_token');

        return $this->cachedToken;
    }

    /**
     * Get the account ID — from config if set, otherwise auto-fetch from /oauth/userinfo.
     *
     * Auto-fetch is the same approach the old ode_new used via getLoginAccounts()[0].
     */
    public function getAccountId(string $token): string
    {
        if ($this->cachedAccount) {
            return $this->cachedAccount;
        }

        $configured = config('docusign.account_id');
        if ($configured) {
            $this->cachedAccount = $configured;
            return $configured;
        }

        // Auto-fetch via /oauth/userinfo (mirrors ode_new login()->getLoginAccounts()[0])
        $base     = rtrim(config('docusign.oauth_base'), '/');
        $response = Http::withToken($token)->get("{$base}/oauth/userinfo");

        if (! $response->successful()) {
            throw new RuntimeException('DocuSign userinfo fetch failed: ' . $response->body());
        }

        $accounts = $response->json('accounts', []);
        if (empty($accounts)) {
            throw new RuntimeException('DocuSign: no accounts found for this user.');
        }

        // Pick the default account (is_default=true) or fall back to first
        $account = collect($accounts)->firstWhere('is_default', true) ?? $accounts[0];
        $this->cachedAccount = $account['account_id'];

        Log::info('DocuSign account ID auto-fetched: ' . $this->cachedAccount);

        return $this->cachedAccount;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Build and sign a JWT for DocuSign JWT Grant (RS256).
     */
    private function buildJwt(): string
    {
        $integratorKey = config('docusign.integrator_key');
        $userId        = config('docusign.user_id');
        $oauthBase     = parse_url(config('docusign.oauth_base'), PHP_URL_HOST);
        $keyPath       = config('docusign.private_key_path');

        if (! $integratorKey || ! $userId) {
            throw new RuntimeException('DocuSign credentials (DOCUSIGN_INTEGRATOR_KEY / DOCUSIGN_USER_ID) are not configured.');
        }

        if (! file_exists($keyPath)) {
            throw new RuntimeException("DocuSign private key not found at: {$keyPath}. Run: php gen-docusign-key.php");
        }

        $now = time();

        $header  = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = $this->base64UrlEncode(json_encode([
            'iss'   => $integratorKey,
            'sub'   => $userId,
            'aud'   => $oauthBase,
            'iat'   => $now,
            'exp'   => $now + 3600,
            'scope' => 'signature impersonation',
        ]));

        $signing    = "{$header}.{$payload}";
        $privateKey = openssl_pkey_get_private(file_get_contents($keyPath));

        if (! $privateKey) {
            throw new RuntimeException('Could not load DocuSign private key from: ' . $keyPath);
        }

        openssl_sign($signing, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        return $signing . '.' . $this->base64UrlEncode($signature);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Build the event notification config to mirror ode_new webhook setup.
     * DocuSign will POST to /api/webhooks/docusign on every status change.
     */
    private function buildEventNotification(): array
    {
        return [
            'url'                            => config('docusign.webhook_url'),
            'loggingEnabled'                 => 'true',
            'requireAcknowledgment'          => 'true',
            'useSoapInterface'               => 'false',
            'includeCertificateWithSoap'     => 'false',
            'signMessageWithX509Cert'        => 'false',
            'includeDocuments'               => 'true',
            'includeEnvelopeVoidReason'      => 'true',
            'includeTimeZone'                => 'true',
            'includeSenderAccountAsCustomField' => 'true',
            'includeDocumentFields'          => 'true',
            'includeCertificateOfCompletion' => 'true',
            'envelopeEvents' => [
                ['envelopeEventStatusCode' => 'sent'],
                ['envelopeEventStatusCode' => 'delivered'],
                ['envelopeEventStatusCode' => 'completed'],
                ['envelopeEventStatusCode' => 'declined'],
                ['envelopeEventStatusCode' => 'voided'],
            ],
            'recipientEvents' => [
                ['recipientEventStatusCode' => 'Sent'],
                ['recipientEventStatusCode' => 'Delivered'],
                ['recipientEventStatusCode' => 'Completed'],
                ['recipientEventStatusCode' => 'Declined'],
                ['recipientEventStatusCode' => 'AuthenticationFailed'],
                ['recipientEventStatusCode' => 'AutoResponded'],
            ],
        ];
    }

    /**
     * Get the policy PDF as base64.
     *
     * Priority:
     *   1. Use actual stored PDF from policy_pdf_path (if available)
     *   2. Render on-the-fly via PdfService (if lead has enough data)
     *   3. Fall back to a minimal placeholder PDF stub
     */
    private function getPolicyDocumentBase64(Lead $lead): string
    {
        // 1. Use stored PDF
        if ($lead->policy_pdf_path) {
            $disk = \Illuminate\Support\Facades\Storage::disk(
                config('filesystems.default', 'local')
            );
            if ($disk->exists($lead->policy_pdf_path)) {
                return base64_encode($disk->get($lead->policy_pdf_path));
            }
        }

        // 2. Render on-the-fly
        try {
            $pdfService = app(PdfService::class);
            $path = $pdfService->generatePolicy($lead);
            $lead->update(['policy_pdf_path' => $path]);
            $bytes = \Illuminate\Support\Facades\Storage::disk(
                config('filesystems.default', 'local')
            )->get($path);
            return base64_encode($bytes);
        } catch (\Throwable $e) {
            Log::warning('DocuSign: on-the-fly PDF render failed, using stub. ' . $e->getMessage());
        }

        // 3. Minimal PDF stub — contains "Signature of Applicant" anchor for the tab
        $stub = '%PDF-1.4 1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj '
              . '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj '
              . '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]'
              . '/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj '
              . '4 0 obj<</Length 80>>stream BT /F1 12 Tf 72 700 Td '
              . '(Event Insurance Policy - Lead #' . $lead->id . ') Tj '
              . '72 100 Td (Signature of Applicant) Tj ET endstream endobj '
              . '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj '
              . 'xref 0 6 trailer<</Size 6/Root 1 0 R>>startxref 0 %%EOF';

        return base64_encode($stub);
    }
}
