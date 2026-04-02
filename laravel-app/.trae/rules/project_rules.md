
## Modal button order
- In modal footers, primary action button (Create/Update/Delete) goes on the left.
- Cancel/Close goes on the right (rightmost).
- Keep both buttons grouped on the right side of the footer.

## Multi-tenancy
- All main queries must filter by `tenant_id`. Use `Auth::user()->tenant_id` to get the current tenant.
- Never expose data across tenants. Always scope Eloquent queries with `->where('tenant_id', $tenantId)`.

## Roles & Permissions (Spatie)
- Use `middleware('role_or_permission:Administrator|permission.name')` for protected routes.
- Check permissions in Blade/Inertia with `auth()->user()->can('permission.name')`.

## Inertia.js Pages
- Pages are in `resources/js/Pages/` organized by module (Projects, Contacts, Kanban, etc.).
- Render pages with `Inertia::render('Module/Page', ['data' => $data])`.
- Use `useForm` from `@inertiajs/react` for forms in JSX components.

## Controller Conventions
- Table CRUD controllers are in `app/Http/Controllers/Tables/`.
- Arrangement-related controllers are in `app/Http/Controllers/Arrangement/`.
- All controllers must extend the base `Controller`.

## Route Groups
- Protected routes use `middleware(['auth', 'verified'])`.
- Group related routes with `Route::middleware('auth')->group(...)`.

## Audit Logging
- Log user actions to the `audit_logs` table for sensitive operations (create, update, delete).

## Database
- Use `tenant_id` (unsignedBigInteger, nullable, indexed) on all tenant-scoped tables.
- Use `$table->timestamps()` on all tables.
- Use soft deletes (`$table->softDeletes()`) where data should be archivable.
