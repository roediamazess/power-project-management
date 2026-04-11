<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class HealthScoreSurvey extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'template_id',
        'template_version',
        'partner_id',
        'project_id',
        'year',
        'quarter',
        'status',
        'score_total',
        'score_by_category',
        'score_by_scope',
        'score_by_module',
        'share_token',
        'public_enabled',
        'created_by',
        'submitted_at',
    ];

    protected $casts = [
        'template_version' => 'integer',
        'partner_id' => 'integer',
        'project_id' => 'string',
        'year' => 'integer',
        'quarter' => 'integer',
        'score_total' => 'decimal:2',
        'score_by_category' => 'array',
        'score_by_scope' => 'array',
        'score_by_module' => 'array',
        'public_enabled' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (HealthScoreSurvey $survey) {
            if (! $survey->getKey()) {
                $survey->setAttribute($survey->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(HealthScoreTemplate::class, 'template_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(HealthScoreAnswer::class, 'survey_id');
    }
}
