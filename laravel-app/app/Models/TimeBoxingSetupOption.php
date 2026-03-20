<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeBoxingSetupOption extends Model
{
    protected $fillable = [
        'category',
        'name',
        'status',
    ];
}
