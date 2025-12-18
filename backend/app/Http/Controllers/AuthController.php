<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     *
     * @return \Illuminate\Http\Response
     */
    public function redirectToProvider()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     *
     * @return \Illuminate\Http\Response
     */
    public function handleProviderCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL') . '/login?error=auth_failed');
        }

        $email = $googleUser->getEmail();
        $isSuperAdmin = $email === 'hade.alahmad1@gmail.com';

        // Check if user exists or is superadmin
        $user = User::where('email', $email)->first();

        if (!$user && !$isSuperAdmin) {
             return redirect(env('FRONTEND_URL') . '/letmein?error=access_denied_admin_only');
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'password' => $user ? $user->password : bcrypt(str()->random(16)), // Keep existing password or generate random
                'role' => $isSuperAdmin ? 'superadmin' : ($user ? $user->role : 'admin'),
            ]
        );

        Auth::login($user, true);

        return redirect(env('FRONTEND_URL') . '/admin/polls');
    }
    
    public function user(Request $request) {
        return $request->user();
    }
    
    public function logout(Request $request) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out']);
    }
}
