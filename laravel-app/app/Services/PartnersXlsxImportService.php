<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\PartnerSetupOption;
use App\Models\ProjectSetupOption;
use App\Support\XlsxReader;
use Illuminate\Support\Facades\DB;

class PartnersXlsxImportService
{
    public function import(string $path, bool $createMissingOptions = true): array
    {
        $rows = app(XlsxReader::class)->readFirstSheet($path);
        if (count($rows) < 2) {
            return ['created' => 0, 'updated' => 0, 'skipped' => 0, 'options_created' => 0];
        }

        $header = array_map(fn ($v) => $this->normHeader($v), $rows[0]);
        $idx = [];
        foreach ($header as $i => $h) {
            if ($h !== '') {
                $idx[$h] = $i;
            }
        }

        $partnerSetupCache = [];
        $projectSetupCache = [];

        $optionsCreated = 0;
        $created = 0;
        $updated = 0;
        $skipped = 0;

        DB::transaction(function () use (
            $rows,
            $idx,
            $createMissingOptions,
            &$partnerSetupCache,
            &$projectSetupCache,
            &$optionsCreated,
            &$created,
            &$updated,
            &$skipped
        ) {
            for ($r = 1; $r < count($rows); $r++) {
                $row = $rows[$r];

                $cncId = $this->cell($row, $idx, 'cnc id');
                $cncId = $cncId !== null ? trim((string) $cncId) : '';
                if ($cncId === '') {
                    $skipped++;
                    continue;
                }

                $name = $this->cell($row, $idx, 'name');
                $name = $name !== null ? trim((string) $name) : '';

                $area = $this->cell($row, $idx, 'area');
                $area = $area !== null ? trim((string) $area) : null;
                if ($area === '') $area = null;

                $subArea = $this->cell($row, $idx, 'sub area');
                $subArea = $subArea !== null ? trim((string) $subArea) : null;
                if ($subArea === '') $subArea = null;
                if ($subArea !== null && $area === null) {
                    $subArea = null;
                }

                $data = [
                    'cnc_id' => $cncId,
                    'name' => $name !== '' ? $name : null,
                    'system_live' => $this->parseDate($this->cell($row, $idx, 'system live')),
                    'system_version' => $this->optPartnerSetup('system_version', $this->cell($row, $idx, 'system version'), $createMissingOptions, $partnerSetupCache, $optionsCreated),
                    'star' => $this->parseInt($this->cell($row, $idx, 'star')),
                    'room' => $this->nullIfEmpty($this->cell($row, $idx, 'room')),
                    'outlet' => $this->nullIfEmpty($this->cell($row, $idx, 'outlet')),
                    'type' => $this->optPartnerSetup('type', $this->cell($row, $idx, 'type'), $createMissingOptions, $partnerSetupCache, $optionsCreated),
                    'implementation_type' => $this->optPartnerSetup('implementation_type', $this->cell($row, $idx, 'implementation type'), $createMissingOptions, $partnerSetupCache, $optionsCreated),
                    'status' => $this->nullIfEmpty($this->cell($row, $idx, 'status')) ?? 'Active',
                    'group' => $this->optPartnerSetup('group', $this->cell($row, $idx, 'group'), $createMissingOptions, $partnerSetupCache, $optionsCreated),
                    'address' => $this->nullIfEmpty($this->cell($row, $idx, 'address')),
                    'area' => $this->optPartnerSetup('area', $area, $createMissingOptions, $partnerSetupCache, $optionsCreated),
                    'sub_area' => $this->optPartnerSubArea($area, $subArea, $createMissingOptions, $partnerSetupCache, $optionsCreated),
                    'gm_email' => $this->nullIfEmpty($this->cell($row, $idx, 'gm email')),
                    'fc_email' => $this->nullIfEmpty($this->cell($row, $idx, 'fc / ca email')),
                    'ca_email' => $this->nullIfEmpty($this->cell($row, $idx, 'fc / ca email')),
                    'cc_email' => null,
                    'ia_email' => null,
                    'it_email' => $this->nullIfEmpty($this->cell($row, $idx, 'it email')),
                    'hrd_email' => $this->nullIfEmpty($this->cell($row, $idx, 'hrd email')),
                    'fom_email' => null,
                    'dos_email' => null,
                    'ehk_email' => null,
                    'fbm_email' => null,
                    'last_visit' => $this->parseDate($this->cell($row, $idx, 'last visit')),
                    'last_visit_type' => $this->optProjectSetup('type', $this->cell($row, $idx, 'last visit type'), $createMissingOptions, $projectSetupCache, $optionsCreated),
                    'last_project' => $this->nullIfEmpty($this->cell($row, $idx, 'last project')),
                    'last_project_type' => $this->optProjectSetup('type', $this->cell($row, $idx, 'last project type'), $createMissingOptions, $projectSetupCache, $optionsCreated),
                ];

                $existing = Partner::query()->where('cnc_id', $cncId)->first();
                if ($existing) {
                    $existing->fill($data);
                    $existing->save();
                    $updated++;
                } else {
                    Partner::query()->create($data);
                    $created++;
                }
            }
        });

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'options_created' => $optionsCreated,
        ];
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
        if ($v === null) return null;
        $s = trim((string) $v);
        if ($s === '') return null;

        $formats = ['d/m/Y', 'd/m/y', 'Y-m-d'];
        foreach ($formats as $f) {
            $dt = \DateTime::createFromFormat($f, $s);
            if ($dt instanceof \DateTime) {
                return $dt->format('Y-m-d');
            }
        }

        return null;
    }

    private function optPartnerSetup(
        string $category,
        $value,
        bool $createMissing,
        array &$cache,
        int &$optionsCreated
    ): ?string {
        $name = $this->nullIfEmpty($value);
        if ($name === null) return null;

        $key = $category . '||' . $name;
        if (array_key_exists($key, $cache)) {
            return $cache[$key];
        }

        $exists = PartnerSetupOption::query()
            ->where('category', $category)
            ->where('name', $name)
            ->exists();

        if (! $exists && $createMissing) {
            PartnerSetupOption::query()->create([
                'category' => $category,
                'parent_name' => null,
                'name' => $name,
                'status' => 'Active',
            ]);
            $optionsCreated++;
        }

        $cache[$key] = $name;
        return $name;
    }

    private function optPartnerSubArea(
        ?string $area,
        ?string $subArea,
        bool $createMissing,
        array &$cache,
        int &$optionsCreated
    ): ?string {
        if ($area === null || $subArea === null) return null;

        $areaKey = 'area||' . $area;
        if (! array_key_exists($areaKey, $cache)) {
            $areaExists = PartnerSetupOption::query()
                ->where('category', 'area')
                ->where('name', $area)
                ->exists();

            if (! $areaExists && $createMissing) {
                PartnerSetupOption::query()->create([
                    'category' => 'area',
                    'parent_name' => null,
                    'name' => $area,
                    'status' => 'Active',
                ]);
                $optionsCreated++;
            }
            $cache[$areaKey] = $area;
        }

        $key = 'sub_area||' . $area . '||' . $subArea;
        if (array_key_exists($key, $cache)) {
            return $cache[$key];
        }

        $exists = PartnerSetupOption::query()
            ->where('category', 'sub_area')
            ->where('parent_name', $area)
            ->where('name', $subArea)
            ->exists();

        if (! $exists && $createMissing) {
            PartnerSetupOption::query()->create([
                'category' => 'sub_area',
                'parent_name' => $area,
                'name' => $subArea,
                'status' => 'Active',
            ]);
            $optionsCreated++;
        }

        $cache[$key] = $subArea;
        return $subArea;
    }

    private function optProjectSetup(
        string $category,
        $value,
        bool $createMissing,
        array &$cache,
        int &$optionsCreated
    ): ?string {
        $name = $this->nullIfEmpty($value);
        if ($name === null) return null;

        $key = $category . '||' . $name;
        if (array_key_exists($key, $cache)) {
            return $cache[$key];
        }

        $exists = ProjectSetupOption::query()
            ->where('category', $category)
            ->where('name', $name)
            ->exists();

        if (! $exists && $createMissing) {
            ProjectSetupOption::query()->create([
                'category' => $category,
                'name' => $name,
                'status' => 'Active',
            ]);
            $optionsCreated++;
        }

        $cache[$key] = $name;
        return $name;
    }
}

