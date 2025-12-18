<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    public function index(Request $request) {
        // Ensure only superadmin can list
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return User::all();
    }

    public function store(Request $request) {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'email' => 'required|email|unique:users,email',
            'name' => 'required|string'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make(Str::random(16)), // Dummy password, will rely on Google Auth
            'role' => 'admin'
        ]);

        return response()->json($user, 201);
    }

    public function destroy(Request $request, $id) {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);
        
        // Prevent deleting self or other superadmins (optional safety)
        if ($user->role === 'superadmin') {
             return response()->json(['message' => 'Cannot delete superadmin'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}
