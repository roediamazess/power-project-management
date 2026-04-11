<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class HealthScoreQuestion extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'section_id',
        'module',
        'question_text',
        'answer_type',
        'scoring_rule',
        'weight',
        'sort_order',
        'required',
        'note_instruction',
        'note_penilaian',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'sort_order' => 'integer',
        'required' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (HealthScoreQuestion $question) {
            if (! $question->getKey()) {
                $question->setAttribute($question->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(HealthScoreSection::class, 'section_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(HealthScoreQuestionOption::class, 'question_id')->orderBy('sort_order');
    }
}
