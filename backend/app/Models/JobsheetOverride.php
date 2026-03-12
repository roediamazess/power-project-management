<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobsheetOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_id',
        'username',
        'date',
        'value',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}

