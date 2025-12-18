<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()) {
            return \App\Models\StaticSite::all();
        }
        return \App\Models\StaticSite::where('is_visible', true)->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'slug' => 'required|string|max:100|unique:static_sites',
            'path' => 'required|string|max:255',
            'is_visible' => 'boolean',
        ]);

        $site = \App\Models\StaticSite::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'path' => $validated['path'],
            'is_visible' => $validated['is_visible'] ?? true,
        ]);

        return response()->json($site, 201);
    }

    public function update(Request $request, $id)
    {
        $site = \App\Models\StaticSite::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:200',
            'slug' => 'string|max:100|unique:static_sites,slug,' . $id,
            'path' => 'string|max:255',
            'is_visible' => 'boolean',
        ]);

        $site->update($validated);

        return response()->json($site);
    }

    public function destroy($id)
    {
        $site = \App\Models\StaticSite::findOrFail($id);
        $site->delete();

        return response()->json(null, 204);
    }
}
