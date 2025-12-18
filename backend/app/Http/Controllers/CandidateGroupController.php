<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CandidateGroup;
use App\Models\Poll;

class CandidateGroupController extends Controller
{

    /**
     * Display a listing of the resource for a specific poll.
     */
    public function index(Request $request)
    {
        $request->validate(['poll_id' => 'required|exists:polls,id']);
        return CandidateGroup::where('poll_id', $request->poll_id)
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'poll_id' => 'required|exists:polls,id',
            'name' => 'required|string|max:255',
        ]);

        $maxSort = CandidateGroup::where('poll_id', $validated['poll_id'])->max('sort_order');

        $group = CandidateGroup::create([
            'poll_id' => $validated['poll_id'],
            'name' => $validated['name'],
            'sort_order' => $maxSort !== null ? $maxSort + 1 : 0,
        ]);

        return response()->json($group, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return CandidateGroup::findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $group = CandidateGroup::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sort_order' => 'sometimes|integer',
        ]);

        $group->update($validated);

        return response()->json($group);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $group = CandidateGroup::findOrFail($id);
        $group->delete();

        return response()->json(['message' => 'Group deleted']);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'groups' => 'required|array',
            'groups.*.id' => 'required|exists:candidate_groups,id',
            'groups.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['groups'] as $item) {
            CandidateGroup::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Groups reordered']);
    }
    public function setDefault(Request $request, $id)
    {
        $group = CandidateGroup::findOrFail($id);
        
        // Reset all others in this poll
        CandidateGroup::where('poll_id', $group->poll_id)->update(['is_default' => false]);
        
        // Set this one
        $group->update(['is_default' => true]);
        
        return response()->json($group);
    }
}
