<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contribution extends Model
{
    protected $fillable = ['contributor_id', 'type', 'description'];

    public function contributor() { return $this->belongsTo(Contributor::class); }
}
