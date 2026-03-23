<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserManagementController extends Controller
{
    private const ROLE_OPTIONS = [
        'Administrator',
        'Management',
        'Admin Officer',
        'User',
        'Partner',
        'Partner Admin',
    ];

    private const TIER_OPTIONS = [
        'New Born',
        'Tier 1',
        'Tier 2',
        'Tier 3',
        'Tier 4',
    ];

    private const STATUS_OPTIONS = [
        'Active',
        'Inactive',
    ];

    public function index(Request $request): Response
    {
        $users = User::query()
            ->with('roles')
            ->orderBy('id')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'start_work' => $user->start_work?->toDateString(),
                    'birthday' => $user->birthday?->toDateString(),
                    'tier' => $user->tier,
                    'status' => $user->status,
                    'role' => $user->roles->pluck('name')->first(),
                ];
            })
            ->values()
            ->all();

        foreach (PermissionCatalog::allPermissionKeys() as $permissionName) {
            Permission::query()->firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
        }

        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $adminRole->syncPermissions(PermissionCatalog::allPermissionKeys());

        $roles = collect(self::ROLE_OPTIONS)
            ->map(function (string $roleName) {
                Role::query()->firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
                return $roleName;
            })
            ->values();

        $requestUser = $request->user();
        if ($requestUser) {
            $requestUser->loadMissing('roles');
        }

        $rolePermissions = Role::query()
            ->with('permissions')
            ->get()
            ->mapWithKeys(fn (Role $r) => [$r->name => $r->permissions->pluck('name')->values()])
            ->toArray();

        return Inertia::render('Tables/UserManagement/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissionGroups' => PermissionCatalog::groups(),
            'rolePermissions' => $rolePermissions,
            'currentUserRole' => $requestUser?->roles->pluck('name')->first(),
            'canManageAccessControl' => (bool) ($requestUser?->hasRole('Administrator') || $requestUser?->can('access_control.manage')),
            'tiers' => collect(self::TIER_OPTIONS)->values(),
            'statuses' => collect(self::STATUS_OPTIONS)->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'start_work' => ['nullable', 'date'],
            'birthday' => ['nullable', 'date'],
            'tier' => ['nullable', 'string', Rule::in(self::TIER_OPTIONS)],
            'status' => ['required', 'string', Rule::in(self::STATUS_OPTIONS)],
            'role' => ['required', 'string', Rule::in(self::ROLE_OPTIONS)],
        ]);

        $tenantId = $request->user()?->tenant_id;
        $roleName = $data['role'];

        $user = User::query()->create([
            'tenant_id' => $tenantId,
            'is_internal' => $roleName !== 'Partner',
            'name' => $data['name'],
            'full_name' => $data['full_name'] ?? null,
            'email' => $data['email'],
            'password' => $data['password'],
            'start_work' => $data['start_work'] ?? null,
            'birthday' => $data['birthday'] ?? null,
            'tier' => $data['tier'] ?? null,
            'status' => $data['status'],
            'email_verified_at' => now(),
        ]);

        $role = Role::query()->firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        $user->syncRoles([$role]);

        return redirect()->route('tables.user-management.index');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'start_work' => ['nullable', 'date'],
            'birthday' => ['nullable', 'date'],
            'tier' => ['nullable', 'string', Rule::in(self::TIER_OPTIONS)],
            'status' => ['required', 'string', Rule::in(self::STATUS_OPTIONS)],
            'role' => ['required', 'string', Rule::in(self::ROLE_OPTIONS)],
        ]);

        if ($request->user()?->tenant_id && $user->tenant_id !== $request->user()?->tenant_id) {
            abort(404);
        }

        $roleName = $data['role'];

        $user->fill([
            'name' => $data['name'],
            'full_name' => $data['full_name'] ?? null,
            'email' => $data['email'],
            'start_work' => $data['start_work'] ?? null,
            'birthday' => $data['birthday'] ?? null,
            'tier' => $data['tier'] ?? null,
            'status' => $data['status'],
            'is_internal' => $roleName !== 'Partner',
        ]);

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();

        $role = Role::query()->firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        $user->syncRoles([$role]);

        return redirect()->route('tables.user-management.index');
    }


    public function updateRolePermissions(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'role' => ['required', 'string', Rule::in(self::ROLE_OPTIONS)],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(PermissionCatalog::allPermissionKeys())],
        ]);

        $actor = $request->user();
        if (! $actor || (! $actor->hasRole('Administrator') && ! $actor->can('access_control.manage'))) {
            abort(403);
        }

        $role = Role::query()->firstOrCreate(['name' => $data['role'], 'guard_name' => 'web']);
        $permissions = $data['permissions'] ?? [];
        $role->syncPermissions($permissions);

        return redirect()->route('tables.user-management.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ((int) $request->user()?->id === (int) $user->id) {
            return redirect()->route('tables.user-management.index');
        }

        if ($request->user()?->tenant_id && $user->tenant_id !== $request->user()?->tenant_id) {
            abort(404);
        }

        $user->delete();

        return redirect()->route('tables.user-management.index');
    }
}
