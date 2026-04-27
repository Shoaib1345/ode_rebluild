<?php

return [
    /*
    |--------------------------------------------------------------------------
    | DocuSign Configuration (§20.1)
    |--------------------------------------------------------------------------
    | JWT Grant auth — set these in .env.
    | For sandbox: base_path = https://demo.docusign.net/restapi
    | For production: base_path = https://www.docusign.net/restapi
    */

    'integrator_key'  => env('DOCUSIGN_INTEGRATOR_KEY', ''),
    'user_id'         => env('DOCUSIGN_USER_ID', ''),
    'account_id'      => env('DOCUSIGN_ACCOUNT_ID', ''),
    'private_key_path'=> env('DOCUSIGN_PRIVATE_KEY_PATH', storage_path('app/docusign-jwt.pem')),
    'base_path'       => env('DOCUSIGN_BASE_PATH', 'https://demo.docusign.net/restapi'),
    'oauth_base'      => env('DOCUSIGN_OAUTH_BASE', 'https://account-d.docusign.com'),
    'webhook_url'     => env('DOCUSIGN_WEBHOOK_URL', env('APP_URL') . '/api/webhooks/docusign'),

    /** Email subject template — {lead_number} is substituted at send time */
    'email_subject'   => env('DOCUSIGN_EMAIL_SUBJECT', 'Please sign your event insurance documents'),
];
