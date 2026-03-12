<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PowerUser extends Model
{
    protected $table = 'power_users';

    protected $fillable = [
        'username',
        'password',
        'role',
        'tier',
        'point',
    ];

    protected $hidden = ['password'];
}
