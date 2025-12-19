<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Candidate;
use App\Models\Poll;
use Illuminate\Support\Str;

class CandidateController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'poll_id' => 'required|exists:polls,id',
            'candidate_group_id' => 'nullable|exists:candidate_groups,id',
            'name' => 'required|string|max:255',
            'title' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string', // Legacy support
        ]);

        $candidate = Candidate::create([
            'id' => (string) Str::uuid(),
            'poll_id' => $validated['poll_id'],
            'candidate_group_id' => $validated['candidate_group_id'],
            'name' => $validated['name'],
            'title' => $validated['title'],
            'image_url' => $validated['image_url'],
            'category' => $validated['category'] ?? 'minister',
            'sort' => 0, // Default sort
        ]);

        return response()->json($candidate, 201);
    }

    public function update(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);

        $validated = $request->validate([
            'candidate_group_id' => 'nullable|exists:candidate_groups,id',
            'name' => 'string|max:255',
            'title' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string',
            'sort' => 'integer',
        ]);

        $candidate->update($validated);

        return response()->json($candidate);
    }

    public function destroy($id)
    {
        $candidate = Candidate::findOrFail($id);
        $candidate->delete();

        return response()->json(null, 204);
    }
}
