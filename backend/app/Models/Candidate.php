<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasUuids;

    protected $fillable = ['poll_id', 'candidate_group_id', 'name', 'title', 'image_url', 'category', 'sort'];

    public function poll()
    {
        return $this->belongsTo(Poll::class);
    }

    public function group()
    {
        return $this->belongsTo(CandidateGroup::class, 'candidate_group_id');
    }
}
