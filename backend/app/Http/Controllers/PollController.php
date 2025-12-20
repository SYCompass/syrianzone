<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PollController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()) {
            return \App\Models\Poll::all();
        }
        return \App\Models\Poll::where('is_active', true)->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'slug' => 'required|string|max:100|unique:polls',
            'timezone' => 'string|max:64',
            'is_active' => 'boolean',
        ]);

        $poll = \App\Models\Poll::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'timezone' => $validated['timezone'] ?? 'Europe/Amsterdam',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($poll, 201);
    }

    public function update(Request $request, $id)
    {
        $poll = \App\Models\Poll::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string|max:200',
            'slug' => 'string|max:100|unique:polls,slug,' . $id,
            'timezone' => 'string|max:64',
            'is_active' => 'boolean',
        ]);

        $poll->update($validated);

        return response()->json($poll);
    }

    public function destroy($id)
    {
        $poll = \App\Models\Poll::findOrFail($id);
        $poll->delete();

        return response()->json(null, 204);
    }

    public function leaderboard($slug)
    {
        $poll = \App\Models\Poll::where('slug', $slug)->firstOrFail();
        $candidates = $poll->candidates()->orderBy('sort')->get()->keyBy('id');
        
        // Get all-time aggregates
        $allTimeAgg = \Illuminate\Support\Facades\DB::table('daily_scores')
            ->select('candidate_id', 
                \Illuminate\Support\Facades\DB::raw('SUM(votes) as votes'),
                \Illuminate\Support\Facades\DB::raw('SUM(score) as score'))
            ->where('poll_id', $poll->id)
            ->groupBy('candidate_id')
            ->get()
            ->map(function ($row) use ($candidates) {
                $c = $candidates->get($row->candidate_id);
                return [
                    'candidateId' => $row->candidate_id,
                    'name' => $c?->name ?? '',
                    'title' => $c?->title,
                    'imageUrl' => $c?->image_url,
                    'category' => $c?->category,
                    'votes' => (int)$row->votes,
                    'score' => (int)$row->score,
                    'avg' => $row->votes > 0 ? round($row->score / $row->votes, 2) : 0,
                ];
            })
            ->sortByDesc('avg')
            ->values();
        
        // Fetch groups
        $groups = $poll->groups;

        // map $allTimeAgg to include group_id from candidate models
        $allTimeAgg = $allTimeAgg->map(function($item) use ($candidates) {
            $c = $candidates->get($item['candidateId']);
            $item['groupId'] = $c?->candidate_group_id;
            return $item;
        });

        $results = [
            'poll' => $poll, 
            'groups' => $groups,
            'ministers' => [],
            'governors' => [],
            'security' => [],
            'jolani' => [],
            'history' => $this->getHistory($poll->id),
        ];
        
        foreach ($groups as $group) {
            $groupItems = $allTimeAgg->filter(fn($item) => $item['groupId'] === $group->id);
            
            $rankedItems = $groupItems->values()->map(function ($item, $index) {
                $item['rank'] = $index + 1;
                return $item;
            });

            $key = $group->key ?? $group->id;
            
            // Normalize keys to match frontend expectations
            $finalKey = match($key) {
                'minister' => 'ministers',
                'governor' => 'governors',
                'secur' => 'security', // Handle possible truncated keys
                'security' => 'security',
                'jolani' => 'jolani',
                default => $key
            };
            
            $results[$finalKey] = $rankedItems;
        }

        return response()->json($results);
    }
    
    private function getHistory($pollId) {
        $history = \Illuminate\Support\Facades\DB::table('daily_scores')
            ->where('poll_id', $pollId)
            ->select('candidate_id', 'day', 'votes', 'score')
            ->orderBy('day')
            ->get()
            ->groupBy('candidate_id')
            ->map(function ($items) {
                return $items->map(function ($item) {
                    return [
                        'date' => $item->day,
                        'votes' => (int)$item->votes,
                        'score' => (int)$item->score,
                    ];
                });
            });
            
        return $history;
    }

    public function show($idOrSlug)
    {
        $poll = \App\Models\Poll::where('id', $idOrSlug)->orWhere('slug', $idOrSlug)->firstOrFail();
        $candidates = $poll->candidates()->orderBy('sort')->get();
        
        // Determine today's date in poll's timezone
        $timezone = $poll->timezone ?: 'UTC';
        $today = \Carbon\Carbon::now($timezone)->startOfDay();
        
        $groups = $poll->groups; // Eager load is handled by default? No, relationship.
        
        $scores = \App\Models\DailyScore::where('poll_id', $poll->id)
            ->where('day', $today)
            ->get();

        return response()->json([
            'poll' => $poll,
            'groups' => $groups,
            'candidates' => $candidates,
            'todayScores' => $scores,
            'voteDay' => $today->toIso8601String(),
        ]);
    }

    public function submit(Request $request)
    {
        $validated = $request->validate([
            'pollSlug' => 'required|string',
            'tiers' => 'required|array',
            'deviceId' => 'required|string|min:8',
        ]);

        $poll = \App\Models\Poll::where('slug', $validated['pollSlug'])->firstOrFail();
        
        $tiers = $validated['tiers'];
        $totalAssigned = 0;
        foreach ($tiers as $tier => $items) {
            $totalAssigned += count($items);
        }

        if ($totalAssigned < 3) {
            return response()->json(['error' => 'Minimum selection is 3'], 400);
        }

        $timezone = $poll->timezone ?: 'UTC';
        $voteDay = \Carbon\Carbon::now($timezone)->startOfDay(); // Keep as Carbon object or string? Model casts 'date'

        $voterKey = hash('sha256', $validated['deviceId']);
        $ipHash = hash('sha256', $request->ip() ?: 'unknown');
        $userAgent = $request->header('User-Agent');
        
        // Simple rate check (could use more sophisticated logic or middleware)
        // Check if ballot exists for this device today? Legacy allows multiple? 
        // Legacy: "Rate limiting enforced at route layer via Arcjet"
        // But also check if it allows voting again. Legacy doesn't seem to block voting by deviceId in DB explicitly in the submit mutation, 
        // essentially relying on frontend cooldown and Arcjet.
        // I'll skip DB level duplicate check for now to match behavior.

        $tierMinimums = ['S' => 50, 'A' => 40, 'B' => 30, 'C' => 20, 'D' => 10, 'F' => 0];
        $tierPositionBonuses = [
            'S' => [5, 3, 1, 0, 0, 0, 0, 0, 0, 0],
            'A' => [4, 2, 1, 0, 0, 0, 0, 0, 0, 0],
            'B' => [3, 2, 1, 0, 0, 0, 0, 0, 0, 0],
            'C' => [2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            'D' => [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'F' => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        \Illuminate\Support\Facades\DB::transaction(function () use ($poll, $voteDay, $voterKey, $ipHash, $userAgent, $tiers, $tierMinimums, $tierPositionBonuses) {
            $ballot = \App\Models\Ballot::create([
                'poll_id' => $poll->id,
                'vote_day' => $voteDay,
                'voter_key' => $voterKey,
                'ip_hash' => $ipHash,
                'user_agent' => $userAgent,
            ]);

            $scoreDelta = []; // candidateId => ['votes' => 0, 'score' => 0]

            foreach ($tiers as $tierKey => $items) {
                if (!isset($tierMinimums[$tierKey])) continue;
                
                foreach ($items as $index => $item) {
                    $candidateId = $item['candidateId'];
                    $pos = $item['pos'] ?? $index; // legacy input has pos

                    \App\Models\BallotItem::create([
                        'ballot_id' => $ballot->id,
                        'candidate_id' => $candidateId,
                        'tier' => $tierKey,
                        'position' => $pos,
                    ]);

                    $bonus = $tierPositionBonuses[$tierKey][$index] ?? 0;
                    $points = $tierMinimums[$tierKey] + $bonus;

                    if (!isset($scoreDelta[$candidateId])) {
                        $scoreDelta[$candidateId] = ['votes' => 0, 'score' => 0];
                    }
                    $scoreDelta[$candidateId]['votes'] += 1;
                    $scoreDelta[$candidateId]['score'] += $points;
                }
            }

            foreach ($scoreDelta as $candidateId => $delta) {
                // Upsert DailyScore
                // Eloquent doesn't support composite key upsert nicely out of the box with timestamps
                // DB::table('daily_scores')->upsert matches legacy logic
                // But legacy uses `dailyScores` Drizzle definition.
                // Key: poll_id, candidate_id, day.
                
                // We'll use raw DB statement or firstOrNew
                /*
                \App\Models\DailyScore::upsert([
                   ['poll_id' => $poll->id, 'candidate_id' => $candidateId, 'day' => $voteDay->format('Y-m-d'), 'votes' => $delta['votes'], 'score' => $delta['score']] 
                ], ['poll_id', 'candidate_id', 'day'], ['votes' => DB::raw('votes + VALUES(votes)'), 'score' => DB::raw('score + VALUES(score)')]);
                */
                // Wait, upsert in Laravel combines the logic.
                // Be careful with valid SQL for upsert. "votes = votes + ?" is needed.
                // `upsert` method values are simple values.
                
                // Let's manually do find/save to be safe and leverage Model events if any (none for now)
                // But concurrency? Lock?
                // Legacy relies on Drizzle upsert `onConflictDoUpdate`.
                
                // Using DB::statement for atomic increment in upsert is best.
                // Or simplified: find record, increment, save. Inside transaction with lockForUpdate?
                // Let's use lockForUpdate.
                
                $dailyScore = \App\Models\DailyScore::where('poll_id', $poll->id)
                    ->where('candidate_id', $candidateId)
                    ->where('day', $voteDay)
                    ->lockForUpdate()
                    ->first();

                if ($dailyScore) {
                    $dailyScore->votes += $delta['votes'];
                    $dailyScore->score += $delta['score'];
                    $dailyScore->updated_at = now();
                    $dailyScore->save();
                } else {
                    \App\Models\DailyScore::create([
                        'poll_id' => $poll->id,
                        'candidate_id' => $candidateId,
                        'day' => $voteDay,
                        'votes' => $delta['votes'],
                        'score' => $delta['score'],
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        return response()->json(['ok' => true]);
    }
}
