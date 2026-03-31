<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ArrangementSchedule extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'batch_id',
        'schedule_type',
        'note',
        'start_date',
        'end_date',
        'count',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'count' => 'integer',
        'approved_at' => 'datetime',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ArrangementBatch::class, 'batch_id');
    }

    public function pickups(): HasMany
    {
        return $this->hasMany(ArrangementSchedulePickup::class, 'schedule_id');
    }

    protected static function booted(): void
    {
        static::creating(function (ArrangementSchedule $schedule) {
            if (! $schedule->getKey()) {
                $schedule->setAttribute($schedule->getKeyName(), (string) Str::uuid());
            }
        });
    }
}

