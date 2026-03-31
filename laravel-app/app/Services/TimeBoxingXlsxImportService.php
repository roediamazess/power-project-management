<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\AuditLog;
use App\Models\TimeBoxing;
use App\Models\TimeBoxingSetupOption;
use App\Support\XlsxReader;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TimeBoxingXlsxImportService
{
    private const PRIORITIES = [
        'Normal',
        'High',
        'Urgent',
    ];

    private const STATUSES = [
        'Brain Dump',
        'Priority List',
        'Time Boxing',
        'Completed',
    ];

    public function import(string $path, bool $createMissingTypes = true): array
    {
        $importUserId = (int) env('TIME_BOXING_IMPORT_USER_ID', 1);
        $rows = app(XlsxReader::class)->readFirstSheet($path);
        if (count($rows) < 2) {
            return [
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'partners_not_found' => 0,
                'types_created' => 0,
                'skipped_rows' => [],
                'missing_partner_rows' => [],
            ];
        }

        $header = array_map(fn ($v) => $this->normHeader($v), $rows[0]);
        $idx = [];
        foreach ($header as $i => $h) {
            if ($h !== '') {
                $idx[$h] = $i;
            }
        }

        if (isset($idx['🏩']) && ! isset($idx['partner cnc id'])) {
            $idx['partner cnc id'] = $idx['🏩'];
        }

        $partnerMap = Partner::query()->get(['id', 'cnc_id'])->mapWithKeys(function (Partner $p) {
            return [(string) $p->cnc_id => (int) $p->id];
        })->all();

        $nos = [];
        for ($r = 1; $r < count($rows); $r++) {
            $no = $this->parseInt($this->cell($rows[$r], $idx, 'id'));
            if ($no !== null) {
                $nos[] = $no;
            }
        }
        $nos = array_values(array_unique($nos));

        $existingByNo = [];
        if (count($nos)) {
            $existingByNo = TimeBoxing::query()
                ->whereIn('no', $nos)
                ->get()
                ->keyBy(fn (TimeBoxing $t) => (int) $t->no)
                ->all();
        }

        $typesCreated = 0;
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $partnersNotFound = 0;
        $skippedRows = [];
        $missingPartnerRows = [];

        DB::transaction(function () use (
            $rows,
            $idx,
            $createMissingTypes,
            $partnerMap,
            $existingByNo,
            $importUserId,
            &$typesCreated,
            &$created,
            &$updated,
            &$skipped,
            &$partnersNotFound,
            &$skippedRows,
            &$missingPartnerRows
        ) {
            for ($r = 1; $r < count($rows); $r++) {
                $row = $rows[$r];

                $no = $this->parseInt($this->cell($row, $idx, 'id'));
                if ($no === null) {
                    $skipped++;
                    $skippedRows[] = [
                        'excel_row' => $r + 1,
                        'id' => null,
                        'partner_cnc_id' => $this->nullIfEmpty($this->cell($row, $idx, 'partner cnc id')),
                        'reason' => 'missing_id',
                    ];
                    continue;
                }

                $informationDate = $this->parseDate($this->cell($row, $idx, 'information date'));
                if (! $informationDate) {
                    $skipped++;
                    $skippedRows[] = [
                        'excel_row' => $r + 1,
                        'id' => $no,
                        'partner_cnc_id' => $this->nullIfEmpty($this->cell($row, $idx, 'partner cnc id')),
                        'reason' => 'invalid_information_date',
                    ];
                    continue;
                }

                $type = $this->nullIfEmpty($this->cell($row, $idx, 'type'));
                if (! $type) {
                    $type = 'General';
                }

                if (! $this->ensureTypeExists($type, $createMissingTypes, $typesCreated)) {
                    $skipped++;
                    $skippedRows[] = [
                        'excel_row' => $r + 1,
                        'id' => $no,
                        'partner_cnc_id' => $this->nullIfEmpty($this->cell($row, $idx, 'partner cnc id')),
                        'reason' => 'type_not_allowed',
                    ];
                    continue;
                }

                $priority = $this->nullIfEmpty($this->cell($row, $idx, 'priority')) ?? 'Normal';
                if (! in_array($priority, self::PRIORITIES, true)) {
                    $priority = 'Normal';
                }

                $status = $this->nullIfEmpty($this->cell($row, $idx, 'status')) ?? 'Brain Dump';
                if (! in_array($status, self::STATUSES, true)) {
                    $status = 'Brain Dump';
                }

                $partnerCnc = $this->nullIfEmpty($this->cell($row, $idx, 'partner cnc id'));
                if ($partnerCnc === null) {
                    $partnerCnc = '3';
                }
                $partnerId = null;
                if ($partnerCnc !== null) {
                    $partnerId = $partnerMap[(string) $partnerCnc] ?? null;
                    if (! $partnerId) {
                        $partnersNotFound++;
                        $missingPartnerRows[] = [
                            'excel_row' => $r + 1,
                            'id' => $no,
                            'partner_cnc_id' => $partnerCnc,
                        ];
                    }
                }

                $dueDate = $this->parseDate($this->cell($row, $idx, 'due date'));
                $completedAt = $this->parseDateTime($this->cell($row, $idx, 'completed date'));

                $data = [
                    'no' => $no,
                    'information_date' => $informationDate,
                    'type' => $type,
                    'priority' => $priority,
                    'user_id' => $importUserId,
                    'user_position' => $this->nullIfEmpty($this->cell($row, $idx, 'user & position')),
                    'partner_id' => $partnerId,
                    'description' => $this->nullIfEmpty($this->cell($row, $idx, 'descriptions')),
                    'action_solution' => $this->nullIfEmpty($this->cell($row, $idx, 'action / solution')),
                    'status' => $status,
                    'due_date' => $dueDate,
                    'completed_at' => null,
                    'project_id' => null,
                ];

                if ($status === 'Completed') {
                    $data['completed_at'] = $completedAt ?? now();
                }

                $existing = $existingByNo[$no] ?? null;
                if ($existing) {
                    $existing->fill($data);
                    $existing->save();
                    $updated++;
                } else {
                    TimeBoxing::query()->create($data);
                    $created++;
                }
            }
        });

        AuditLog::record(null, 'import', TimeBoxing::class, null, null, [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'partners_not_found' => $partnersNotFound,
            'types_created' => $typesCreated,
        ], [
            'source' => 'xlsx_import',
            'path' => $path,
        ]);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval('time_boxings_no_seq', (SELECT COALESCE(MAX(no), 0) FROM time_boxings), true)");
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'partners_not_found' => $partnersNotFound,
            'types_created' => $typesCreated,
            'skipped_rows' => $skippedRows,
            'missing_partner_rows' => $missingPartnerRows,
        ];
    }

    private function ensureTypeExists(string $type, bool $createMissing, int &$typesCreated): bool
    {
        $exists = TimeBoxingSetupOption::query()
            ->where('category', 'type')
            ->where('name', $type)
            ->exists();

        if ($exists) {
            return true;
        }

        if (! $createMissing) {
            return false;
        }

        TimeBoxingSetupOption::query()->create([
            'category' => 'type',
            'name' => $type,
            'status' => 'Active',
        ]);

        $typesCreated++;
        return true;
    }

    private function normHeader($v): string
    {
        if ($v === null) return '';
        $s = trim((string) $v);
        $s = preg_replace('/\s+/', ' ', $s);
        return strtolower($s);
    }

    private function cell(array $row, array $idx, string $key)
    {
        $k = strtolower($key);
        if (! array_key_exists($k, $idx)) return null;
        return $row[$idx[$k]] ?? null;
    }

    private function nullIfEmpty($v): ?string
    {
        if ($v === null) return null;
        $s = trim((string) $v);
        return $s === '' ? null : $s;
    }

    private function parseInt($v): ?int
    {
        if ($v === null) return null;
        $s = trim((string) $v);
        if ($s === '') return null;
        if (is_numeric($s)) return (int) round((float) $s);
        return null;
    }

    private function parseDate($v): ?string
    {
        $s = $this->nullIfEmpty($v);
        if ($s === null) return null;

        try {
            return Carbon::parse($s)->toDateString();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function parseDateTime($v): ?\DateTimeInterface
    {
        $s = $this->nullIfEmpty($v);
        if ($s === null) return null;

        try {
            $s = preg_replace('/\s*\(GMT([+-]\d+)\)\s*$/', ' $1:00', $s);
            $s = str_replace('GMT+7', '+07:00', $s);
            $s = str_replace('GMT+8', '+08:00', $s);
            $s = str_replace('GMT+9', '+09:00', $s);
            $s = str_replace('GMT+10', '+10:00', $s);
            return Carbon::parse($s);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
