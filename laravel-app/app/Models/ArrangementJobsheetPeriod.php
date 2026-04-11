<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ArrangementJobsheetPeriod extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'arrangement_jobsheet_periods';

    protected $fillable = [
        'id',
        'name',
        'slug',
        'start_date',
        'end_date',
        'is_default',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_default' => 'boolean',
        'created_by' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (ArrangementJobsheetPeriod $period) {
            if (! $period->getKey()) {
                $period->setAttribute($period->getKeyName(), (string) Str::uuid());
            }

            if (! $period->slug) {
                $start = $period->start_date?->format('Ymd') ?? '';
                $end = $period->end_date?->format('Ymd') ?? '';
                $base = 'periode-' . Str::slug((string) $period->name) . ($start ? "-{$start}" : '') . ($end ? "-{$end}" : '');
                $slug = $base;

                $i = 2;
                while (self::query()->where('slug', $slug)->exists()) {
                    $slug = "{$base}-{$i}";
                    $i++;
                }

                $period->slug = $slug;
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
