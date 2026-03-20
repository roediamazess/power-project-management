<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = [
        'actor_user_id',
        'action',
        'model_type',
        'model_id',
        'before',
        'after',
        'meta',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'meta' => 'array',
    ];

    public static function record(?Request $request, string $action, string $modelType, ?string $modelId, $before, $after, array $metaExtra = []): void
    {
        $userId = auth()->id();

        $meta = array_filter([
            'method' => $request?->method(),
            'url' => $request?->fullUrl(),
            'ip' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ], fn ($v) => $v !== null);

        if (! empty($metaExtra)) {
            $meta = array_merge($meta, $metaExtra);
        }

        self::query()->create([
            'actor_user_id' => $userId,
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'before' => $before,
            'after' => $after,
            'meta' => $meta,
        ]);
    }


    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

}
