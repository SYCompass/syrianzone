<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ContributorController extends Controller
{
    public function index()
    {
        return \App\Models\Contributor::orderBy('total_contributions', 'desc')->paginate(20);
    }

    public function show($id)
    {
        return \App\Models\Contributor::with('contributions')->findOrFail($id);
    }
}
