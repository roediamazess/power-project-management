<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class HealthScoreTemplate extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'status',
        'version',
        'created_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (HealthScoreTemplate $template) {
            if (! $template->getKey()) {
                $template->setAttribute($template->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function sections(): HasMany
    {
        return $this->hasMany(HealthScoreSection::class, 'template_id');
    }
}

