<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProfilePhotoTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upload_and_view_profile_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $user->syncRoles([$admin]);
        $this->actingAs($user);

        $file = UploadedFile::fake()->create('avatar.jpg', 200, 'image/jpeg');
        $this->post(route('profile.photo.update'), [
            'photo' => $file,
        ])->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertNotNull($user->profile_photo_path);
        Storage::disk('public')->assertExists($user->profile_photo_path);

        $this->get(route('profile.photo', ['user' => $user->id]))
            ->assertOk();
    }

    public function test_user_can_remove_profile_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'profile_photo_path' => 'profile-photos/existing.jpg',
        ]);
        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $user->syncRoles([$admin]);

        Storage::disk('public')->put($user->profile_photo_path, 'x');

        $this->actingAs($user)
            ->delete(route('profile.photo.destroy'))
            ->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertNull($user->profile_photo_path);
        Storage::disk('public')->assertMissing('profile-photos/existing.jpg');
    }
}
