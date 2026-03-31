<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class OfficeAgentReport extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'from_at',
        'to_at',
        'security_summary',
        'activity_summary',
        'telegram_ok',
        'telegram_sent_at',
        'telegram_error',
        'meta',
    ];

    protected $casts = [
        'from_at' => 'datetime',
        'to_at' => 'datetime',
        'telegram_ok' => 'boolean',
        'telegram_sent_at' => 'datetime',
        'meta' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (OfficeAgentReport $m) {
            if (! $m->getKey()) {
                $m->setAttribute($m->getKeyName(), (string) Str::uuid());
            }
        });
    }
}

