<?php

namespace App\Http\Controllers;

use App\Models\TimeBoxing;
use App\Models\TimeBoxingSetupOption;
use App\Models\SecurityEvent;
use App\Models\AuthEvent;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\OfficeAgentReportingService;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OfficeAgentController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::location('/agent-working-space/');
    }

    public function uploadSpriteSheet(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:png', 'max:10240'],
        ]);

        /** @var UploadedFile $file */
        $file = $data['file'];

        $dir = public_path('office-agent/sprites');
        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $file->move($dir, 'sheet.png');

        return response()->json([
            'ok' => true,
            'path' => '/office-agent/sprites/sheet.png',
        ]);
    }

    public function storeRun(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:8000'],
        ]);

        $userId = (int) $request->user()->id;
        $runId = (string) Str::uuid();

        Cache::put($this->runCacheKey($userId, $runId), [
            'prompt' => (string) $data['prompt'],
            'created_at' => now()->toISOString(),
        ], now()->addMinutes(10));

        return response()->json([
            'run_id' => $runId,
        ]);
    }

    public function streamRun(Request $request, string $runId): StreamedResponse
    {
        $user = $request->user();
        $userId = (int) $user->id;
        $run = Cache::get($this->runCacheKey($userId, $runId));

        if (! is_array($run) || ! array_key_exists('prompt', $run)) {
            abort(404);
        }

        $prompt = (string) $run['prompt'];
        $types = TimeBoxingSetupOption::query()
            ->where('category', 'type')
            ->where('status', 'Active')
            ->orderBy('name')
            ->pluck('name')
            ->map(fn ($v) => (string) $v)
            ->values()
            ->all();

        return response()->stream(function () use ($request, $prompt, $types) {
            @set_time_limit(0);
            @ini_set('output_buffering', 'off');
            @ini_set('zlib.output_compression', '0');

            $sendEvent = function (string $event, array $payload) {
                echo "event: {$event}\n";
                echo 'data: ' . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
                @ob_flush();
                @flush();
            };

            $sendEvent('status', ['state' => 'listening', 'at' => now()->toISOString()]);
            $sendEvent('status', ['state' => 'thinking', 'at' => now()->toISOString()]);

            $result = $this->runAgent($prompt, $request->user(), $types);
            $toolCalls = is_array($result['tool_calls'] ?? null) ? $result['tool_calls'] : [];

            foreach ($toolCalls as $tc) {
                $out = $this->executeToolCall($request, $tc, $types);
                $sendEvent('tool_call', array_merge(['at' => now()->toISOString()], $out));
            }

            $report = app(OfficeAgentReportingService::class)->createAndMaybeSend(now()->subMinutes(15), now(), [
                'trigger' => 'run',
                'user_id' => $request->user()->id,
                'tool_calls' => $toolCalls,
            ]);
            $sendEvent('telegram', [
                'ok' => (bool) $report->telegram_ok,
                'message' => $report->telegram_ok ? 'Sent to admin via Telegram' : ('Telegram failed: ' . (string) $report->telegram_error),
            ]);

            $responseText = (string) ($result['response'] ?? '');
            if ($responseText === '') {
                $responseText = 'Saya sudah siap. Silakan berikan instruksi.';
            }

            $sendEvent('status', ['state' => 'acting', 'at' => now()->toISOString()]);

            $chunks = $this->chunkText($responseText, 48);
            foreach ($chunks as $chunk) {
                $sendEvent('message_chunk', ['text' => $chunk]);
                usleep(30000);
            }

            $sendEvent('status', ['state' => 'done', 'at' => now()->toISOString()]);
            $sendEvent('done', ['at' => now()->toISOString()]);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    public function activity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'since' => ['nullable', 'string', 'max:64'],
        ]);

        $since = null;
        if (! empty($data['since'])) {
            try {
                $since = Carbon::parse((string) $data['since']);
            } catch (\Throwable) {
                $since = null;
            }
        }

        $q = TimeBoxing::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('updated_at');

        if ($since) {
            $q->where('updated_at', '>', $since);
        }

        $items = $q->limit(15)->get([
            'id',
            'no',
            'type',
            'priority',
            'status',
            'due_date',
            'updated_at',
        ])->map(function (TimeBoxing $t) {
            $due = $t->due_date ? $t->due_date->toDateString() : null;
            $msg = '#' . $t->no . ' · ' . (string) $t->type . ' · ' . (string) $t->status;
            if ($due) $msg .= ' · due ' . $due;
            return [
                'at' => $t->updated_at?->toISOString() ?? now()->toISOString(),
                'message' => $msg,
                'detail' => json_encode([
                    'id' => (string) $t->id,
                    'no' => $t->no,
                    'type' => $t->type,
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'due_date' => $due,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ];
        })->values();

        return response()->json([
            'now' => now()->toISOString(),
            'items' => $items,
        ]);
    }

    public function loggerEvents(Request $request): JsonResponse
    {
        $data = $request->validate([
            'since' => ['nullable', 'string', 'max:64'],
        ]);

        $since = null;
        if (! empty($data['since'])) {
            try {
                $since = Carbon::parse((string) $data['since']);
            } catch (\Throwable) {
                $since = null;
            }
        }

        $q = AuthEvent::query()->orderByDesc('created_at');
        if ($since) $q->where('created_at', '>', $since);
        $items = $q->limit(15)->get(['type', 'email', 'ip', 'created_at'])->map(function (AuthEvent $e) {
            $msg = strtoupper((string) $e->type) . ' · ' . (string) ($e->email ?: '-') . ' · ' . (string) ($e->ip ?: '-');
            return [
                'at' => $e->created_at?->toISOString() ?? now()->toISOString(),
                'message' => $msg,
            ];
        })->values();

        return response()->json([
            'now' => now()->toISOString(),
            'items' => $items,
        ]);
    }

    public function securityEvents(Request $request): JsonResponse
    {
        $data = $request->validate([
            'since' => ['nullable', 'string', 'max:64'],
        ]);

        $since = null;
        if (! empty($data['since'])) {
            try {
                $since = Carbon::parse((string) $data['since']);
            } catch (\Throwable) {
                $since = null;
            }
        }

        $q = SecurityEvent::query()->orderByDesc('created_at');
        if ($since) $q->where('created_at', '>', $since);
        $items = $q->limit(15)->get(['severity', 'reason', 'ip', 'created_at'])->map(function (SecurityEvent $e) {
            $msg = strtoupper((string) $e->severity) . ' · ' . (string) $e->reason;
            if ($e->ip) $msg .= ' · ' . $e->ip;
            return [
                'at' => $e->created_at?->toISOString() ?? now()->toISOString(),
                'message' => $msg,
            ];
        })->values();

        return response()->json([
            'now' => now()->toISOString(),
            'items' => $items,
        ]);
    }

    private function runCacheKey(int $userId, string $runId): string
    {
        return 'office_agent_run:' . $userId . ':' . $runId;
    }

    private function runAgent(string $prompt, $user, array $types): array
    {
        $apiKey = (string) env('OFFICE_AGENT_LLM_API_KEY', '');
        if ($apiKey === '') {
            return [
                'response' => "LLM belum dikonfigurasi.\n\nSet env OFFICE_AGENT_LLM_API_KEY (dan opsional OFFICE_AGENT_LLM_BASE_URL, OFFICE_AGENT_LLM_MODEL) lalu coba lagi.",
                'tool_calls' => [],
            ];
        }

        $baseUrl = rtrim((string) env('OFFICE_AGENT_LLM_BASE_URL', 'https://api.openai.com/v1'), '/');
        $model = (string) env('OFFICE_AGENT_LLM_MODEL', 'gpt-4o-mini');

        $system = [
            'Kamu adalah Office Agent untuk aplikasi internal. Jawab dalam Bahasa Indonesia.',
            'Kamu boleh membuat/update/delete Time Boxing milik user yang sedang login.',
            'Kamu harus mengembalikan JSON valid, tanpa teks lain.',
            'Format: {"response":"...","tool_calls":[{"name":"create_time_boxing","args":{"type":"...","priority":"Normal|High|Urgent","status":"Brain Dump|Priority List|Time Boxing|Completed","description":"...","action_solution":"...","due_date":"YYYY-MM-DD"}}]}',
            'Jika tidak perlu aksi, kembalikan tool_calls sebagai [].',
            'Tool tambahan: update_time_boxing (args: {"no":123, ...fields}), delete_time_boxing (args: {"no":123}).',
            'Daftar type yang tersedia: ' . implode(', ', array_map(fn ($t) => (string) $t, $types)),
            'User: ' . (string) ($user->name ?? 'User') . ' (id ' . (string) ($user->id ?? '') . ')',
        ];

        $resp = Http::withToken($apiKey)
            ->acceptJson()
            ->asJson()
            ->timeout(60)
            ->post($baseUrl . '/chat/completions', [
                'model' => $model,
                'temperature' => 0.2,
                'messages' => [
                    ['role' => 'system', 'content' => implode("\n", $system)],
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if (! $resp->ok()) {
            return [
                'response' => 'Gagal menghubungi LLM. HTTP ' . $resp->status(),
                'tool_calls' => [],
            ];
        }

        $content = (string) data_get($resp->json(), 'choices.0.message.content', '');
        $parsed = json_decode($content, true);
        if (! is_array($parsed)) {
            return [
                'response' => $content !== '' ? $content : 'Saya menerima instruksi, namun output LLM tidak valid.',
                'tool_calls' => [],
            ];
        }

        return [
            'response' => (string) ($parsed['response'] ?? ''),
            'tool_calls' => is_array($parsed['tool_calls'] ?? null) ? $parsed['tool_calls'] : [],
        ];
    }

    private function executeToolCall(Request $request, $toolCall, array $types): array
    {
        if (! is_array($toolCall)) {
            return [
                'name' => 'unknown',
                'ok' => false,
                'message' => 'Tool call tidak valid.',
            ];
        }

        $name = (string) ($toolCall['name'] ?? '');
        $args = is_array($toolCall['args'] ?? null) ? $toolCall['args'] : [];

        if ($name === 'create_time_boxing') {
            return $this->toolCreateTimeBoxing($request, $args, $types);
        }
        if ($name === 'update_time_boxing') {
            return $this->toolUpdateTimeBoxing($request, $args, $types);
        }
        if ($name === 'delete_time_boxing') {
            return $this->toolDeleteTimeBoxing($request, $args);
        }

        return [
            'name' => $name !== '' ? $name : 'unknown',
            'ok' => false,
            'message' => 'Tool tidak didukung.',
        ];
    }

    private function toolCreateTimeBoxing(Request $request, array $args, array $types): array
    {
        $type = (string) ($args['type'] ?? '');
        if ($type === '' || ! in_array($type, $types, true)) {
            $type = (string) ($types[0] ?? '');
        }
        if ($type === '') {
            return [
                'name' => 'create_time_boxing',
                'ok' => false,
                'message' => 'Tidak ada type Time Boxing. Setup dulu di Time Boxing Setup.',
            ];
        }

        $priority = (string) ($args['priority'] ?? 'Normal');
        if (! in_array($priority, ['Normal', 'High', 'Urgent'], true)) $priority = 'Normal';

        $status = (string) ($args['status'] ?? 'Brain Dump');
        if (! in_array($status, ['Brain Dump', 'Priority List', 'Time Boxing', 'Completed'], true)) $status = 'Brain Dump';

        $dueDate = null;
        if (! empty($args['due_date'])) {
            try {
                $dueDate = Carbon::parse((string) $args['due_date'])->toDateString();
            } catch (\Throwable) {
                $dueDate = null;
            }
        }

        $data = [
            'information_date' => now()->toDateString(),
            'type' => $type,
            'priority' => $priority,
            'user_id' => $request->user()->id,
            'user_position' => null,
            'partner_id' => null,
            'description' => array_key_exists('description', $args) ? (string) ($args['description'] ?? '') : null,
            'action_solution' => array_key_exists('action_solution', $args) ? (string) ($args['action_solution'] ?? '') : null,
            'status' => $status,
            'due_date' => $dueDate,
            'project_id' => null,
        ];

        $created = null;
        try {
            DB::transaction(function () use ($request, $data, &$created) {
                $created = TimeBoxing::query()->create($this->applyTimeBoxingComputedFields($data, null));
                AuditLog::record($request, 'create', TimeBoxing::class, (string) $created->id, null, $created->fresh()->toArray(), [
                    'source' => 'office_agent',
                ]);
            });
        } catch (\Throwable $e) {
            return [
                'name' => 'create_time_boxing',
                'ok' => false,
                'message' => 'Gagal membuat Time Boxing: ' . $e->getMessage(),
            ];
        }

        return [
            'name' => 'create_time_boxing',
            'ok' => true,
            'summary' => 'Created #' . (string) $created->no . ' (' . (string) $created->type . ')',
            'id' => (string) $created->id,
            'no' => $created->no,
        ];
    }

    private function toolUpdateTimeBoxing(Request $request, array $args, array $types): array
    {
        $no = (int) ($args['no'] ?? 0);
        if ($no <= 0) {
            return [
                'name' => 'update_time_boxing',
                'ok' => false,
                'message' => 'Field no wajib diisi (nomor Time Boxing).',
            ];
        }

        $item = TimeBoxing::query()->where('user_id', $request->user()->id)->where('no', $no)->first();
        if (! $item) {
            return [
                'name' => 'update_time_boxing',
                'ok' => false,
                'message' => 'Time Boxing #' . $no . ' tidak ditemukan.',
            ];
        }

        $patch = [];
        if (array_key_exists('type', $args)) {
            $type = (string) ($args['type'] ?? '');
            if ($type !== '' && in_array($type, $types, true)) $patch['type'] = $type;
        }
        if (array_key_exists('priority', $args)) {
            $priority = (string) ($args['priority'] ?? '');
            if (in_array($priority, ['Normal', 'High', 'Urgent'], true)) $patch['priority'] = $priority;
        }
        if (array_key_exists('status', $args)) {
            $status = (string) ($args['status'] ?? '');
            if (in_array($status, ['Brain Dump', 'Priority List', 'Time Boxing', 'Completed'], true)) $patch['status'] = $status;
        }
        if (array_key_exists('description', $args)) $patch['description'] = (string) ($args['description'] ?? '');
        if (array_key_exists('action_solution', $args)) $patch['action_solution'] = (string) ($args['action_solution'] ?? '');
        if (array_key_exists('due_date', $args)) {
            $dueDate = null;
            if (! empty($args['due_date'])) {
                try {
                    $dueDate = Carbon::parse((string) $args['due_date'])->toDateString();
                } catch (\Throwable) {
                    $dueDate = null;
                }
            }
            $patch['due_date'] = $dueDate;
        }

        if (! count($patch)) {
            return [
                'name' => 'update_time_boxing',
                'ok' => false,
                'message' => 'Tidak ada field yang diupdate.',
            ];
        }

        try {
            DB::transaction(function () use ($request, $item, $patch) {
                $before = $item->fresh()->toArray();
                $item->update($this->applyTimeBoxingComputedFields($patch, $item));
                $after = $item->fresh()->toArray();
                AuditLog::record($request, 'update', TimeBoxing::class, (string) $item->id, $before, $after, [
                    'source' => 'office_agent',
                ]);
            });
        } catch (\Throwable $e) {
            return [
                'name' => 'update_time_boxing',
                'ok' => false,
                'message' => 'Gagal update Time Boxing: ' . $e->getMessage(),
            ];
        }

        return [
            'name' => 'update_time_boxing',
            'ok' => true,
            'summary' => 'Updated #' . $no,
            'no' => $no,
        ];
    }

    private function toolDeleteTimeBoxing(Request $request, array $args): array
    {
        $no = (int) ($args['no'] ?? 0);
        if ($no <= 0) {
            return [
                'name' => 'delete_time_boxing',
                'ok' => false,
                'message' => 'Field no wajib diisi (nomor Time Boxing).',
            ];
        }

        $item = TimeBoxing::query()->where('user_id', $request->user()->id)->where('no', $no)->first();
        if (! $item) {
            return [
                'name' => 'delete_time_boxing',
                'ok' => false,
                'message' => 'Time Boxing #' . $no . ' tidak ditemukan.',
            ];
        }

        try {
            DB::transaction(function () use ($request, $item) {
                $before = $item->fresh()->toArray();
                $id = (string) $item->id;
                $item->delete();
                AuditLog::record($request, 'delete', TimeBoxing::class, $id, $before, null, [
                    'source' => 'office_agent',
                ]);
            });
        } catch (\Throwable $e) {
            return [
                'name' => 'delete_time_boxing',
                'ok' => false,
                'message' => 'Gagal delete Time Boxing: ' . $e->getMessage(),
            ];
        }

        return [
            'name' => 'delete_time_boxing',
            'ok' => true,
            'summary' => 'Deleted #' . $no,
            'no' => $no,
        ];
    }

    private function chunkText(string $text, int $size): array
    {
        if ($size < 1) $size = 1;
        $out = [];
        $len = mb_strlen($text);
        for ($i = 0; $i < $len; $i += $size) {
            $out[] = mb_substr($text, $i, $size);
        }
        return $out;
    }

    private function applyTimeBoxingComputedFields(array $data, ?TimeBoxing $current): array
    {
        $next = $data;

        $wasCompleted = $current ? ((string) $current->status === 'Completed') : false;
        $isCompleted = (string) ($next['status'] ?? '') === 'Completed';

        if ($isCompleted && ! $wasCompleted) {
            $next['completed_at'] = now();
        } elseif (! $isCompleted) {
            $next['completed_at'] = null;
        }

        return $next;
    }
}
