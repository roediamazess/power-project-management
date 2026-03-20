<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReleaseNote extends Model
{
    protected $fillable = [
        'version',
        'released_on',
        'data',
    ];

    protected $casts = [
        'released_on' => 'date',
        'data' => 'array',
    ];
}
