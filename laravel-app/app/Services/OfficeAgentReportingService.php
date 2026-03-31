<?php

namespace App\Services;

use App\Models\AuthEvent;
use App\Models\AuditLog;
use App\Models\OfficeAgentReport;
use App\Models\SecurityEvent;
use App\Models\TimeBoxing;
use Carbon\Carbon;

class OfficeAgentReportingService
{
    public function createAndMaybeSend(Carbon $from, Carbon $to, array $meta = []): OfficeAgentReport
    {
        $securitySummary = $this->buildSecuritySummary($from, $to);
        $activitySummary = $this->buildActivitySummary($from, $to);

        $msg = $this->formatTelegramMessage($from, $to, $securitySummary, $activitySummary);
        $messageHash = hash('sha256', $securitySummary . "\n\n" . $activitySummary);

        $report = OfficeAgentReport::query()->create([
            'from_at' => $from,
            'to_at' => $to,
            'security_summary' => $securitySummary,
            'activity_summary' => $activitySummary,
            'telegram_ok' => null,
            'telegram_sent_at' => null,
            'telegram_error' => null,
            'meta' => array_merge($meta, [
                'message_hash' => $messageHash,
            ]),
        ]);

        $send = (string) env('OFFICE_AGENT_TELEGRAM_ENABLED', '1');
        $enabled = $send !== '0' && $send !== 'false';

        if (! $enabled) {
            return $report;
        }

        $minIntervalSeconds = (int) env('OFFICE_AGENT_TELEGRAM_MIN_INTERVAL_SECONDS', 900);
        if ($minIntervalSeconds < 0) $minIntervalSeconds = 0;

        $onlyOnChangeEnv = strtolower((string) env('OFFICE_AGENT_TELEGRAM_ONLY_ON_CHANGE', '1'));
        $onlyOnChange = $onlyOnChangeEnv !== '0' && $onlyOnChangeEnv !== 'false';

        $lastSent = OfficeAgentReport::query()
            ->where('telegram_ok', true)
            ->whereNotNull('telegram_sent_at')
            ->orderByDesc('telegram_sent_at')
            ->first();

        if ($lastSent && $minIntervalSeconds > 0) {
            $delta = $lastSent->telegram_sent_at?->diffInSeconds(now()) ?? 0;
            if ($delta < $minIntervalSeconds) {
                $report->update([
                    'telegram_ok' => false,
                    'telegram_error' => 'Throttled (min interval ' . $minIntervalSeconds . 's)',
                ]);
                return $report->fresh();
            }
        }

        if ($onlyOnChange && $lastSent) {
            $lastHash = is_array($lastSent->meta) ? ($lastSent->meta['message_hash'] ?? null) : null;
            if ($lastHash && hash_equals((string) $lastHash, $messageHash)) {
                $report->update([
                    'telegram_ok' => false,
                    'telegram_error' => 'Skipped (no changes)',
                ]);
                return $report->fresh();
            }
        }
        $tg = app(TelegramService::class)->sendMessage($msg);

        $report->update([
            'telegram_ok' => (bool) ($tg['ok'] ?? false),
            'telegram_sent_at' => ($tg['ok'] ?? false) ? now() : null,
            'telegram_error' => ($tg['ok'] ?? false) ? null : (string) ($tg['error'] ?? 'Unknown error'),
        ]);

        return $report->fresh();
    }

    public function buildSecuritySummary(Carbon $from, Carbon $to): string
    {
        try {
            $q = SecurityEvent::query()->whereBetween('created_at', [$from, $to]);

            $total = (int) (clone $q)->count();
            $high = (int) (clone $q)->where('severity', 'high')->count();
            $medium = (int) (clone $q)->where('severity', 'medium')->count();
            $low = (int) (clone $q)->where('severity', 'low')->count();

            $topReasons = (clone $q)
                ->selectRaw('reason, COUNT(*) as c')
                ->groupBy('reason')
                ->orderByDesc('c')
                ->limit(3)
                ->get()
                ->map(fn ($r) => (string) $r->reason . ' (' . (int) $r->c . ')')
                ->values()
                ->all();

            $topIps = (clone $q)
                ->whereNotNull('ip')
                ->selectRaw('ip, COUNT(*) as c')
                ->groupBy('ip')
                ->orderByDesc('c')
                ->limit(3)
                ->get()
                ->map(fn ($r) => (string) $r->ip . ' (' . (int) $r->c . ')')
                ->values()
                ->all();

            $lines = [];
            $lines[] = 'Security events: total ' . $total . ' (high ' . $high . ', medium ' . $medium . ', low ' . $low . ')';
            if (count($topReasons)) $lines[] = 'Top reasons: ' . implode(' | ', $topReasons);
            if (count($topIps)) $lines[] = 'Top IPs: ' . implode(' | ', $topIps);

            $recentHigh = (clone $q)
                ->where('severity', 'high')
                ->orderByDesc('created_at')
                ->limit(3)
                ->get(['reason', 'ip', 'path', 'created_at'])
                ->map(function (SecurityEvent $e) {
                    $msg = (string) $e->reason;
                    if ($e->ip) $msg .= ' · ' . (string) $e->ip;
                    if ($e->path) $msg .= ' · ' . (string) $e->path;
                    return $msg;
                })
                ->values()
                ->all();
            if (count($recentHigh)) $lines[] = 'Recent high: ' . implode(' | ', $recentHigh);

            return implode("\n", $lines);
        } catch (\Throwable $e) {
            return 'Security events: unavailable (' . $e->getMessage() . ')';
        }
    }

    public function buildActivitySummary(Carbon $from, Carbon $to): string
    {
        try {
            $authQ = AuthEvent::query()->whereBetween('created_at', [$from, $to]);
            $auditQ = AuditLog::query()->whereBetween('created_at', [$from, $to]);

            $logins = (int) (clone $authQ)->where('type', 'login')->count();
            $failed = (int) (clone $authQ)->where('type', 'failed')->count();
            $logouts = (int) (clone $authQ)->where('type', 'logout')->count();

            $tbActions = ['create', 'update', 'delete', 'import'];
            $timeBoxingChanges = (int) (clone $auditQ)
                ->where('model_type', 'App\\Models\\TimeBoxing')
                ->whereIn('action', $tbActions)
                ->count();

            $recentTimeBoxing = (clone $auditQ)
                ->where('model_type', 'App\\Models\\TimeBoxing')
                ->whereIn('action', $tbActions)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['action', 'after', 'before', 'model_id', 'created_at'])
                ->map(function (AuditLog $a) {
                    $no = null;
                    if (is_array($a->after) && array_key_exists('no', $a->after)) $no = $a->after['no'];
                    if ($no === null && is_array($a->before) && array_key_exists('no', $a->before)) $no = $a->before['no'];
                    $label = strtoupper((string) $a->action);
                    if ($no !== null) $label .= ' #' . (string) $no;
                    return $label;
                })
                ->values()
                ->all();

            $lastLogins = (clone $authQ)
                ->where('type', 'login')
                ->orderByDesc('created_at')
                ->limit(3)
                ->get(['email', 'ip', 'created_at'])
                ->map(fn ($e) => (string) ($e->email ?: '-') . ' @ ' . (string) ($e->ip ?: '-') . ' (' . $e->created_at?->toISOString() . ')')
                ->values()
                ->all();

            $lines = [];
            $lines[] = 'Auth: login ' . $logins . ', failed ' . $failed . ', logout ' . $logouts;
            if (count($lastLogins)) $lines[] = 'Last logins: ' . implode(' | ', $lastLogins);
            $lines[] = 'Audit: Time Boxing changes ' . $timeBoxingChanges;
            if (count($recentTimeBoxing)) $lines[] = 'Recent TimeBoxing: ' . implode(' | ', $recentTimeBoxing);

            $lines[] = $this->buildTimeBoxingSnapshot();

            return implode("\n", $lines);
        } catch (\Throwable $e) {
            return 'Activity: unavailable (' . $e->getMessage() . ')';
        }
    }

    private function buildTimeBoxingSnapshot(): string
    {
        try {
            $userId = (int) env('OFFICE_AGENT_REPORT_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1));
            $q = TimeBoxing::query()->where('user_id', $userId);

            $total = (int) (clone $q)->count();
            $completed = (int) (clone $q)->where('status', 'Completed')->count();
            $active = $total - $completed;

            $dueSoon = (clone $q)
                ->whereNotNull('due_date')
                ->where('status', '!=', 'Completed')
                ->orderBy('due_date')
                ->limit(3)
                ->get(['no', 'type', 'priority', 'due_date'])
                ->map(function (TimeBoxing $t) {
                    $s = '#' . (string) $t->no;
                    if ($t->type) $s .= ' ' . (string) $t->type;
                    if ($t->priority) $s .= ' ' . (string) $t->priority;
                    if ($t->due_date) $s .= ' due ' . (string) $t->due_date;
                    return $s;
                })
                ->values()
                ->all();

            $line = 'TimeBoxing snapshot (user_id ' . $userId . '): total ' . $total . ' (active ' . $active . ', completed ' . $completed . ')';
            if (count($dueSoon)) $line .= "\n" . 'Due soon: ' . implode(' | ', $dueSoon);
            return $line;
        } catch (\Throwable $e) {
            return 'TimeBoxing snapshot: unavailable (' . $e->getMessage() . ')';
        }
    }

    private function formatTelegramMessage(Carbon $from, Carbon $to, string $securitySummary, string $activitySummary): string
    {
        $title = 'Office Agent Report';
        $range = $from->toISOString() . ' → ' . $to->toISOString();
        return $title . "\n" . $range . "\n\n" . $securitySummary . "\n\n" . $activitySummary;
    }
}
