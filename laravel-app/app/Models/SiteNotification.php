<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SiteNotification extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'site_notifications';

    protected $fillable = [
        'id',
        'user_id',
        'type',
        'title',
        'body',
        'url',
        'read_at',
        'actor_user_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'actor_user_id' => 'integer',
        'read_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (SiteNotification $n) {
            if (! $n->getKey()) {
                $n->setAttribute($n->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}

