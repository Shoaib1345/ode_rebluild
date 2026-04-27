<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;

/**
 * Override artisan serve to default --no-reload on Windows.
 *
 * Laravel's serve command uses Symfony Process to spawn PHP's built-in
 * server. On Windows with WAMP, the file-watcher (pcntl / signals) is
 * not supported and causes "Failed to listen on 127.0.0.1:8000 (reason: ?)".
 * Defaulting noReload to true fixes this transparently.
 */
class ServeCommand extends BaseServeCommand
{
    public function handle(): int
    {
        // Force no-reload on Windows — safe to leave on all platforms
        if (PHP_OS_FAMILY === 'Windows') {
            $this->input->setOption('no-reload', true);
        }

        return parent::handle();
    }
}
