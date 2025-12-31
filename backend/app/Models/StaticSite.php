<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaticSite extends Model
{
    protected $fillable = ['name', 'slug', 'path', 'is_visible'];
    protected $casts = ['is_visible' => 'boolean'];
}
