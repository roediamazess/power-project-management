<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class HealthScoreSection extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'template_id',
        'name',
        'weight',
        'sort_order',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (HealthScoreSection $section) {
            if (! $section->getKey()) {
                $section->setAttribute($section->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(HealthScoreTemplate::class, 'template_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(HealthScoreQuestion::class, 'section_id')->orderBy('sort_order');
    }
}

