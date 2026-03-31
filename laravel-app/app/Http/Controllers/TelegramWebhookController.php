<?php

namespace App\Http\Controllers;

use App\Services\TelegramBotCommandService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    public function handle(Request $request, TelegramBotCommandService $svc): JsonResponse
    {
        $secret = (string) env('TELEGRAM_WEBHOOK_SECRET', '');
        if ($secret !== '') {
            $hdr = (string) $request->header('X-Telegram-Bot-Api-Secret-Token', '');
            if (! hash_equals($secret, $hdr)) {
                return response()->json(['ok' => true]);
            }
        }

        $update = $request->all();
        $svc->handleUpdate($update);

        return response()->json(['ok' => true]);
    }
}

