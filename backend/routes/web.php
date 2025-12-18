<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/auth/google', [AuthController::class, 'redirectToProvider'])->name('login');
    Route::get('/auth/google/callback', [AuthController::class, 'handleProviderCallback']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Fallback for callback without api prefix (often configured in Google Console)
Route::get('/auth/google/callback', [AuthController::class, 'handleProviderCallback']);
