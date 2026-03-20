<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\PartnerSetupOption;
use App\Models\Partner;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PartnerSetupController extends Controller
{
    private const CATEGORIES = [
        'implementation_type',
        'system_version',
        'type',
        'group',
        'area',
        'sub_area',
    ];

    public function index(Request $request): Response
    {
        $category = $request->query('category', 'implementation_type');
        if (! in_array($category, self::CATEGORIES, true)) {
            $category = 'implementation_type';
        }

        $usedValues = $this->usedValuesForCategory($category);

        $options = PartnerSetupOption::query()
            ->where('category', $category)
            ->when($category === 'sub_area', fn ($q) => $q->orderBy('parent_name')->orderBy('name'), fn ($q) => $q->orderBy('name'))
            ->get()
            ->map(fn (PartnerSetupOption $o) => [
                'id' => $o->id,
                'category' => $o->category,
                'parent_name' => $o->parent_name,
                'name' => $o->name,
                'status' => $o->status,
                'in_use' => $o->category === 'sub_area'
                    ? in_array(($o->parent_name ?? '') . '||' . ($o->name ?? ''), $usedValues, true)
                    : in_array($o->name, $usedValues, true),
            ])
            ->values();

        return Inertia::render('Tables/PartnerSetup/Index', [
            'category' => $category,
            'areas' => PartnerSetupOption::query()
                ->where('category', 'area')
                ->orderBy('name')
                ->pluck('name')
                ->values(),
            'categories' => collect(self::CATEGORIES)->map(fn (string $c) => [
                'key' => $c,
                'label' => $this->categoryLabel($c),
            ])->values(),
            'options' => $options,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return DB::transaction(function () use ($request) {
            $category = $request->input('category');

            $data = $request->validate([
                'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
                'parent_name' => ['nullable', 'string', 'max:255'],
                'name' => ['required', 'string', 'max:255'],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);

            if ($category === 'sub_area') {
                if (empty($data['parent_name'])) {
                    return back()->withErrors(['parent_name' => 'Area wajib diisi untuk Sub Area.']);
                }

                $exists = PartnerSetupOption::query()
                    ->where('category', 'sub_area')
                    ->where('parent_name', $data['parent_name'])
                    ->where('name', $data['name'])
                    ->exists();

                if ($exists) {
                    return back()->withErrors(['name' => 'Sub Area sudah ada untuk Area tersebut.']);
                }
            } else {
                $exists = PartnerSetupOption::query()
                    ->where('category', $category)
                    ->where('name', $data['name'])
                    ->exists();

                if ($exists) {
                    return back()->withErrors(['name' => 'Option sudah ada untuk Category tersebut.']);
                }

                $data['parent_name'] = null;
            }

            $option = PartnerSetupOption::query()->create([
                'category' => $data['category'],
                'parent_name' => $data['parent_name'] ?? null,
                'name' => $data['name'],
                'status' => $data['status'],
            ]);

            AuditLog::record($request, 'create', PartnerSetupOption::class, (string) $option->id, null, $option->fresh()->toArray(), [
                'setup_category' => $option->category,
            ]);

            return redirect()->route('tables.partner-setup.index', ['category' => $data['category']]);
        });
    }

    public function update(Request $request, PartnerSetupOption $option): RedirectResponse
    {
        return DB::transaction(function () use ($request, $option) {
            $data = $request->validate([
                'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
                'parent_name' => ['nullable', 'string', 'max:255'],
                'name' => ['required', 'string', 'max:255'],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);

            $inUse = $this->optionInUse($option);
            $changingKey = $data['category'] !== $option->category || $data['name'] !== $option->name;
            $changingParent = ($data['parent_name'] ?? null) !== ($option->parent_name ?? null);

            if ($inUse && ($changingKey || $changingParent)) {
                return back()->withErrors(['name' => 'Tidak bisa mengubah Category/Name karena option sudah dipakai di data Partners.']);
            }

            if ($data['category'] === 'sub_area') {
                if (empty($data['parent_name'])) {
                    return back()->withErrors(['parent_name' => 'Area wajib diisi untuk Sub Area.']);
                }

                $exists = PartnerSetupOption::query()
                    ->where('category', 'sub_area')
                    ->where('parent_name', $data['parent_name'])
                    ->where('name', $data['name'])
                    ->where('id', '<>', $option->id)
                    ->exists();

                if ($exists) {
                    return back()->withErrors(['name' => 'Sub Area sudah ada untuk Area tersebut.']);
                }
            } else {
                $exists = PartnerSetupOption::query()
                    ->where('category', $data['category'])
                    ->where('name', $data['name'])
                    ->where('id', '<>', $option->id)
                    ->exists();

                if ($exists) {
                    return back()->withErrors(['name' => 'Option sudah ada untuk Category tersebut.']);
                }

                $data['parent_name'] = null;
            }

            $before = $option->fresh()->toArray();

            $option->update([
                'category' => $data['category'],
                'parent_name' => $data['parent_name'] ?? null,
                'name' => $data['name'],
                'status' => $data['status'],
            ]);

            $after = $option->fresh()->toArray();
            AuditLog::record($request, 'update', PartnerSetupOption::class, (string) $option->id, $before, $after, [
                'setup_category' => $after['category'] ?? null,
            ]);

            return redirect()->route('tables.partner-setup.index', ['category' => $data['category']]);
        });
    }

    public function destroy(Request $request, PartnerSetupOption $option): RedirectResponse
    {
        return DB::transaction(function () use ($request, $option) {
            $category = $option->category;

            if ($this->optionInUse($option)) {
                return redirect()->route('tables.partner-setup.index', ['category' => $category])
                    ->withErrors(['delete' => 'Tidak bisa menghapus option karena sudah dipakai di data Partners. Set status ke Inactive saja.']);
            }

            $before = $option->fresh()->toArray();
            $optionId = (string) $option->id;
            $option->delete();
            AuditLog::record($request, 'delete', PartnerSetupOption::class, $optionId, $before, null, [
                'setup_category' => $before['category'] ?? null,
            ]);

            return redirect()->route('tables.partner-setup.index', ['category' => $category]);
        });
    }

    private function usedValuesForCategory(string $category): array
    {
        if (! in_array($category, self::CATEGORIES, true)) return [];

        if ($category === 'sub_area') {
            return Partner::query()
                ->select(['area', 'sub_area'])
                ->whereNotNull('area')
                ->whereNotNull('sub_area')
                ->distinct()
                ->orderBy('area')
                ->orderBy('sub_area')
                ->get()
                ->map(fn ($r) => ($r->area ?? '') . '||' . ($r->sub_area ?? ''))
                ->filter()
                ->values()
                ->all();
        }

        return Partner::query()
            ->select($category)
            ->whereNotNull($category)
            ->distinct()
            ->orderBy($category)
            ->pluck($category)
            ->filter()
            ->values()
            ->all();
    }

    private function optionInUse(PartnerSetupOption $option): bool
    {
        $category = $option->category;

        if (! in_array($category, self::CATEGORIES, true)) return false;
        if (($option->name ?? '') === '') return false;

        if ($category === 'sub_area') {
            return Partner::query()
                ->where('area', $option->parent_name)
                ->where('sub_area', $option->name)
                ->exists();
        }

        return Partner::query()->where($category, $option->name)->exists();
    }

    private function categoryLabel(string $key): string
    {
        return match ($key) {
            'implementation_type' => 'Implementation Type',
            'system_version' => 'System Version',
            'type' => 'Type',
            'group' => 'Group',
            'area' => 'Area',
            'sub_area' => 'Sub Area',
            default => $key,
        };
    }
}
