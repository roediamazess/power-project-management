<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SiteMessage extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'site_messages';

    protected $fillable = [
        'id',
        'sender_id',
        'recipient_id',
        'subject',
        'body',
        'read_at',
    ];

    protected $casts = [
        'sender_id' => 'integer',
        'recipient_id' => 'integer',
        'read_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (SiteMessage $m) {
            if (! $m->getKey()) {
                $m->setAttribute($m->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}

