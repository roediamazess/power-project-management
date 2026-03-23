<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\PartnersXlsxImportService;
use App\Services\TimeBoxingXlsxImportService;

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

Artisan::command('time-boxing:import {path} {--no-create-types}', function (string $path) {
    $createMissingTypes = ! $this->option('no-create-types');
    $res = app(TimeBoxingXlsxImportService::class)->import($path, $createMissingTypes);

    $this->info('Import selesai.');
    $this->line('created=' . ($res['created'] ?? 0));
    $this->line('updated=' . ($res['updated'] ?? 0));
    $this->line('skipped=' . ($res['skipped'] ?? 0));
    $this->line('partners_not_found=' . ($res['partners_not_found'] ?? 0));
    $this->line('types_created=' . ($res['types_created'] ?? 0));
    if (($res['partners_not_found'] ?? 0) > 0) {
        $this->line('');
        $this->line('missing_partner_rows=' . json_encode($res['missing_partner_rows'] ?? [], JSON_UNESCAPED_UNICODE));
    }
    if (($res['skipped'] ?? 0) > 0) {
        $this->line('');
        $this->line('skipped_rows=' . json_encode($res['skipped_rows'] ?? [], JSON_UNESCAPED_UNICODE));
    }
})->purpose('Import data Time Boxing dari file XLSX');
