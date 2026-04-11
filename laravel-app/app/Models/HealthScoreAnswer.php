<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class HealthScoreAnswer extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'survey_id',
        'question_id',
        'selected_option_id',
        'value_date',
        'value_text',
        'note',
        'score_value',
    ];

    protected $casts = [
        'value_date' => 'date',
        'score_value' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (HealthScoreAnswer $answer) {
            if (! $answer->getKey()) {
                $answer->setAttribute($answer->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function survey(): BelongsTo
    {
        return $this->belongsTo(HealthScoreSurvey::class, 'survey_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(HealthScoreQuestion::class, 'question_id');
    }

    public function selectedOption(): BelongsTo
    {
        return $this->belongsTo(HealthScoreQuestionOption::class, 'selected_option_id');
    }
}

