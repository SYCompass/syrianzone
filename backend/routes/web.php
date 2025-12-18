<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/user', [AuthController::class, 'user']);
Route::get('/auth/google', [AuthController::class, 'redirectToProvider'])->name('login');
Route::get('/auth/google/callback', [AuthController::class, 'handleProviderCallback']);
Route::post('/logout', [AuthController::class, 'logout']);

use App\Http\Controllers\AdminUserController;
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admins', [AdminUserController::class, 'index']);
    Route::post('/admins', [AdminUserController::class, 'store']);
    Route::delete('/admins/{id}', [AdminUserController::class, 'destroy']);
});

// Fallback for callback without api prefix (often configured in Google Console)
Route::get('/auth/google/callback', [AuthController::class, 'handleProviderCallback']);
