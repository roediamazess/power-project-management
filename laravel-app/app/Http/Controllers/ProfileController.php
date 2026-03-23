<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    public function updatePhoto(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'photo' => ['required', 'file', 'image', 'max:4096'],
        ]);

        $user = $request->user();
        $disk = Storage::disk('public');

        if ($user->profile_photo_path && $disk->exists($user->profile_photo_path)) {
            $disk->delete($user->profile_photo_path);
        }

        $path = $data['photo']->storePublicly('profile-photos', 'public');
        $user->forceFill(['profile_photo_path' => $path])->save();

        return Redirect::route('profile.edit');
    }

    public function destroyPhoto(Request $request): RedirectResponse
    {
        $user = $request->user();
        $disk = Storage::disk('public');

        if ($user->profile_photo_path && $disk->exists($user->profile_photo_path)) {
            $disk->delete($user->profile_photo_path);
        }

        $user->forceFill(['profile_photo_path' => null])->save();

        return Redirect::route('profile.edit');
    }

    public function photo(Request $request, \App\Models\User $user)
    {
        if ((int) $request->user()?->id !== (int) $user->id) {
            abort(403);
        }

        if (! $user->profile_photo_path) {
            abort(404);
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($user->profile_photo_path)) {
            abort(404);
        }

        $path = $disk->path($user->profile_photo_path);
        return response()->file($path);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
