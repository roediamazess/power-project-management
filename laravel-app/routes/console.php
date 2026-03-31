<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\OfficeAgentReportingService;
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

Artisan::command('office-agent:report {--minutes=15} {--dry-run}', function () {
    $minutes = (int) ($this->option('minutes') ?? 15);
    if ($minutes < 1) $minutes = 1;
    if ($minutes > 1440) $minutes = 1440;

    $to = now();
    $from = $to->copy()->subMinutes($minutes);

    $report = app(OfficeAgentReportingService::class)->createAndMaybeSend($from, $to, [
        'trigger' => 'console',
        'minutes' => $minutes,
    ]);

    $this->info('Report created: ' . (string) $report->id);
    $this->line('telegram_ok=' . json_encode($report->telegram_ok));
    if ($report->telegram_error) {
        $this->line('telegram_error=' . $report->telegram_error);
    }

    if ($this->option('dry-run')) {
        $this->line('---');
        $this->line((string) $report->security_summary);
        $this->line('---');
        $this->line((string) $report->activity_summary);
    }
})->purpose('Kirim ringkasan Office Agent ke Telegram');

Artisan::command('office-agent:watch {--interval=60}', function () {
    $interval = (int) ($this->option('interval') ?? 900);
    if ($interval < 15) $interval = 15;
    if ($interval > 3600) $interval = 3600;

    $this->info('Office Agent watch started. interval=' . $interval . 's');
    while (true) {
        try {
            Artisan::call('office-agent:report', [
                '--minutes' => (int) max(1, (int) floor($interval / 60)),
            ]);
            $this->line(trim((string) Artisan::output()));
        } catch (\Throwable $e) {
            $this->error('Error: ' . $e->getMessage());
        }

        sleep($interval);
    }
})->purpose('Loop reporter Office Agent (untuk container worker)');
