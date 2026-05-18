<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stripe' => [
        'key'    => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | PDFtk — Certificate of Insurance PDF filling
    |--------------------------------------------------------------------------
    | PDFtk is a system binary (not a PHP package) that fills the pre-signed
    | COI PDF form template with lead data.
    |
    | Deployment:
    |   Ubuntu/Debian:  sudo apt-get install pdftk
    |   Ubuntu 20.04+:  sudo apt-get install pdftk-java
    |                   (then set PDFTK_PATH=/usr/bin/pdftk-java)
    |   Docker:         RUN apt-get install -y pdftk
    |   Windows (dev):  install PDFtk Free from https://www.pdflabs.com
    |
    | Leave PDFTK_PATH blank to use the OS default:
    |   Windows → C:\Program Files (x86)\PDFtk\bin\pdftk.exe
    |   Linux   → /usr/bin/pdftk
    */
    'pdftk' => [
        'path' => env('PDFTK_PATH'),  // leave blank to use OS default
    ],

];
