<?php

namespace App\Http\Controllers;

use App\Models\SiteMessage;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MessagesController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $recent = SiteMessage::query()
            ->where(fn ($q) => $q->where('sender_id', $user->id)->orWhere('recipient_id', $user->id))
            ->orderByDesc('created_at')
            ->limit(300)
            ->get(['id', 'sender_id', 'recipient_id', 'subject', 'body', 'read_at', 'created_at']);

        $threadMap = [];
        foreach ($recent as $m) {
            $otherId = (int) ($m->sender_id === $user->id ? $m->recipient_id : $m->sender_id);
            if (! $otherId) continue;
            if (isset($threadMap[$otherId])) continue;
            $threadMap[$otherId] = $m;
        }

        $otherUserIds = array_keys($threadMap);
        $users = User::query()
            ->whereIn('id', $otherUserIds)
            ->get(['id', 'name', 'full_name', 'email', 'profile_photo_path'])
            ->keyBy('id');

        $unreadByUser = SiteMessage::query()
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->whereIn('sender_id', $otherUserIds)
            ->selectRaw('sender_id, count(*) as c')
            ->groupBy('sender_id')
            ->pluck('c', 'sender_id')
            ->toArray();

        $threads = [];
        foreach ($threadMap as $otherId => $m) {
            $u = $users->get($otherId);
            $threads[] = [
                'user' => $u ? [
                    'id' => $u->id,
                    'name' => $u->name,
                    'full_name' => $u->full_name,
                    'email' => $u->email,
                    'profile_photo_url' => method_exists($u, 'profilePhotoUrl') ? $u->profilePhotoUrl() : null,
                ] : [
                    'id' => $otherId,
                    'name' => 'Unknown',
                ],
                'last_message' => [
                    'id' => $m->id,
                    'sender_id' => (int) $m->sender_id,
                    'recipient_id' => (int) $m->recipient_id,
                    'subject' => $m->subject,
                    'body' => mb_strlen($m->body) > 160 ? mb_substr($m->body, 0, 160) . '…' : $m->body,
                    'read_at' => $m->read_at?->toISOString(),
                    'created_at' => $m->created_at?->toISOString(),
                ],
                'unread_count' => (int) ($unreadByUser[$otherId] ?? 0),
            ];
        }

        $allUsers = User::query()
            ->where('status', 'Active')
            ->orderBy('name')
            ->get(['id', 'name', 'full_name', 'email'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'full_name' => $u->full_name,
                'email' => $u->email,
            ])
            ->values();

        return Inertia::render('Messages/Index', [
            'threads' => $threads,
            'users' => $allUsers,
        ]);
    }

    public function show(Request $request, User $otherUser): Response
    {
        $user = $request->user();

        $messages = SiteMessage::query()
            ->where(function ($q) use ($user, $otherUser) {
                $q->where('sender_id', $user->id)->where('recipient_id', $otherUser->id);
            })
            ->orWhere(function ($q) use ($user, $otherUser) {
                $q->where('sender_id', $otherUser->id)->where('recipient_id', $user->id);
            })
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (SiteMessage $m) => [
                'id' => $m->id,
                'sender_id' => (int) $m->sender_id,
                'recipient_id' => (int) $m->recipient_id,
                'subject' => $m->subject,
                'body' => $m->body,
                'read_at' => $m->read_at?->toISOString(),
                'created_at' => $m->created_at?->toISOString(),
            ]);

        SiteMessage::query()
            ->where('sender_id', $otherUser->id)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return Inertia::render('Messages/Show', [
            'otherUser' => [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'full_name' => $otherUser->full_name,
                'email' => $otherUser->email,
                'profile_photo_url' => method_exists($otherUser, 'profilePhotoUrl') ? $otherUser->profilePhotoUrl() : null,
            ],
            'messages' => $messages,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'recipient_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $recipient = User::query()->findOrFail((int) $data['recipient_id']);

        SiteMessage::query()->create([
            'sender_id' => (int) $user->id,
            'recipient_id' => (int) $recipient->id,
            'subject' => $data['subject'] ?: null,
            'body' => $data['body'],
        ]);

        return redirect()->route('messages.show', ['otherUser' => $recipient->id]);
    }
}

