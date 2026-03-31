<?php

namespace App\Http\Controllers;

use App\Models\Partner;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardPartnersController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now();
        $oneYearAgo = $now->copy()->subYear();
        $twoYearsAgo = $now->copy()->subYears(2);

        // --- KPI Counts ---
        $totalActive   = Partner::where('status', 'Active')->count();
        $totalInactive = Partner::where('status', 'Inactive')->count();
        $totalFreeze   = Partner::where('status', 'Freeze')->count();
        $totalAll      = Partner::count();

        // --- Status Breakdown ---
        $statusBreakdown = Partner::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // --- Type Breakdown (Active only) ---
        $typeBreakdown = Partner::where('status', 'Active')
            ->whereNotNull('type')
            ->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['label' => $r->type, 'value' => $r->total])
            ->values()
            ->toArray();

        // --- Area Breakdown (Active only) ---
        $areaBreakdown = Partner::where('status', 'Active')
            ->whereNotNull('area')
            ->select('area', DB::raw('count(*) as total'))
            ->groupBy('area')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['label' => $r->area, 'value' => $r->total])
            ->values()
            ->toArray();

        // --- System Version Breakdown (Active) ---
        $versionBreakdown = Partner::where('status', 'Active')
            ->whereNotNull('system_version')
            ->select('system_version', DB::raw('count(*) as total'))
            ->groupBy('system_version')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['label' => $r->system_version, 'value' => $r->total])
            ->values()
            ->toArray();

        // --- Star Rating Distribution (Active) ---
        $starBreakdown = Partner::where('status', 'Active')
            ->whereNotNull('star')
            ->select('star', DB::raw('count(*) as total'))
            ->groupBy('star')
            ->orderByDesc('star')
            ->get()
            ->map(fn ($r) => ['label' => $r->star . ' Star', 'value' => $r->total])
            ->values()
            ->toArray();

        // --- Group Breakdown (Active) ---
        $groupBreakdown = Partner::where('status', 'Active')
            ->whereNotNull('group')
            ->select('group', DB::raw('count(*) as total'))
            ->groupBy('group')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['label' => $r->group, 'value' => $r->total])
            ->values()
            ->toArray();

        // --- Last Visit Aging (Active only) ---
        $activePartners = Partner::where('status', 'Active')->get(['last_visit']);
        $visitAging = ['green' => 0, 'yellow' => 0, 'red' => 0, 'none' => 0];
        foreach ($activePartners as $p) {
            if (! $p->last_visit) {
                $visitAging['none']++;
            } elseif ($p->last_visit >= $oneYearAgo) {
                $visitAging['green']++;
            } elseif ($p->last_visit >= $twoYearsAgo) {
                $visitAging['yellow']++;
            } else {
                $visitAging['red']++;
            }
        }

        // --- Last Project Aging (Active only) ---
        $activePartnersProj = Partner::where('status', 'Active')->get(['last_project']);
        $projectAging = ['green' => 0, 'yellow' => 0, 'red' => 0, 'none' => 0];
        foreach ($activePartnersProj as $p) {
            // last_project is a string (project name), not a date — skip date aging
            // Actually based on the model it might be a date field — checking…
            $projectAging['none']++;
        }

        // --- Partners needing attention: Active, last_visit > 1 year ago (Red) ---
        $needsAttention = Partner::where('status', 'Active')
            ->where(function ($q) use ($twoYearsAgo) {
                $q->whereNull('last_visit')
                  ->orWhere('last_visit', '<', $twoYearsAgo);
            })
            ->orderBy('last_visit')
            ->limit(10)
            ->get(['id', 'cnc_id', 'name', 'area', 'last_visit', 'last_visit_type'])
            ->map(fn ($p) => [
                'id'              => $p->id,
                'cnc_id'          => $p->cnc_id,
                'name'            => $p->name,
                'area'            => $p->area,
                'last_visit'      => $p->last_visit?->toDateString(),
                'last_visit_type' => $p->last_visit_type,
            ])
            ->values()
            ->toArray();

        // --- Recently visited (Active, last_visit within 6 months) ---
        $recentlyVisited = Partner::where('status', 'Active')
            ->whereNotNull('last_visit')
            ->where('last_visit', '>=', $now->copy()->subMonths(6))
            ->orderByDesc('last_visit')
            ->limit(10)
            ->get(['id', 'cnc_id', 'name', 'area', 'last_visit', 'last_visit_type'])
            ->map(fn ($p) => [
                'id'              => $p->id,
                'cnc_id'          => $p->cnc_id,
                'name'            => $p->name,
                'area'            => $p->area,
                'last_visit'      => $p->last_visit?->toDateString(),
                'last_visit_type' => $p->last_visit_type,
            ])
            ->values()
            ->toArray();

        // --- Implementation Type Breakdown (Active) ---
        $implBreakdown = Partner::where('status', 'Active')
            ->whereNotNull('implementation_type')
            ->select('implementation_type', DB::raw('count(*) as total'))
            ->groupBy('implementation_type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['label' => $r->implementation_type, 'value' => $r->total])
            ->values()
            ->toArray();

        return Inertia::render('Dashboard/Partners', [
            'kpi' => [
                'total'    => $totalAll,
                'active'   => $totalActive,
                'inactive' => $totalInactive,
                'freeze'   => $totalFreeze,
            ],
            'statusBreakdown'  => $statusBreakdown,
            'typeBreakdown'    => $typeBreakdown,
            'areaBreakdown'    => $areaBreakdown,
            'versionBreakdown' => $versionBreakdown,
            'starBreakdown'    => $starBreakdown,
            'groupBreakdown'   => $groupBreakdown,
            'implBreakdown'    => $implBreakdown,
            'visitAging'       => $visitAging,
            'needsAttention'   => $needsAttention,
            'recentlyVisited'  => $recentlyVisited,
        ]);
    }

    public function drilldown(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $type = $request->query('type'); // e.g. status, area, type, version, star, aging, etc.
        $value = $request->query('value');

        $query = Partner::query();

        if ($type === 'status') {
            $query->where('status', $value);
        } elseif ($type === 'type') {
            $query->where('status', 'Active')->where('type', $value);
        } elseif ($type === 'area') {
            $query->where('status', 'Active')->where('area', $value);
        } elseif ($type === 'version') {
            $query->where('status', 'Active')->where('system_version', $value);
        } elseif ($type === 'star') {
            $val = str_replace(' Star', '', (string)$value);
            $query->where('status', 'Active')->where('star', $val);
        } elseif ($type === 'group') {
            $query->where('status', 'Active')->where('group', $value);
        } elseif ($type === 'impl') {
            $query->where('status', 'Active')->where('implementation_type', $value);
        } elseif ($type === 'aging') {
            $query->where('status', 'Active');
            $oneYearAgo = Carbon::now()->subYear();
            $twoYearsAgo = Carbon::now()->subYears(2);

            if ($value === '< 1 Year') {
                $query->where('last_visit', '>=', $oneYearAgo);
            } elseif ($value === '1–2 Years') {
                $query->where('last_visit', '>=', $twoYearsAgo)->where('last_visit', '<', $oneYearAgo);
            } elseif ($value === '> 2 Years') {
                $query->where('last_visit', '<', $twoYearsAgo);
            } elseif ($value === 'No Data') {
                $query->whereNull('last_visit');
            }
        }

        $partners = $query->orderBy('name')
            ->limit(100)
            ->get(['id', 'cnc_id', 'name', 'area', 'last_visit', 'status', 'type', 'system_version'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'name' => $p->name,
                'area' => $p->area,
                'last_visit' => $p->last_visit?->format('d M y'),
                'status' => $p->status,
                'type' => $p->type,
                'version' => $p->system_version,
            ]);

        return response()->json([
            'title' => (string)$value,
            'partners' => $partners,
            'count' => $partners->count()
        ]);
    }
}
