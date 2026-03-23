<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\PartnersXlsxImportService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('partners:import {path} {--no-create-options}', function (string $path) {
    $createMissingOptions = ! $this->option('no-create-options');
    $res = app(PartnersXlsxImportService::class)->import($path, $createMissingOptions);

    $this->info('Import selesai.');
    $this->line('created=' . ($res['created'] ?? 0));
    $this->line('updated=' . ($res['updated'] ?? 0));
    $this->line('skipped=' . ($res['skipped'] ?? 0));
    $this->line('options_created=' . ($res['options_created'] ?? 0));
})->purpose('Import data Partners dari file XLSX');
