<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TimeBoxing extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'no',
        'information_date',
        'type',
        'priority',
        'user_id',
        'user_position',
        'partner_id',
        'description',
        'action_solution',
        'status',
        'due_date',
        'completed_at',
        'project_id',
    ];

    protected $casts = [
        'no' => 'integer',
        'information_date' => 'date',
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'partner_id' => 'integer',
        'user_id' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (TimeBoxing $timeBoxing) {
            if (! $timeBoxing->getKey()) {
                $timeBoxing->setAttribute($timeBoxing->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
