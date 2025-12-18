<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\PollController;
use App\Http\Controllers\ContributorController;

// Public Polls
Route::get('/polls', [PollController::class, 'index']);
Route::get('/polls/{poll}', [PollController::class, 'show']);
Route::get('/polls/{poll}/leaderboard', [PollController::class, 'leaderboard']);
Route::post('/polls/{poll}/vote', [PollController::class, 'vote']);
Route::post('/submit', [PollController::class, 'submit']);

// Admin Polls
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/polls', [PollController::class, 'store']);
    Route::put('/polls/{id}', [PollController::class, 'update']);
    Route::delete('/polls/{id}', [PollController::class, 'destroy']);
    
    // Candidate Groups
    // Candidate Groups
    Route::apiResource('candidate-groups', \App\Http\Controllers\CandidateGroupController::class);
    Route::post('/candidate-groups/reorder', [\App\Http\Controllers\CandidateGroupController::class, 'reorder']);
    Route::post('/candidate-groups/{id}/default', [\App\Http\Controllers\CandidateGroupController::class, 'setDefault']);

    // Candidates
    Route::apiResource('candidates', \App\Http\Controllers\CandidateController::class)->except(['index', 'show']);
});

// Contributors
Route::get('/contributors', [ContributorController::class, 'index']);
Route::get('/contributors/{contributor}', [ContributorController::class, 'show']);
