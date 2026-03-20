<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectSetupOption;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProjectSetupController extends Controller
{
    private const CATEGORIES = [
        'type',
        'status',
    ];

    public function index(Request $request): Response
    {
        $category = $request->query('category', 'type');
        if (! in_array($category, self::CATEGORIES, true)) {
            $category = 'type';
        }

        $usedValues = $this->usedValuesForCategory($category);

        $options = ProjectSetupOption::query()
            ->where('category', $category)
            ->orderBy('name')
            ->get()
            ->map(fn (ProjectSetupOption $o) => [
                'id' => $o->id,
                'category' => $o->category,
                'name' => $o->name,
                'status' => $o->status,
                'in_use' => in_array($o->name, $usedValues, true),
            ])
            ->values();

        return Inertia::render('Tables/ProjectSetup/Index', [
            'category' => $category,
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
                'name' => ['required', 'string', 'max:255', Rule::unique('project_setup_options', 'name')->where(fn ($q) => $q->where('category', $category))],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);

            $option = ProjectSetupOption::query()->create([
                'category' => $data['category'],
                'name' => $data['name'],
                'status' => $data['status'],
            ]);

            AuditLog::record($request, 'create', ProjectSetupOption::class, (string) $option->id, null, $option->fresh()->toArray(), [
                'setup_category' => $option->category,
            ]);

            return redirect()->route('tables.project-setup.index', ['category' => $data['category']]);
        });
    }

    public function update(Request $request, ProjectSetupOption $option): RedirectResponse
    {
        return DB::transaction(function () use ($request, $option) {
            $category = $request->input('category');

            $data = $request->validate([
                'category' => ['required', 'string', Rule::in(self::CATEGORIES)],
                'name' => ['required', 'string', 'max:255', Rule::unique('project_setup_options', 'name')->where(fn ($q) => $q->where('category', $category))->ignore($option->id)],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);

            $inUse = $this->optionInUse($option->category, $option->name);
            if ($inUse && ($data['category'] !== $option->category || $data['name'] !== $option->name)) {
                return back()->withErrors(['name' => 'Tidak bisa mengubah Category/Name karena option sudah dipakai di data Projects.']);
            }

            $before = $option->fresh()->toArray();

            $option->update([
                'category' => $data['category'],
                'name' => $data['name'],
                'status' => $data['status'],
            ]);

            $after = $option->fresh()->toArray();
            AuditLog::record($request, 'update', ProjectSetupOption::class, (string) $option->id, $before, $after, [
                'setup_category' => $after['category'] ?? null,
            ]);

            return redirect()->route('tables.project-setup.index', ['category' => $data['category']]);
        });
    }

    public function destroy(Request $request, ProjectSetupOption $option): RedirectResponse
    {
        return DB::transaction(function () use ($request, $option) {
            $category = $option->category;

            if ($this->optionInUse($option->category, $option->name)) {
                return redirect()->route('tables.project-setup.index', ['category' => $category])
                    ->withErrors(['delete' => 'Tidak bisa menghapus option karena sudah dipakai di data Projects. Set status ke Inactive saja.']);
            }

            $before = $option->fresh()->toArray();
            $optionId = (string) $option->id;
            $option->delete();
            AuditLog::record($request, 'delete', ProjectSetupOption::class, $optionId, $before, null, [
                'setup_category' => $before['category'] ?? null,
            ]);

            return redirect()->route('tables.project-setup.index', ['category' => $category]);
        });
    }

    private function usedValuesForCategory(string $category): array
    {
        if (! in_array($category, self::CATEGORIES, true)) return [];

        return Project::query()
            ->select($category)
            ->whereNotNull($category)
            ->distinct()
            ->orderBy($category)
            ->pluck($category)
            ->filter()
            ->values()
            ->all();
    }

    private function optionInUse(string $category, string $name): bool
    {
        if (! in_array($category, self::CATEGORIES, true)) return false;
        if ($name === '') return false;

        return Project::query()->where($category, $name)->exists();
    }

    private function categoryLabel(string $key): string
    {
        return match ($key) {
            'type' => 'Type',
            'status' => 'Status',
            default => $key,
        };
    }
}
