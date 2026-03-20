<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\TimeBoxing;
use App\Models\TimeBoxingSetupOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TimeBoxingSetupController extends Controller
{
    private const CATEGORIES = [
        'type',
    ];

    public function index(Request $request): Response
    {
        $category = (string) $request->query('category', 'type');
        if (! in_array($category, self::CATEGORIES, true)) {
            $category = 'type';
        }

        $options = TimeBoxingSetupOption::query()
            ->where('category', $category)
            ->orderBy('name')
            ->get()
            ->map(fn (TimeBoxingSetupOption $o) => [
                'id' => $o->id,
                'category' => $o->category,
                'name' => $o->name,
                'status' => $o->status,
                'in_use' => $this->optionInUse($o),
            ]);

        return Inertia::render('Tables/TimeBoxingSetup/Index', [
            'category' => $category,
            'categories' => collect(self::CATEGORIES)->map(fn ($c) => [
                'key' => $c,
                'label' => str_replace('_', ' ', ucwords($c)),
            ])->values(),
            'options' => $options,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return DB::transaction(function () use ($request) {
            $category = (string) $request->input('category');

            $data = $request->validate([
                'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
                'name' => ['required', 'string', 'max:255', Rule::unique('time_boxing_setup_options', 'name')->where(fn ($q) => $q->where('category', $category))],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);

            $option = TimeBoxingSetupOption::query()->create([
                'category' => $data['category'],
                'name' => $data['name'],
                'status' => $data['status'],
            ]);

            AuditLog::record($request, 'create', TimeBoxingSetupOption::class, (string) $option->id, null, $option->fresh()->toArray(), [
                'setup_category' => $option->category,
            ]);

            return redirect()->route('tables.time-boxing-setup.index', ['category' => $data['category']]);
        });
    }

    public function update(Request $request, TimeBoxingSetupOption $option): RedirectResponse
    {
        return DB::transaction(function () use ($request, $option) {
            $category = (string) $request->input('category');

            $data = $request->validate([
                'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
                'name' => ['required', 'string', 'max:255', Rule::unique('time_boxing_setup_options', 'name')->where(fn ($q) => $q->where('category', $category))->ignore($option->id)],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);

            $inUse = $this->optionInUse($option);
            if ($inUse && ($data['category'] !== $option->category || $data['name'] !== $option->name)) {
                return back()->withErrors(['name' => 'Tidak bisa mengubah Category/Name karena option sudah dipakai di data Time Boxing.']);
            }

            $before = $option->fresh()->toArray();

            $option->update([
                'category' => $data['category'],
                'name' => $data['name'],
                'status' => $data['status'],
            ]);

            $after = $option->fresh()->toArray();
            AuditLog::record($request, 'update', TimeBoxingSetupOption::class, (string) $option->id, $before, $after, [
                'setup_category' => $after['category'] ?? null,
            ]);

            return redirect()->route('tables.time-boxing-setup.index', ['category' => $data['category']]);
        });
    }

    public function destroy(Request $request, TimeBoxingSetupOption $option): RedirectResponse
    {
        return DB::transaction(function () use ($request, $option) {
            $category = $option->category;

            if ($this->optionInUse($option)) {
                return redirect()->route('tables.time-boxing-setup.index', ['category' => $category])
                    ->withErrors(['delete' => 'Tidak bisa menghapus option karena sudah dipakai di data Time Boxing. Set status ke Inactive saja.']);
            }

            $before = $option->fresh()->toArray();
            $optionId = (string) $option->id;
            $option->delete();
            AuditLog::record($request, 'delete', TimeBoxingSetupOption::class, $optionId, $before, null, [
                'setup_category' => $before['category'] ?? null,
            ]);

            return redirect()->route('tables.time-boxing-setup.index', ['category' => $category]);
        });
    }

    private function optionInUse(TimeBoxingSetupOption $option): bool
    {
        if ($option->category !== 'type') return false;

        return TimeBoxing::query()
            ->where('type', $option->name)
            ->exists();
    }
}
