<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Env;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        // Force-reset Laravel's static Env cache before every test so
        // phpunit.xml's DB_CONNECTION=sqlite takes effect cleanly.
        putenv('DB_CONNECTION=sqlite');
        putenv('DB_DATABASE=:memory:');
        $_ENV['DB_CONNECTION']  = 'sqlite';
        $_ENV['DB_DATABASE']    = ':memory:';
        $_SERVER['DB_CONNECTION'] = 'sqlite';
        $_SERVER['DB_DATABASE']   = ':memory:';

        // Null out the cached repository so it rebuilds with our values above
        Env::enablePutenv(); // internally sets $repository = null

        parent::setUp();
    }
}