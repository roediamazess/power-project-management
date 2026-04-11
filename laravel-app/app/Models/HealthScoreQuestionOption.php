<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class HealthScoreQuestionOption extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'question_id',
        'label',
        'score_value',
        'sort_order',
    ];

    protected $casts = [
        'score_value' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (HealthScoreQuestionOption $option) {
            if (! $option->getKey()) {
                $option->setAttribute($option->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(HealthScoreQuestion::class, 'question_id');
    }
}

