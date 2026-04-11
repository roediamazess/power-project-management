<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ArrangementJobsheetEntry extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'arrangement_jobsheet_entries';

    protected $fillable = [
        'id',
        'period_id',
        'user_id',
        'work_date',
        'code',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'work_date' => 'date',
        'user_id' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (ArrangementJobsheetEntry $entry) {
            if (! $entry->getKey()) {
                $entry->setAttribute($entry->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(ArrangementJobsheetPeriod::class, 'period_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

