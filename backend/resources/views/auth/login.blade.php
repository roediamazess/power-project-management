<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - Power Schedule</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
<div class="w-full max-w-md">
    <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">Power Schedule</h1>
        <p class="mt-1 text-sm text-slate-400">Masuk untuk mengelola jadwal.</p>
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur">
        @if($errors->any())
            <div class="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="/login" class="space-y-4">
            @csrf
            <div>
                <label for="email" class="block text-xs font-medium text-slate-300">Email</label>
                <input id="email" name="email" type="email" value="{{ old('email') }}" required
                       class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            </div>

            <div>
                <label for="password" class="block text-xs font-medium text-slate-300">Password</label>
                <input id="password" name="password" type="password" required
                       class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <p class="mt-1 text-[11px] text-slate-500">Contoh akun admin awal: <span class="font-mono">admin@example.com / password</span></p>
            </div>

            <button type="submit"
                    class="mt-2 inline-flex w-full justify-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400">
                Masuk
            </button>
        </form>
    </div>
</div>
</body>
</html>

