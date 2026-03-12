<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PowerSchedule extends Model
{
    protected $table = 'power_schedules';

    protected $fillable = [
        'schedule_id',
        'schedule_name',
        'description',
        'start_date',
        'end_date',
        'pickup_start',
        'pickup_end',
        'status',
        'batch_id',
        'batch_name',
        'point_min',
        'point_max',
        'picked_by',
        'released_at',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'pickup_start' => 'datetime',
        'pickup_end' => 'datetime',
        'released_at' => 'datetime',
    ];
}
