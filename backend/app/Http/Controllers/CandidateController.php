<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CandidateController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'poll_id' => 'required|exists:polls,id',
            'candidate_group_id' => 'nullable|exists:candidate_groups,id',
            'name' => 'required|string|max:255',
            'title' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string',
        ]);

        return response()->json(Candidate::create([
            'id' => (string) Str::uuid(),
            'category' => 'minister',
            'sort' => 0,
            ...$data,
        ]), 201);
    }

    public function update(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);
        $candidate->update($request->validate([
            'candidate_group_id' => 'nullable|exists:candidate_groups,id',
            'name' => 'string|max:255',
            'title' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'category' => 'nullable|string',
            'sort' => 'integer',
        ]));
        return response()->json($candidate);
    }

    public function destroy($id)
    {
        Candidate::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
