<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ArrangementBatch extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'requirement_points',
        'created_by',
    ];

    protected $casts = [
        'requirement_points' => 'integer',
    ];

    public function schedules(): HasMany
    {
        return $this->hasMany(ArrangementSchedule::class, 'batch_id');
    }

    protected static function booted(): void
    {
        static::creating(function (ArrangementBatch $batch) {
            if (! $batch->getKey()) {
                $batch->setAttribute($batch->getKeyName(), (string) Str::uuid());
            }
        });
    }
}
