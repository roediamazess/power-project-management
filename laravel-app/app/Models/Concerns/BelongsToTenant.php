<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenant = app()->bound('tenant') ? app('tenant') : null;
            if ($tenant && isset($tenant->id)) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', $tenant->id);
            }
        });

        static::creating(function (Model $model) {
            if (! $model->getAttribute('tenant_id') && app()->bound('tenant')) {
                $tenant = app('tenant');
                if ($tenant && isset($tenant->id)) {
                    $model->setAttribute('tenant_id', $tenant->id);
                }
            }
        });
    }
}
