<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyScore extends Model
{
    protected $primaryKey = ['poll_id', 'candidate_id', 'day'];
    public $incrementing = false;
    protected $keyType = 'string'; // not exactly true but helps

    // Since Laravel doesn't support composite keys well, we might need to override setKeysForSaveQuery
    // But for import/read, this is okay.
    
    public $timestamps = false; // We have updated_at manually managed or defaultNow(), but no created_at

    protected $fillable = ['poll_id', 'candidate_id', 'day', 'votes', 'score', 'updated_at'];

    protected $casts = [
        'day' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Set the keys for a save update query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function setKeysForSaveQuery($query)
    {
        $keys = $this->getKeyName();
        if(!is_array($keys)){
            return parent::setKeysForSaveQuery($query);
        }

        foreach($keys as $keyName){
            $query->where($keyName, '=', $this->getOriginal($keyName) ?? $this->getAttribute($keyName));
        }

        return $query;
    }

    /**
     * Get the primary key value for a save query.
     *
     * @return mixed
     */
    protected function getKeyForSaveQuery()
    {
        $keys = $this->getKeyName();
        if(!is_array($keys)){
            return parent::getKeyForSaveQuery();
        }

        $result = [];
        foreach($keys as $keyName){
            $result[$keyName] = $this->getOriginal($keyName) ?? $this->getAttribute($keyName);
        }
        return $result;
    }
}
