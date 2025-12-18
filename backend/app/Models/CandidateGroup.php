<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CandidateGroup extends Model
{
    use HasUuids;

    protected $fillable = ['poll_id', 'name', 'key', 'sort_order', 'is_default'];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function poll()
    {
        return $this->belongsTo(Poll::class);
    }

    public function candidates()
    {
        return $this->hasMany(Candidate::class);
    }
}
