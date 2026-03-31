<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\TimeBoxing;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class TelegramBotCommandService
{
    public function handleUpdate(array $update): void
    {
        $allowedChatId = (string) env('TELEGRAM_CHAT_ID', '');
        if ($allowedChatId === '') {
            return;
        }

        $updateId = (string) ($update['update_id'] ?? '');
        if ($updateId !== '') {
            $key = 'tg:update:' . $updateId;
            if (! Cache::add($key, '1', now()->addMinutes(10))) {
                return;
            }
        }

        $msg = $update['message'] ?? $update['edited_message'] ?? null;
        if (! is_array($msg)) {
            return;
        }

        $chatId = (string) ($msg['chat']['id'] ?? '');
        if ($chatId !== $allowedChatId) {
            return;
        }

        $text = trim((string) ($msg['text'] ?? ''));
        if ($text === '') {
            return;
        }

        $pendingKey = 'tg:pending:' . $chatId;
        $pending = Cache::get($pendingKey);
        if (is_array($pending) && $this->isConfirmText($text)) {
            Cache::forget($pendingKey);
            $reply = $this->executePending($pending);
            if ($reply !== null && $reply !== '') {
                app(TelegramService::class)->sendMessage($reply);
            }
            return;
        }
        if (is_array($pending) && $this->isCancelText($text)) {
            Cache::forget($pendingKey);
            app(TelegramService::class)->sendMessage('Oke, dibatalkan.');
            return;
        }

        $actorId = (int) env('TELEGRAM_ACTOR_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1));
        if ($actorId > 0) {
            Auth::onceUsingId($actorId);
        }

        $reply = $this->handleText($text);
        if ($reply !== null && $reply !== '') {
            app(TelegramService::class)->sendMessage($reply);
        }
    }

    private function handleText(string $text): ?string
    {
        $t = trim($text);

        if (preg_match('/^\/(start|help)\b/i', $t)) {
            return $this->help();
        }

        if (preg_match('/^\/(tb|timeboxing)\b/i', $t)) {
            return $this->handleTbCommand($t);
        }

        return $this->handleNaturalLanguage($t);
    }

    private function handleNaturalLanguage(string $text): ?string
    {
        $t = mb_strtolower($text);

        if (preg_match('/\boverdue\b|\bterlambat\b|\bjatuh tempo\b|\blewat due\b/', $t)) {
            return $this->tbOverdue(['limit=10']);
        }

        $looksLikeTb = str_contains($t, 'time boxing') || str_contains($t, 'timeboxing') || preg_match('/\btb\b/', $t);
        if (! $looksLikeTb) {
            return null;
        }

        if (preg_match('/\bdaftar\b|\blist\b|\bsemua\b/', $t)) {
            if (str_contains($t, 'completed') || str_contains($t, 'selesai')) {
                return $this->tbList(['completed', 'limit=10']);
            }
            if (str_contains($t, 'all') || str_contains($t, 'semua')) {
                return $this->tbList(['all', 'limit=10']);
            }
            return $this->tbList(['active', 'limit=10']);
        }

        if (preg_match('/\bdetail\b|\bliat\b|\bcek\b|\bget\b/', $t) && preg_match('/\b(\d{1,6})\b/', $t, $m)) {
            return $this->tbGet([$m[1]]);
        }

        if (preg_match('/\bhapus\b|\bdelete\b/', $t) && preg_match('/\b(\d{1,6})\b/', $t, $m)) {
            return $this->queuePending('delete', [
                'no' => (int) $m[1],
            ]);
        }

        if (preg_match('/\bubah\b|\bupdate\b|\bganti\b/', $t) && preg_match('/\b(\d{1,6})\b/', $t, $m)) {
            $no = (int) $m[1];
            $patch = $this->extractPatchFromNaturalText($text);
            if (! count($patch)) {
                return 'Sebutkan yang mau diubah. Contoh: "ubah time boxing 12 status completed" atau "update time boxing 12 due 2026-04-10".';
            }
            return $this->queuePending('update', [
                'no' => $no,
                'patch' => $patch,
            ]);
        }

        if (preg_match('/\btambah\b|\bbuat\b|\bcreate\b|\bnew\b/', $t)) {
            $kv = $this->extractCreateFromNaturalText($text);
            if (! isset($kv['desc']) || trim((string) $kv['desc']) === '') {
                return 'Tulis deskripsinya ya. Contoh: "buat time boxing: follow up vendor, due 2026-04-01, priority high".';
            }
            $args = [];
            foreach ($kv as $k => $v) {
                $args[] = $k . '=' . (string) $v;
            }
            return $this->tbCreate($args);
        }

        return "Bisa. Contoh:\n- kirimkan saya list time boxing yang sudah overdue\n- list time boxing active\n- cek time boxing 12\n- buat time boxing: ...\n- ubah time boxing 12 status completed";
    }

    private function tbOverdue(array $args): string
    {
        $kv = $this->parseKv($args);
        $limit = (int) ($kv['limit'] ?? 10);
        if ($limit < 1) $limit = 1;
        if ($limit > 20) $limit = 20;

        $userId = (int) env('OFFICE_AGENT_TELEGRAM_USER_ID', (int) env('OFFICE_AGENT_REPORT_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1)));
        $today = now()->toDateString();
        $items = TimeBoxing::query()
            ->where('user_id', $userId)
            ->whereNotNull('due_date')
            ->where('status', '!=', 'Completed')
            ->where('due_date', '<', $today)
            ->orderBy('due_date')
            ->limit($limit)
            ->get(['no', 'type', 'priority', 'status', 'due_date', 'description']);

        if ($items->count() === 0) {
            return 'Tidak ada Time Boxing overdue.';
        }

        $lines = ["Time Boxing overdue (user_id " . $userId . "):"]; 
        foreach ($items as $t) {
            $line = '#' . (string) $t->no;
            if ($t->type) $line .= ' ' . (string) $t->type;
            if ($t->priority) $line .= ' ' . (string) $t->priority;
            $line .= ' due ' . (string) $t->due_date;
            $desc = trim((string) ($t->description ?? ''));
            if ($desc !== '') $line .= ' — ' . Str::limit($desc, 60);
            $lines[] = $line;
        }
        return implode("\n", $lines);
    }

    private function help(): string
    {
        return implode("\n", [
            "Perintah Time Boxing:",
            "/tb list [active|completed|all] [limit=10]",
            "/tb get <no>",
            "/tb create type=<Type> priority=<Normal|High|Urgent> status=<Brain Dump|Priority List|Time Boxing|Completed> desc=<text> due=<YYYY-MM-DD>",
            "/tb update <no> field=value ... (type/priority/status/desc/due)",
            "/tb delete <no>",
        ]);
    }

    private function handleTbCommand(string $text): string
    {
        $parts = preg_split('/\s+/', trim($text)) ?: [];
        array_shift($parts);
        $sub = strtolower((string) ($parts[0] ?? ''));
        if ($sub === '') {
            return $this->help();
        }

        if ($sub === 'list') {
            return $this->tbList(array_slice($parts, 1));
        }
        if ($sub === 'get') {
            return $this->tbGet(array_slice($parts, 1));
        }
        if ($sub === 'create') {
            return $this->tbCreate(array_slice($parts, 1));
        }
        if ($sub === 'update') {
            return $this->tbUpdate(array_slice($parts, 1));
        }
        if ($sub === 'delete') {
            return $this->tbDelete(array_slice($parts, 1));
        }

        return $this->help();
    }

    private function tbList(array $args): string
    {
        $scope = strtolower((string) ($args[0] ?? 'active'));
        $kv = $this->parseKv(array_slice($args, 1));
        $limit = (int) ($kv['limit'] ?? 10);
        if ($limit < 1) $limit = 1;
        if ($limit > 20) $limit = 20;

        $userId = (int) env('OFFICE_AGENT_TELEGRAM_USER_ID', (int) env('OFFICE_AGENT_REPORT_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1)));
        $q = TimeBoxing::query()->where('user_id', $userId);
        if ($scope === 'completed') {
            $q->where('status', 'Completed');
        } elseif ($scope === 'all') {
        } else {
            $q->where('status', '!=', 'Completed');
        }

        $items = $q->orderByDesc('information_date')->orderByDesc('no')->limit($limit)->get([
            'no', 'type', 'priority', 'status', 'due_date', 'description',
        ]);

        if ($items->count() === 0) {
            return "Time Boxing kosong (" . $scope . ")";
        }

        $lines = ["Time Boxing (" . $scope . ") user_id " . $userId . ":"]; 
        foreach ($items as $t) {
            $line = '#' . (string) $t->no . ' [' . (string) $t->status . ']';
            if ($t->type) $line .= ' ' . (string) $t->type;
            if ($t->priority) $line .= ' ' . (string) $t->priority;
            if ($t->due_date) $line .= ' due ' . (string) $t->due_date;
            $desc = trim((string) ($t->description ?? ''));
            if ($desc !== '') {
                $desc = Str::limit($desc, 60);
                $line .= ' — ' . $desc;
            }
            $lines[] = $line;
        }
        return implode("\n", $lines);
    }

    private function tbGet(array $args): string
    {
        $no = (int) ($args[0] ?? 0);
        if ($no <= 0) return 'Format: /tb get <no>';

        $userId = (int) env('OFFICE_AGENT_TELEGRAM_USER_ID', (int) env('OFFICE_AGENT_REPORT_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1)));
        $t = TimeBoxing::query()->where('user_id', $userId)->where('no', $no)->first();
        if (! $t) return 'Time Boxing #' . $no . ' tidak ditemukan.';

        $lines = [];
        $lines[] = 'Time Boxing #' . (string) $t->no;
        $lines[] = 'Type: ' . (string) $t->type;
        $lines[] = 'Priority: ' . (string) $t->priority;
        $lines[] = 'Status: ' . (string) $t->status;
        if ($t->due_date) $lines[] = 'Due: ' . (string) $t->due_date;
        if ($t->description) $lines[] = 'Desc: ' . (string) $t->description;
        if ($t->action_solution) $lines[] = 'Action: ' . (string) $t->action_solution;
        return implode("\n", $lines);
    }

    private function tbCreate(array $args): string
    {
        $kv = $this->parseKv($args);

        $type = (string) ($kv['type'] ?? 'General');
        $priority = (string) ($kv['priority'] ?? 'Normal');
        if (! in_array($priority, ['Normal', 'High', 'Urgent'], true)) $priority = 'Normal';
        $status = (string) ($kv['status'] ?? 'Brain Dump');
        if (! in_array($status, ['Brain Dump', 'Priority List', 'Time Boxing', 'Completed'], true)) $status = 'Brain Dump';
        $desc = array_key_exists('desc', $kv) ? (string) $kv['desc'] : null;
        $due = array_key_exists('due', $kv) ? (string) $kv['due'] : null;

        $userId = (int) env('OFFICE_AGENT_TELEGRAM_USER_ID', (int) env('OFFICE_AGENT_REPORT_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1)));

        $data = [
            'information_date' => now()->toDateString(),
            'type' => $type,
            'priority' => $priority,
            'user_id' => $userId,
            'user_position' => null,
            'partner_id' => null,
            'description' => $desc,
            'action_solution' => null,
            'status' => $status,
            'due_date' => $due,
            'project_id' => null,
        ];

        $created = TimeBoxing::query()->create($this->applyComputed($data, null));
        AuditLog::record(null, 'create', TimeBoxing::class, (string) $created->id, null, $created->fresh()->toArray(), [
            'source' => 'telegram',
        ]);

        return 'Created Time Boxing #' . (string) $created->no;
    }

    private function tbUpdate(array $args): string
    {
        $no = (int) ($args[0] ?? 0);
        if ($no <= 0) return 'Format: /tb update <no> field=value ...';

        $kv = $this->parseKv(array_slice($args, 1));
        $patch = [];

        if (array_key_exists('type', $kv)) $patch['type'] = (string) $kv['type'];
        if (array_key_exists('priority', $kv)) {
            $p = (string) $kv['priority'];
            if (in_array($p, ['Normal', 'High', 'Urgent'], true)) $patch['priority'] = $p;
        }
        if (array_key_exists('status', $kv)) {
            $s = (string) $kv['status'];
            if (in_array($s, ['Brain Dump', 'Priority List', 'Time Boxing', 'Completed'], true)) $patch['status'] = $s;
        }
        if (array_key_exists('desc', $kv)) $patch['description'] = (string) $kv['desc'];
        if (array_key_exists('due', $kv)) $patch['due_date'] = (string) $kv['due'];

        if (! count($patch)) return 'Tidak ada field untuk diupdate.';

        $userId = (int) env('OFFICE_AGENT_TELEGRAM_USER_ID', (int) env('OFFICE_AGENT_REPORT_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1)));
        $t = TimeBoxing::query()->where('user_id', $userId)->where('no', $no)->first();
        if (! $t) return 'Time Boxing #' . $no . ' tidak ditemukan.';

        $before = $t->fresh()->toArray();
        $t->update($this->applyComputed($patch, $t));
        $after = $t->fresh()->toArray();
        AuditLog::record(null, 'update', TimeBoxing::class, (string) $t->id, $before, $after, [
            'source' => 'telegram',
        ]);

        return 'Updated Time Boxing #' . $no;
    }

    private function tbDelete(array $args): string
    {
        $no = (int) ($args[0] ?? 0);
        if ($no <= 0) return 'Format: /tb delete <no>';

        $userId = (int) env('OFFICE_AGENT_TELEGRAM_USER_ID', (int) env('OFFICE_AGENT_REPORT_USER_ID', (int) env('TIME_BOXING_IMPORT_USER_ID', 1)));
        $t = TimeBoxing::query()->where('user_id', $userId)->where('no', $no)->first();
        if (! $t) return 'Time Boxing #' . $no . ' tidak ditemukan.';

        $before = $t->fresh()->toArray();
        $id = (string) $t->id;
        $t->delete();
        AuditLog::record(null, 'delete', TimeBoxing::class, $id, $before, null, [
            'source' => 'telegram',
        ]);

        return 'Deleted Time Boxing #' . $no;
    }

    private function isConfirmText(string $text): bool
    {
        $t = mb_strtolower(trim($text));
        return in_array($t, ['ya', 'y', 'yes', 'ok', 'oke', 'lanjut', 'confirm', 'konfirmasi'], true);
    }

    private function isCancelText(string $text): bool
    {
        $t = mb_strtolower(trim($text));
        return in_array($t, ['batal', 'cancel', 'gajadi', 'tidak', 'ga', 'no'], true);
    }

    private function queuePending(string $type, array $payload): string
    {
        $allowedChatId = (string) env('TELEGRAM_CHAT_ID', '');
        $key = 'tg:pending:' . $allowedChatId;
        Cache::put($key, [
            'type' => $type,
            'payload' => $payload,
        ], now()->addMinutes(5));

        if ($type === 'delete') {
            return 'Konfirmasi hapus Time Boxing #' . (string) ($payload['no'] ?? '?') . "?\nBalas: ya / batal";
        }
        if ($type === 'update') {
            return 'Konfirmasi update Time Boxing #' . (string) ($payload['no'] ?? '?') . "?\nBalas: ya / batal";
        }

        return 'Konfirmasi? Balas: ya / batal';
    }

    private function executePending(array $pending): ?string
    {
        $type = (string) ($pending['type'] ?? '');
        $payload = $pending['payload'] ?? [];
        if (! is_array($payload)) $payload = [];

        if ($type === 'delete') {
            return $this->tbDelete([(string) ($payload['no'] ?? 0)]);
        }
        if ($type === 'update') {
            $no = (string) ($payload['no'] ?? 0);
            $patch = $payload['patch'] ?? [];
            if (! is_array($patch)) $patch = [];
            $args = [$no];
            foreach ($patch as $k => $v) {
                $args[] = $k . '=' . (string) $v;
            }
            return $this->tbUpdate($args);
        }

        return null;
    }

    private function extractPatchFromNaturalText(string $text): array
    {
        $t = mb_strtolower($text);
        $patch = [];

        if (preg_match('/\b(status)\b\s*[:=]?\s*(completed|brain dump|priority list|time boxing|selesai)/i', $text, $m)) {
            $val = mb_strtolower($m[2]);
            if ($val === 'selesai') $val = 'completed';
            $map = [
                'completed' => 'Completed',
                'brain dump' => 'Brain Dump',
                'priority list' => 'Priority List',
                'time boxing' => 'Time Boxing',
            ];
            if (isset($map[$val])) $patch['status'] = $map[$val];
        }

        if (preg_match('/\b(due|deadline)\b\s*[:=]?\s*(\d{4}-\d{2}-\d{2})/i', $text, $m)) {
            $patch['due'] = $m[2];
        }

        if (preg_match('/\b(prioritas|priority)\b\s*[:=]?\s*(normal|high|urgent)/i', $text, $m)) {
            $patch['priority'] = ucfirst(mb_strtolower($m[2]));
        }

        if (preg_match('/\b(type|tipe)\b\s*[:=]?\s*([^,\n]+)/i', $text, $m)) {
            $patch['type'] = trim($m[2]);
        }

        if (preg_match('/\b(desc|deskripsi|description)\b\s*[:=]?\s*(.+)$/i', $text, $m)) {
            $patch['desc'] = trim($m[2]);
        }

        if (! isset($patch['desc']) && preg_match('/\bubah\b.*\bmenjadi\b\s+(.+)$/i', $text, $m)) {
            $patch['desc'] = trim($m[1]);
        }

        return $patch;
    }

    private function extractCreateFromNaturalText(string $text): array
    {
        $out = [];

        if (preg_match('/\b(due|deadline)\b\s*[:=]?\s*(\d{4}-\d{2}-\d{2})/i', $text, $m)) {
            $out['due'] = $m[2];
        }

        if (preg_match('/\b(prioritas|priority)\b\s*[:=]?\s*(normal|high|urgent)/i', $text, $m)) {
            $out['priority'] = ucfirst(mb_strtolower($m[2]));
        }

        if (preg_match('/\b(status)\b\s*[:=]?\s*(completed|brain dump|priority list|time boxing|selesai)/i', $text, $m)) {
            $val = mb_strtolower($m[2]);
            if ($val === 'selesai') $val = 'completed';
            $map = [
                'completed' => 'Completed',
                'brain dump' => 'Brain Dump',
                'priority list' => 'Priority List',
                'time boxing' => 'Time Boxing',
            ];
            if (isset($map[$val])) $out['status'] = $map[$val];
        }

        if (preg_match('/\b(type|tipe)\b\s*[:=]?\s*([^,\n]+)/i', $text, $m)) {
            $out['type'] = trim($m[2]);
        }

        if (preg_match('/\b(desc|deskripsi|description)\b\s*[:=]?\s*(.+)$/i', $text, $m)) {
            $out['desc'] = trim($m[2]);
        } else {
            if (preg_match('/time\s*boxing\s*[:\-]?\s*(.+)$/i', $text, $m)) {
                $out['desc'] = trim($m[1]);
            } elseif (preg_match('/\b(buat|tambah)\b\s+time\s*boxing\s*[:\-]?\s*(.+)$/i', $text, $m)) {
                $out['desc'] = trim($m[2]);
            }
        }

        return $out;
    }

    private function parseKv(array $args): array
    {
        $out = [];
        foreach ($args as $a) {
            $s = trim((string) $a);
            if ($s === '') continue;
            $eq = strpos($s, '=');
            if ($eq === false) continue;
            $k = strtolower(trim(substr($s, 0, $eq)));
            $v = trim(substr($s, $eq + 1));
            $v = trim($v, "\"'");
            $out[$k] = $v;
        }
        return $out;
    }

    private function applyComputed(array $data, ?TimeBoxing $current): array
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
