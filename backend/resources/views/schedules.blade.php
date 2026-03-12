<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Power Schedule</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .card-hover {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05);
        }
        .accent-available { border-left: 4px solid #22c55e; }
        .accent-picked_up { border-left: 4px solid #3b82f6; }
        .accent-released { border-left: 4px solid #f59e0b; }
    </style>
</head>
<body class="min-h-screen antialiased bg-gradient-to-b from-slate-100 via-white to-slate-50">
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {{-- Header dengan depth + info user --}}
        <header class="mb-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-6 text-white shadow-xl shadow-slate-900/20 sm:px-8 sm:py-8">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-4">
                    <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-inner">
                        <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Power Schedule</h1>
                        <p class="mt-1 text-slate-300 text-sm">Daftar jadwal maintenance dan operasi.</p>
                    </div>
                </div>
                <div class="mt-3 flex items-center gap-3 text-xs text-slate-200 sm:mt-0">
                    @auth
                        <div>
                            Login sebagai <span class="font-semibold">{{ auth()->user()->name }}</span>
                            <span class="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium ml-1.5">
                                {{ strtoupper(auth()->user()->role) }}
                            </span>
                        </div>
                        <form action="{{ route('logout') }}" method="POST">
                            @csrf
                            <button type="submit" class="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-[11px] font-medium text-slate-50 hover:bg-white/10">
                                Logout
                            </button>
                        </form>
                    @else
                        <span>Belum login.</span>
                        <a href="{{ route('login') }}" class="inline-flex items-center rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-medium text-slate-900 hover:bg-emerald-300">
                            Login
                        </a>
                    @endauth
                </div>
            </div>
        </header>

        {{-- Flash message --}}
        @if(session('status'))
            <div class="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {{ session('status') }}
            </div>
        @endif

        {{-- Form admin untuk membuat schedule baru --}}
        @auth
            @if(auth()->user()->role === 'admin')
                <div class="mb-8 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
                    <h2 class="text-sm font-semibold text-slate-800">Buat Schedule Baru</h2>
                    <p class="mt-1 text-xs text-slate-500">Sebagai admin, Anda bisa membuat jadwal yang akan di-pickup oleh tim.</p>
                    <form method="POST" action="{{ route('schedules.store.web') }}" class="mt-4 grid gap-4 sm:grid-cols-2">
                        @csrf
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-slate-600">Judul</label>
                            <input type="text" name="title" required
                                   class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                   placeholder="Contoh: Maintenance Gardu Pagi" />
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-medium text-slate-600">Deskripsi (opsional)</label>
                            <textarea name="description" rows="2"
                                      class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      placeholder="Detail singkat aktivitas yang akan dilakukan"></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-600">Mulai</label>
                            <input type="datetime-local" name="period_start" required
                                   class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-600">Selesai</label>
                            <input type="datetime-local" name="period_end" required
                                   class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div class="sm:col-span-2 flex justify-end">
                            <button type="submit"
                                    class="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                                Simpan Schedule
                            </button>
                        </div>
                    </form>
                </div>
            @endif
        @endauth

        {{-- Daftar jadwal + tombol aksi --}}
        <ul class="space-y-5">
            @forelse($schedules as $schedule)
                <li>
                    @php
                        $user = auth()->user();
                        $isAdmin = $user && $user->role === 'admin';
                        $isAssigned = $user && $schedule->assigned_to === $user->id;
                    @endphp
                    <div class="card-hover accent-{{ $schedule->status }} rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md shadow-slate-200/50 sm:p-6"
                         style="box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04);">
                        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div class="min-w-0 flex-1">
                                <h2 class="text-lg font-semibold text-slate-900 sm:text-xl">{{ $schedule->title }}</h2>
                                @if($schedule->description)
                                    <p class="mt-1.5 text-sm leading-relaxed text-slate-600">{{ $schedule->description }}</p>
                                @endif
                            </div>
                            <div class="flex flex-col items-end gap-3">
                                <span class="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm
                                    @if($schedule->status === 'available') bg-green-100 text-green-800 ring-1 ring-green-200/60
                                    @elseif($schedule->status === 'picked_up') bg-blue-100 text-blue-800 ring-1 ring-blue-200/60
                                    @elseif($schedule->status === 'released') bg-amber-100 text-amber-800 ring-1 ring-amber-200/60
                                    @else bg-slate-100 text-slate-600 ring-1 ring-slate-200/60 @endif">
                                    {{ ucfirst(str_replace('_', ' ', $schedule->status)) }}
                                </span>
                                <div class="flex flex-wrap justify-end gap-2">
                                    @auth
                                        @if($schedule->status === 'available')
                                            <form method="POST" action="{{ route('schedules.pickup', $schedule->id) }}">
                                                @csrf
                                                <button type="submit" class="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700">
                                                    Pickup
                                                </button>
                                            </form>
                                        @elseif($schedule->status === 'picked_up')
                                            @if($isAssigned || $isAdmin)
                                                <form method="POST" action="{{ route('schedules.release', $schedule->id) }}" class="inline">
                                                    @csrf
                                                    <button type="submit" class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-200">
                                                        Release
                                                    </button>
                                                </form>
                                            @endif
                                        @elseif($schedule->status === 'released')
                                            @if($isAssigned || $isAdmin)
                                                <form method="POST" action="{{ route('schedules.reopen', $schedule->id) }}" class="inline">
                                                    @csrf
                                                    <button type="submit" class="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                                                        Re-Open
                                                    </button>
                                                </form>
                                            @endif
                                        @endif
                                    @else
                                        <span class="text-[11px] text-slate-400">Login untuk melakukan aksi.</span>
                                    @endauth
                                </div>
                            </div>
                        </div>
                        <div class="mt-5 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-5 text-sm">
                            <span class="flex items-center gap-2 text-slate-500">
                                <span class="rounded-lg bg-slate-100 p-1.5 text-slate-400">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </span>
                                <span><span class="font-medium text-slate-400">Periode</span>
                                {{ \Carbon\Carbon::parse($schedule->period_start)->format('d M Y') }}
                                {{ \Carbon\Carbon::parse($schedule->period_start)->format('H:i') }} –
                                {{ \Carbon\Carbon::parse($schedule->period_end)->format('H:i') }}</span>
                            </span>
                            <span class="flex items-center gap-2 text-slate-500">
                                <span class="rounded-lg bg-slate-100 p-1.5 text-slate-400">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </span>
                                <span><span class="font-medium text-slate-400">Assigned</span> {{ $schedule->assigned_to ? '#' . $schedule->assigned_to : '—' }}</span>
                            </span>
                        </div>
                    </div>
                </li>
            @empty
                <li>
                    <div class="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-md">
                        Belum ada jadwal.
                    </div>
                </li>
            @endforelse
        </ul>
    </div>
</body>
</html>
