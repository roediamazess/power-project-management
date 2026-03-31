<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ArrangementSchedulePickup extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'schedule_id',
        'user_id',
        'points',
    ];

    protected $casts = [
        'points' => 'integer',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ArrangementSchedule::class, 'schedule_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    protected static function booted(): void
    {
        static::creating(function (ArrangementSchedulePickup $pickup) {
            if (! $pickup->getKey()) {
                $pickup->setAttribute($pickup->getKeyName(), (string) Str::uuid());
            }
        });
    }
}

